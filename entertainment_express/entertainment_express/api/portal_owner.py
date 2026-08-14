import frappe
from frappe.utils import flt, fmt_money

OWNER_ROLES = {"EE Tenant Admin"}
DISALLOWED_ESCALATION_ROLES = {"System Manager", "SaaS Operator"}


def _require_owner() -> None:
    roles = set(frappe.get_roles(frappe.session.user) or [])
    if not roles.intersection(OWNER_ROLES):
        frappe.throw("Owner portal access denied.", frappe.PermissionError)


def _audit(action: str, details: dict) -> None:
    frappe.get_doc(
        {
            "doctype": "Comment",
            "comment_type": "Info",
            "reference_doctype": "User",
            "reference_name": frappe.session.user,
            "content": f"[PORTAL_AUDIT] {action}: {frappe.as_json(details)}",
        }
    ).insert(ignore_permissions=True)


@frappe.whitelist()
def get_owner_dashboard(from_date: str | None = None, to_date: str | None = None) -> dict:
    _require_owner()

    bookings = frappe.db.count("Event Booking", {"status": ["in", ["confirmed", "in_progress"]]})
    open_invoices = frappe.get_all(
        "Sales Invoice",
        filters={"docstatus": 1, "outstanding_amount": [">", 0]},
        fields=["outstanding_amount", "currency"],
        limit_page_length=500,
    )
    outstanding_total = flt(sum(flt(row.get("outstanding_amount")) for row in open_invoices))
    currency = (open_invoices[0].get("currency") if open_invoices else None) or frappe.db.get_default("currency") or "USD"

    pending_approvals = 0
    at_risk_count = 0
    try:
        pending_approvals = len(get_approvals())
    except Exception:
        pending_approvals = 0
    try:
        from entertainment_express.api.dispatch_realtime import build_day_view

        at_risk_count = int((build_day_view().get("summary") or {}).get("at_risk_count") or 0)
    except Exception:
        at_risk_count = 0

    jobs = []
    try:
        jobs = frappe.get_all(
            "Event Booking",
            filters={"status": ["in", ["confirmed", "in_progress", "tentative"]]},
            fields=["name", "event_name", "event_date", "start_time", "status", "venue_address", "grand_total", "balance_due", "deposit_status"],
            order_by="event_date asc",
            limit_page_length=20,
        )
        for row in jobs:
            if row.get("grand_total") is not None:
                row["grand_total"] = fmt_money(flt(row.get("grand_total")), currency=currency)
            if row.get("balance_due") is not None:
                row["balance_due"] = fmt_money(flt(row.get("balance_due")), currency=currency)
    except Exception:
        jobs = []

    unread_chat = 0
    try:
        from entertainment_express.api.portal_collaboration import unread_chat_count

        unread_chat = int(unread_chat_count() or 0)
    except Exception:
        unread_chat = 0

    return {
        "revenue": fmt_money(0, currency=currency),
        "new_bookings": bookings,
        "pipeline_value": fmt_money(0, currency=currency),
        "at_risk_count": at_risk_count,
        "pending_approvals": pending_approvals,
        "outstanding_balance": fmt_money(outstanding_total, currency=currency),
        "unread_chat": unread_chat,
        "jobs": jobs,
        "series": [],
        "from_date": from_date,
        "to_date": to_date,
    }


@frappe.whitelist()
def get_approvals() -> list[dict]:
    _require_owner()
    return []


@frappe.whitelist()
def act_on_approval(approval_type: str, doctype: str, name: str, decision: str, note: str | None = None) -> dict:
    _require_owner()

    _audit(
        "approval_decision",
        {
            "approval_type": approval_type,
            "doctype": doctype,
            "name": name,
            "decision": decision,
            "note": note,
        },
    )
    return {"ok": True, "status": decision}


@frappe.whitelist()
def get_financial_overview() -> dict:
    _require_owner()

    outstanding = frappe.get_all(
        "Sales Invoice",
        filters={"docstatus": 1, "outstanding_amount": [">", 0]},
        fields=["name", "customer", "outstanding_amount", "currency"],
        limit_page_length=20,
    )

    totals = {
        "outstanding_total": fmt_money(
            flt(sum(flt(row.get("outstanding_amount")) for row in outstanding)),
            currency=(outstanding[0].get("currency") if outstanding else None) or frappe.db.get_default("currency") or "USD",
        )
    }

    return {
        "outstanding": outstanding,
        "upcoming_payouts": [],
        "totals": totals,
    }


@frappe.whitelist()
def list_staff() -> list[dict]:
    _require_owner()

    users = frappe.get_all(
        "User",
        filters={"enabled": 1, "user_type": "System User"},
        fields=["name", "email", "full_name"],
        limit_page_length=50,
    )

    for user in users:
        user["roles"] = frappe.get_roles(user["name"])

    return users


@frappe.whitelist()
def invite_staff(email: str, full_name: str, roles: list[str]) -> dict:
    _require_owner()

    disallowed = set(roles or []).intersection(DISALLOWED_ESCALATION_ROLES)
    if disallowed:
        frappe.throw("Cannot assign restricted roles.", frappe.PermissionError)

    user = frappe.get_doc(
        {
            "doctype": "User",
            "email": email,
            "first_name": full_name,
            "send_welcome_email": 1,
            "user_type": "System User",
        }
    )
    user.insert(ignore_permissions=True)

    for role in roles or []:
        user.append("roles", {"role": role})
    user.save(ignore_permissions=True)

    _audit("invite_staff", {"user": user.name, "roles": roles or []})
    return {"user": user.name}


@frappe.whitelist()
def set_staff_roles(user: str, roles: list[str]) -> dict:
    _require_owner()

    disallowed = set(roles or []).intersection(DISALLOWED_ESCALATION_ROLES)
    if disallowed:
        frappe.throw("Cannot assign restricted roles.", frappe.PermissionError)

    doc = frappe.get_doc("User", user)
    doc.set("roles", [])
    for role in roles or []:
        doc.append("roles", {"role": role})
    doc.save(ignore_permissions=True)

    _audit("set_staff_roles", {"user": user, "roles": roles or []})
    return {"ok": True}


@frappe.whitelist()
def deactivate_staff(user: str) -> dict:
    _require_owner()

    doc = frappe.get_doc("User", user)
    doc.enabled = 0
    doc.save(ignore_permissions=True)
    _audit("deactivate_staff", {"user": user})
    return {"ok": True}
