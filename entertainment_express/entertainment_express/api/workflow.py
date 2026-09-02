"""Event-type workflow templates and owner automation toggles."""

from __future__ import annotations

import frappe
from frappe.utils import add_days, cint, flt, getdate, nowdate

from entertainment_express.api.portal_owner import OWNER_ROLES

STAFF = OWNER_ROLES | {"EE Sales", "EE Dispatcher", "System Manager"}
DEFAULT_AUTOMATIONS = {
    "deposit_chase": True,
    "planning_form_reminder": True,
    "proposal_follow_up": True,
    "unsigned_contract": True,
    "policy_expiry": True,
    "coi_required": True,
}


def _require_staff() -> None:
    roles = set(frappe.get_roles() or [])
    if not roles.intersection(STAFF):
        frappe.throw("Not allowed.", frappe.PermissionError)


def _flags() -> dict:
    try:
        settings = frappe.get_cached_doc("EE Portal Settings", "EE Portal Settings")
        raw = getattr(settings, "feature_flags", None) or "{}"
        parsed = frappe.parse_json(raw) if isinstance(raw, str) else (raw or {})
        return parsed if isinstance(parsed, dict) else {}
    except Exception:
        return {}


def automation_enabled(key: str) -> bool:
    stored = _flags().get("automations")
    autos = stored if isinstance(stored, dict) else {}
    if key not in autos:
        return DEFAULT_AUTOMATIONS.get(key, True)
    return bool(autos[key])


def apply_for_booking(booking_name: str) -> list[str]:
    """Idempotent: create EE Workflow Task rows from the matching active template."""
    if not frappe.db.table_exists("EE Workflow Template"):
        return []
    booking = frappe.get_doc("Event Booking", booking_name)
    if cint(getattr(booking, "is_template", 0)):
        return []
    event_type = (getattr(booking, "event_type", None) or "").strip().lower()
    if not event_type:
        return []
    templates = frappe.get_all(
        "EE Workflow Template",
        filters={"active": 1},
        fields=["name", "event_type"],
    )
    created = []
    for tmpl in templates:
        tmpl_type = (tmpl.event_type or "").strip().lower()
        if tmpl_type != event_type:
            continue
        if frappe.db.exists("EE Workflow Task", {"booking": booking_name, "template": tmpl.name}):
            continue
        doc = frappe.get_doc("EE Workflow Template", tmpl.name)
        event_date = getdate(booking.event_date)
        for task in doc.tasks or []:
            row = frappe.get_doc(
                {
                    "doctype": "EE Workflow Task",
                    "booking": booking_name,
                    "template": tmpl.name,
                    "template_task": task.name,
                    "title": task.title,
                    "due_date": add_days(event_date, cint(task.offset_days)),
                    "role": task.role,
                    "status": "open",
                    "action_key": task.action_key or "custom",
                }
            )
            row.insert(ignore_permissions=True)
            created.append(row.name)
    return created


@frappe.whitelist()
def list_templates() -> list[dict]:
    _require_staff()
    if not frappe.db.table_exists("EE Workflow Template"):
        return []
    rows = []
    for tmpl in frappe.get_all(
        "EE Workflow Template",
        fields=["name", "template_name", "event_type", "active"],
        order_by="template_name asc",
        limit_page_length=50,
    ):
        tasks = frappe.get_all(
            "EE Workflow Template Task",
            filters={"parent": tmpl.name},
            fields=["title", "offset_days", "role", "action_key"],
            order_by="idx asc",
        )
        rows.append(
            {
                "id": tmpl.name,
                "name": tmpl.template_name or tmpl.name,
                "event_type": tmpl.event_type or "",
                "active": bool(tmpl.active),
                "tasks": [
                    {
                        "title": t.title,
                        "offset_days": cint(t.offset_days),
                        "role": t.role or "",
                        "action": t.action_key or "custom",
                    }
                    for t in tasks
                ],
            }
        )
    return rows


@frappe.whitelist()
def get_automations() -> dict:
    _require_staff()
    autos = dict(DEFAULT_AUTOMATIONS)
    stored = _flags().get("automations") or {}
    if isinstance(stored, dict):
        for key, default in DEFAULT_AUTOMATIONS.items():
            autos[key] = bool(stored[key]) if key in stored else default
    return {
        "toggles": [
            {"key": "deposit_chase", "label": "Chase unpaid deposits", "enabled": autos["deposit_chase"]},
            {"key": "planning_form_reminder", "label": "Remind clients to finish planning", "enabled": autos["planning_form_reminder"]},
            {"key": "proposal_follow_up", "label": "Follow up on unsigned proposals", "enabled": autos["proposal_follow_up"]},
            {"key": "unsigned_contract", "label": "Nudge unsigned contracts", "enabled": autos["unsigned_contract"]},
            {"key": "policy_expiry", "label": "Remind when coverage is about to expire", "enabled": autos["policy_expiry"]},
            {"key": "coi_required", "label": "Remind when a job still needs a certificate", "enabled": autos["coi_required"]},
        ],
        "templates": list_templates(),
    }


@frappe.whitelist()
def set_automation(key: str, enabled: int = 1) -> dict:
    from entertainment_express.api.portal_owner import _require_owner

    _require_owner()
    if key not in DEFAULT_AUTOMATIONS:
        frappe.throw("Unknown reminder.")
    flags = dict(_flags())
    autos = dict(flags.get("automations") or {})
    autos[key] = bool(cint(enabled))
    flags["automations"] = autos
    if not frappe.db.exists("EE Portal Settings", "EE Portal Settings"):
        frappe.get_doc({"doctype": "EE Portal Settings"}).insert(ignore_permissions=True)
    frappe.db.set_single_value("EE Portal Settings", "feature_flags", frappe.as_json(flags))
    return get_automations()


@frappe.whitelist()
def list_open_tasks() -> list[dict]:
    _require_staff()
    if not frappe.db.table_exists("EE Workflow Task"):
        return []
    rows = frappe.get_all(
        "EE Workflow Task",
        filters={"status": "open"},
        fields=["name", "title", "due_date", "booking", "role", "action_key"],
        order_by="due_date asc",
        limit_page_length=50,
    )
    out = []
    for row in rows:
        event_name = frappe.db.get_value("Event Booking", row.booking, "event_name") if row.booking else ""
        out.append(
            {
                "type": "workflow",
                "id": row.name,
                "name": row.name,
                "doctype": "EE Workflow Task",
                "summary": row.title or "Open task",
                "date": str(row.due_date or ""),
                "event": event_name or row.booking or "",
                "role": row.role or "",
            }
        )
    return out


@frappe.whitelist()
def complete_task(name: str, decision: str = "approved") -> dict:
    _require_staff()
    doc = frappe.get_doc("EE Workflow Task", name)
    doc.status = "done" if decision == "approved" else "dismissed"
    doc.save(ignore_permissions=True)
    return {"ok": True, "status": doc.status}


def run_daily():
    """Follow-ups gated by tenant automation toggles. Fail open."""
    if automation_enabled("proposal_follow_up"):
        _follow_up_proposals()
    if automation_enabled("deposit_chase"):
        _chase_deposits()
    if automation_enabled("unsigned_contract"):
        _nudge_unsigned_contracts()


def _follow_up_proposals():
    if not frappe.get_meta("Quotation").has_field("ee_proposal_status"):
        return
    from entertainment_express.notifications import send

    for quote in frappe.get_all(
        "Quotation",
        filters={"ee_proposal_status": ["in", ["sent", "viewed"]], "docstatus": ["<", 2]},
        fields=["name", "party_name"],
        limit_page_length=50,
    ):
        email = frappe.db.get_value("Customer", quote.party_name, "email_id")
        if not email:
            continue
        try:
            send("quote_followup", email, {"customer_name": quote.party_name, "quote_number": quote.name, "event_date": ""})
        except Exception:
            frappe.logger().error("proposal follow-up failed")


def _chase_deposits():
    from entertainment_express.notifications import send

    filters = {"docstatus": 1, "outstanding_amount": [">", 0]}
    if frappe.get_meta("Sales Invoice").has_field("ee_is_deposit"):
        filters["ee_is_deposit"] = 1
    for inv in frappe.get_all("Sales Invoice", filters=filters, fields=["name", "customer"], limit_page_length=50):
        email = frappe.db.get_value("Customer", inv.customer, "email_id")
        if not email:
            continue
        try:
            send("deposit_receipt", email, {"customer_name": inv.customer, "invoice": inv.name, "pay_link": "/client/pay"})
        except Exception:
            frappe.logger().error("deposit chase failed")


def _nudge_unsigned_contracts():
    from entertainment_express.notifications import send

    if not frappe.db.table_exists("EE Contract"):
        return
    for row in frappe.get_all("EE Contract", filters={"status": ["in", ["sent", "viewed"]]}, fields=["name", "signer_email", "signer_name"], limit_page_length=50):
        if not row.signer_email:
            continue
        try:
            send("contract_sent", row.signer_email, {"signer_name": row.signer_name, "contract_name": row.name, "sign_link": "/client/documents", "expires_at": "", "company_name": ""})
        except Exception:
            frappe.logger().error("unsigned contract nudge failed")
