"""Message preferences and templates for /owner, /employee, and /client. Message language, never DocType names."""

from __future__ import annotations

import os

import frappe
from frappe.utils import cint

from entertainment_express.api.portal_employee import EMPLOYEE_ROLES
from entertainment_express.api.portal_owner import OWNER_ROLES

OWNER = OWNER_ROLES | {"System Manager"}
ANY_PORTAL = OWNER | EMPLOYEE_ROLES | {"EE Customer"}


def _roles() -> set[str]:
    return set(frappe.get_roles(frappe.session.user) or [])


def _require_signed_in() -> set[str]:
    roles = _roles()
    if not roles.intersection(ANY_PORTAL):
        frappe.throw("Message access denied.", frappe.PermissionError)
    return roles


def _require_owner() -> None:
    user = getattr(getattr(frappe, "session", None), "user", None)
    if user == "Administrator":
        return
    if not _roles().intersection(OWNER):
        frappe.throw("Message access denied.", frappe.PermissionError)


def _party_for_user() -> tuple[str, str]:
    user = frappe.session.user
    roles = _roles()
    if "EE Customer" in roles and not roles.intersection(OWNER | EMPLOYEE_ROLES):
        customer = frappe.db.get_value("Customer", {"email_id": user}, "name")
        if customer:
            return "Customer", customer
    employee = frappe.db.get_value("Employee", {"user_id": user}, "name")
    if employee:
        return "Employee", employee
    return "User", user


def _values(values) -> dict:
    values = values or frappe.form_dict.get("values") or {}
    if isinstance(values, str):
        values = frappe.parse_json(values) if hasattr(frappe, "parse_json") else {}
    return values or {}


@frappe.whitelist()
def get_my_preferences() -> dict:
    _require_signed_in()
    party_type, party = _party_for_user()
    name = frappe.db.get_value("Notification Preference", {"party_type": party_type, "party": party}, "name")
    if not name:
        return {
            "party_type": party_type,
            "email": 1,
            "sms": 0,
            "whatsapp": 0,
            "push": 0,
            "quiet_from": "",
            "quiet_to": "",
        }
    row = frappe.db.get_value(
        "Notification Preference",
        name,
        ["email_opt_in", "sms_opt_in", "whatsapp_opt_in", "push_opt_in", "quiet_hours_start", "quiet_hours_end"],
        as_dict=True,
    )
    return {
        "party_type": party_type,
        "email": cint(row.email_opt_in),
        "sms": cint(row.sms_opt_in),
        "whatsapp": cint(row.whatsapp_opt_in),
        "push": cint(row.push_opt_in),
        "quiet_from": str(row.quiet_hours_start or ""),
        "quiet_to": str(row.quiet_hours_end or ""),
    }


@frappe.whitelist()
def save_my_preferences(values: dict | None = None) -> dict:
    _require_signed_in()
    values = _values(values)
    party_type, party = _party_for_user()
    payload = {
        "email_opt_in": 1 if values.get("email", values.get("email_opt_in", 1)) else 0,
        "sms_opt_in": 1 if values.get("sms", values.get("sms_opt_in", 0)) else 0,
        "whatsapp_opt_in": 1 if values.get("whatsapp", values.get("whatsapp_opt_in", 0)) else 0,
        "push_opt_in": 1 if values.get("push", values.get("push_opt_in", 0)) else 0,
        "quiet_hours_start": values.get("quiet_from") or values.get("quiet_hours_start") or None,
        "quiet_hours_end": values.get("quiet_to") or values.get("quiet_hours_end") or None,
    }
    name = frappe.db.get_value("Notification Preference", {"party_type": party_type, "party": party}, "name")
    if name:
        doc = frappe.get_doc("Notification Preference", name)
        doc.update(payload)
        doc.save(ignore_permissions=True)
    else:
        doc = frappe.get_doc({"doctype": "Notification Preference", "party_type": party_type, "party": party, **payload})
        doc.insert(ignore_permissions=True)
    frappe.db.commit()
    return {"ok": True}


@frappe.whitelist()
def list_templates() -> list[dict]:
    _require_owner()
    rows = frappe.get_all(
        "Notification Template",
        fields=["name", "template_key", "subject", "channels", "fallback_channel", "priority", "active", "body_html"],
        order_by="template_key asc",
        limit_page_length=150,
    )
    out = []
    for row in rows:
        out.append(
            {
                "id": row.name,
                "key": row.template_key or row.name,
                "title": (row.template_key or row.name or "").replace("_", " ").title(),
                "subject": row.subject or "",
                "channels": row.channels or "email",
                "fallback": row.fallback_channel or "email",
                "priority": row.priority or "transactional",
                "active": cint(row.active),
                "body": row.body_html or "",
            }
        )
    return out


@frappe.whitelist()
def save_template(name: str | None = None, values: dict | None = None) -> dict:
    _require_owner()
    values = _values(values)
    target_name = name or values.get("id") or values.get("name")
    raw_key = values.get("key") or target_name or ""
    key = raw_key.strip().lower().replace(" ", "_")
    if not key and not target_name:
        frappe.throw("Please specify a template name or key.")

    if target_name and frappe.db.exists("Notification Template", target_name):
        doc = frappe.get_doc("Notification Template", target_name)
    elif key and frappe.db.exists("Notification Template", key):
        doc = frappe.get_doc("Notification Template", key)
    else:
        doc = frappe.get_doc({
            "doctype": "Notification Template",
            "name": key or target_name,
            "template_key": key or target_name,
            "subject": values.get("subject") or "Notification",
            "body_html": values.get("body") or values.get("body_html") or "",
            "channels": values.get("channels") or "email",
            "fallback_channel": values.get("fallback") or values.get("fallback_channel") or "email",
            "priority": values.get("priority") or "transactional",
            "active": cint(values.get("active", 1)),
        })
        doc.insert(ignore_permissions=True)

    if values.get("subject") is not None:
        doc.subject = values.get("subject")
    if values.get("body") is not None or values.get("body_html") is not None:
        doc.body_html = values.get("body") or values.get("body_html")
    if values.get("channels") is not None:
        doc.channels = values.get("channels")
    if values.get("fallback") is not None:
        doc.fallback_channel = values.get("fallback")
    if values.get("priority") is not None:
        doc.priority = values.get("priority")
    if values.get("active") is not None:
        doc.active = cint(values.get("active"))
    doc.save(ignore_permissions=True)
    frappe.db.commit()
    return {"id": doc.name, "key": doc.template_key}


@frappe.whitelist()
def delete_template(name: str | None = None, key: str | None = None) -> dict:
    _require_owner()
    target = name or key or frappe.form_dict.get("name") or frappe.form_dict.get("key")
    if not target:
        frappe.throw("Please specify a template to delete.")
    if frappe.db.exists("Notification Template", target):
        frappe.delete_doc("Notification Template", target, ignore_permissions=True)
        frappe.db.commit()
    return {"ok": True}


@frappe.whitelist()
def list_recent() -> list[dict]:
    _require_owner()
    rows = frappe.get_all(
        "Notification Log",
        fields=["name", "recipient", "channel", "template_key", "status", "error", "creation"],
        order_by="creation desc",
        limit_page_length=50,
    )
    return [
        {
            "id": row.name,
            "to": row.recipient,
            "channel": row.channel,
            "title": (row.template_key or "").replace("_", " "),
            "status": row.status,
            "note": row.error or "",
            "when": str(row.creation or ""),
        }
        for row in rows
    ]


@frappe.whitelist()
def channel_status() -> dict:
    _require_owner()
    twilio = bool(os.environ.get("EE_TWILIO_ACCOUNT_SID") and os.environ.get("EE_TWILIO_AUTH_TOKEN") and os.environ.get("EE_TWILIO_FROM"))
    fcm = bool(os.environ.get("EE_FCM_SERVER_KEY"))
    return {
        "email": True,
        "sms": twilio,
        "whatsapp": bool(twilio and os.environ.get("EE_TWILIO_WHATSAPP_FROM")),
        "push": fcm,
    }
