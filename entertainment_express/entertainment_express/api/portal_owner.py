import frappe
from frappe.utils import flt, fmt_money

OWNER_ROLES = {"EE Tenant Admin"}
DISALLOWED_ESCALATION_ROLES = {"System Manager", "SaaS Operator"}
STAFF_ROLE_LABELS = {
    "EE Sales": "Sales",
    "EE Dispatcher": "Dispatch",
    "EE Crew": "Field crew",
    "EE Entertainer": "Talent",
    "EE Accounting": "Money",
    "EE Office": "Office",
    "EE Marketing": "Marketing",
}
FIELD_ACCESS = {"EE Dispatcher", "EE Crew", "EE Entertainer"}


def _as_role_list(value) -> list[str]:
    if value is None:
        return []
    if isinstance(value, str):
        text = value.strip()
        if text.startswith("["):
            parsed = frappe.parse_json(text) if hasattr(frappe, "parse_json") else None
            return list(parsed or [])
        return [part.strip() for part in text.split(",") if part.strip()]
    return list(value)


def ensure_employee_for_user(user_name: str, full_name: str, roles: list[str]) -> None:
    """Create an Active Employee so invited field staff show up in dispatch."""
    if user_name in ("Administrator", "Guest"):
        return
    if not set(roles or []).intersection(FIELD_ACCESS):
        return
    if frappe.db.exists("Employee", {"user_id": user_name}):
        return
    company = frappe.db.get_default("company") or frappe.db.get_single_value("Global Defaults", "default_company")
    if not company:
        return
    parts = (full_name or user_name.split("@")[0]).strip().split()
    first = parts[0] if parts else user_name
    last = " ".join(parts[1:]) if len(parts) > 1 else first
    labels = []
    if "EE Entertainer" in (roles or []):
        labels.append("Talent")
    if set(roles or []).intersection({"EE Crew", "EE Dispatcher"}):
        labels.append("Field")
    for label in labels:
        if not frappe.db.exists("EE Crew Role", label):
            frappe.get_doc({"doctype": "EE Crew Role", "role_name": label, "active": 1}).insert(ignore_permissions=True)
    payload = {
        "doctype": "Employee",
        "first_name": first,
        "last_name": last,
        "employee_name": full_name or first,
        "status": "Active",
        "date_of_joining": frappe.utils.nowdate() if hasattr(frappe.utils, "nowdate") else frappe.utils.today(),
        "company": company,
        "user_id": user_name,
        "ee_crew_roles": ",".join(labels),
        "ee_employment_type": "1099",
        "ee_pay_basis": "per_event",
        "gender": "Other",
    }
    if hasattr(frappe.db, "table_exists") and frappe.db.table_exists("Gender"):
        payload["gender"] = frappe.db.get_value("Gender", {}, "name") or payload["gender"]
    frappe.get_doc(payload).insert(ignore_permissions=True)


def backfill_field_employees() -> None:
    users = frappe.get_all(
        "User",
        filters={"enabled": 1, "user_type": "System User", "name": ["not in", ["Administrator", "Guest"]]},
        fields=["name", "full_name"],
        limit_page_length=200,
    )
    for user in users:
        roles = [role for role in (frappe.get_roles(user["name"]) or []) if role in FIELD_ACCESS]
        if roles:
            try:
                ensure_employee_for_user(user["name"], user.get("full_name") or user["name"], roles)
            except Exception:
                pass


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


def _planning_percent(booking: str | None) -> float | None:
    if not booking or not getattr(frappe.db, "table_exists", lambda *_: False)("Planning Form Instance"):
        return None
    row = frappe.db.get_value(
        "Planning Form Instance",
        {"booking": booking},
        "completion_percent",
    )
    if row is None:
        return None
    return flt(row)


@frappe.whitelist()
def get_owner_dashboard(from_date: str | None = None, to_date: str | None = None) -> dict:
    _require_owner()

    from entertainment_express.api.portal_crud import _not_template_filters

    bookings = frappe.db.count("Event Booking", _not_template_filters({"status": ["in", ["confirmed", "in_progress"]]}))
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
            filters=_not_template_filters({"status": ["in", ["confirmed", "in_progress", "tentative"]]}),
            fields=["name", "event_name", "event_date", "start_time", "status", "venue_address", "grand_total", "balance_due", "deposit_status"],
            order_by="event_date asc",
            limit_page_length=20,
        )
        for row in jobs:
            if row.get("grand_total") is not None:
                row["grand_total"] = fmt_money(flt(row.get("grand_total")), currency=currency)
            if row.get("balance_due") is not None:
                row["balance_due"] = fmt_money(flt(row.get("balance_due")), currency=currency)
            row["planning_percent"] = _planning_percent(row.get("name"))
            row["planning_incomplete"] = row["planning_percent"] is not None and flt(row["planning_percent"]) < 100
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
    rows = []
    try:
        for todo in frappe.get_all(
            "ToDo",
            filters={"status": "Open"},
            fields=["name", "description", "allocated_to", "date", "reference_type", "reference_name"],
            order_by="modified desc",
            limit_page_length=20,
        ):
            rows.append(
                {
                    "type": "todo",
                    "id": todo.name,
                    "name": todo.name,
                    "doctype": "ToDo",
                    "summary": todo.description or "Open task",
                    "allocated_to": todo.allocated_to,
                    "date": str(todo.date or ""),
                }
            )
    except Exception:
        rows = []
    try:
        from entertainment_express.api.workflow import list_open_tasks

        rows.extend(list_open_tasks())
    except Exception:
        pass
    try:
        if frappe.db.table_exists("EE Booking Change"):
            for row in frappe.get_all(
                "EE Booking Change",
                filters={"status": "pending"},
                fields=["name", "booking", "request_type", "requested_date"],
                order_by="modified desc",
                limit_page_length=20,
            ):
                event = frappe.db.get_value("Event Booking", row.booking, "event_name") if row.booking else row.booking
                label = {"reschedule": "Date change", "add_on": "Add-on", "cancel": "Cancel"}.get(row.request_type, "Change")
                rows.append(
                    {
                        "type": "booking_change",
                        "id": row.name,
                        "name": row.name,
                        "doctype": "EE Booking Change",
                        "summary": f"{label} · {event or row.booking}",
                        "date": str(row.requested_date or ""),
                    }
                )
    except Exception:
        pass
    try:
        if frappe.db.table_exists("EE Field Issue"):
            for row in frappe.get_all(
                "EE Field Issue",
                filters={"status": "open"},
                fields=["name", "booking", "kind", "detail"],
                order_by="modified desc",
                limit_page_length=20,
            ):
                event = frappe.db.get_value("Event Booking", row.booking, "event_name") if row.booking else row.booking
                labels = {"damage": "Damage", "no_show": "No-show", "access": "Access", "other": "On-site issue"}
                rows.append(
                    {
                        "type": "field_issue",
                        "id": row.name,
                        "name": row.name,
                        "doctype": "EE Field Issue",
                        "summary": f"{labels.get(row.kind, 'Issue')} · {event or row.booking}",
                        "date": "",
                    }
                )
    except Exception:
        pass
    return rows


@frappe.whitelist()
def act_on_approval(approval_type: str, doctype: str, name: str, decision: str, note: str | None = None) -> dict:
    _require_owner()

    if doctype == "ToDo":
        doc = frappe.get_doc("ToDo", name)
        doc.status = "Closed" if decision == "approved" else "Cancelled"
        doc.save(ignore_permissions=True)
    elif doctype == "EE Workflow Task":
        from entertainment_express.api.workflow import complete_task

        complete_task(name, decision)
    elif doctype == "EE Booking Change":
        from entertainment_express.api.booking_changes import decide_change

        decide_change(name, decision)
    elif doctype == "EE Field Issue":
        doc = frappe.get_doc("EE Field Issue", name)
        doc.status = "acked"
        doc.save(ignore_permissions=True)

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
        filters={"enabled": 1, "user_type": "System User", "name": ["not in", ["Administrator", "Guest"]]},
        fields=["name", "email", "full_name"],
        limit_page_length=50,
    )

    staff = []
    for user in users:
        roles = [role for role in frappe.get_roles(user["name"]) if role in STAFF_ROLE_LABELS or role in OWNER_ROLES]
        if not roles:
            continue
        user["roles"] = [role for role in roles if role in STAFF_ROLE_LABELS]
        user["access"] = ", ".join(
            STAFF_ROLE_LABELS.get(role, "Owner" if role in OWNER_ROLES else role) for role in roles
        )
        staff.append(user)

    return staff


@frappe.whitelist()
def invite_staff(email: str, full_name: str, roles: list[str]) -> dict:
    _require_owner()

    roles = _as_role_list(roles)
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
    ensure_employee_for_user(user.name, full_name, roles)

    _audit("invite_staff", {"user": user.name, "roles": roles or []})
    return {"user": user.name}


@frappe.whitelist()
def set_staff_roles(user: str, roles: list[str]) -> dict:
    _require_owner()

    roles = _as_role_list(roles)
    disallowed = set(roles or []).intersection(DISALLOWED_ESCALATION_ROLES)
    if disallowed:
        frappe.throw("Cannot assign restricted roles.", frappe.PermissionError)

    doc = frappe.get_doc("User", user)
    doc.set("roles", [])
    for role in roles or []:
        doc.append("roles", {"role": role})
    doc.save(ignore_permissions=True)
    ensure_employee_for_user(user, doc.full_name or user, roles)

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


@frappe.whitelist()
def get_brand() -> dict:
    _require_owner()
    try:
        settings = frappe.get_cached_doc("EE Portal Settings", "EE Portal Settings")
        return {
            "brand_name": getattr(settings, "brand_name", None) or "",
            "brand_color": getattr(settings, "brand_color", None) or "#0f766e",
            "brand_logo": getattr(settings, "brand_logo", None) or "",
        }
    except Exception:
        return {"brand_name": "", "brand_color": "#0f766e", "brand_logo": ""}


@frappe.whitelist()
def save_brand(brand_name: str | None = None, brand_color: str | None = None) -> dict:
    _require_owner()
    if not frappe.db.exists("EE Portal Settings", "EE Portal Settings"):
        frappe.get_doc({"doctype": "EE Portal Settings"}).insert(ignore_permissions=True)
    settings = frappe.get_single("EE Portal Settings")
    if brand_name is not None:
        settings.brand_name = brand_name
    if brand_color is not None:
        settings.brand_color = brand_color
    settings.save(ignore_permissions=True)
    _audit("save_brand", {"brand_name": brand_name, "brand_color": brand_color})
    return {"ok": True}
