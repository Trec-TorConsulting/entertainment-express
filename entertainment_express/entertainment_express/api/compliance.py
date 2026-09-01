"""Policies, COI, waivers, damage-hold wrap. Money via flt + fmt_money. Guests never sign or hold."""

from __future__ import annotations

import hashlib

import frappe
from frappe.utils import add_days, cint, flt, fmt_money, now_datetime, nowdate

from entertainment_express.api.portal_owner import OWNER_ROLES

STAFF = OWNER_ROLES | {"EE Sales", "EE Dispatcher", "EE Accounting", "System Manager"}
GUEST_ROLE = "EE Event Guest"
PAYER_ROLE = "EE Customer"


def _require_staff() -> None:
    roles = set(frappe.get_roles() or [])
    if GUEST_ROLE in roles and PAYER_ROLE not in roles:
        frappe.throw("Not allowed.", frappe.PermissionError)
    if not roles.intersection(STAFF):
        frappe.throw("Not allowed.", frappe.PermissionError)


def _deny_guest() -> None:
    roles = set(frappe.get_roles() or [])
    if GUEST_ROLE in roles and PAYER_ROLE not in roles:
        frappe.throw("Only the host can do this.", frappe.PermissionError)


def _require_payer() -> None:
    _deny_guest()
    roles = set(frappe.get_roles() or [])
    if PAYER_ROLE not in roles and not roles.intersection(OWNER_ROLES):
        frappe.throw("Not allowed.", frappe.PermissionError)


def _money(amount) -> str:
    return fmt_money(flt(amount), currency=frappe.db.get_default("currency") or "USD")


def _notify(key: str, email: str, ctx: dict) -> None:
    if not email:
        return
    try:
        from entertainment_express.notifications import send

        send(key, email, ctx)
    except Exception:
        frappe.logger().error("compliance notify failed")


@frappe.whitelist()
def list_policies() -> list[dict]:
    _require_staff()
    if not frappe.db.table_exists("EE Insurance Policy"):
        return []
    rows = []
    for row in frappe.get_all(
        "EE Insurance Policy",
        fields=["name", "provider", "policy_number", "coverage", "expires_on", "active"],
        order_by="expires_on asc",
        limit_page_length=50,
    ):
        rows.append(
            {
                "id": row.name,
                "provider": row.provider,
                "number": row.policy_number or "",
                "coverage": row.coverage or "",
                "expires": str(row.expires_on or ""),
                "active": bool(row.active),
            }
        )
    return rows


@frappe.whitelist()
def save_policy(values: dict | str | None = None, name: str | None = None) -> dict:
    _require_staff()
    if isinstance(values, str):
        values = frappe.parse_json(values) or {}
    values = values or {}
    payload = {
        "provider": (values.get("provider") or "").strip(),
        "policy_number": values.get("number") or "",
        "coverage": values.get("coverage") or "",
        "effective_on": values.get("starts") or None,
        "expires_on": values.get("expires") or None,
        "file": values.get("file") or "",
        "active": 1 if cint(values.get("active", 1)) else 0,
    }
    if not payload["provider"]:
        frappe.throw("Provider is required.")
    if name:
        doc = frappe.get_doc("EE Insurance Policy", name)
        doc.update(payload)
        doc.save()
    else:
        doc = frappe.get_doc({"doctype": "EE Insurance Policy", **payload})
        doc.insert()
    return {"id": doc.name}


@frappe.whitelist()
def job_risk(booking: str) -> dict:
    _require_staff()
    doc = frappe.get_doc("Event Booking", booking)
    venue = None
    if getattr(doc, "venue", None) and frappe.db.exists("EE Venue", doc.venue):
        venue = frappe.get_doc("EE Venue", doc.venue)
    coi = None
    if frappe.db.table_exists("EE Certificate of Insurance"):
        coi = frappe.db.get_value(
            "EE Certificate of Insurance",
            {"booking": booking},
            ["name", "status", "file"],
            as_dict=True,
        )
    waivers = []
    if frappe.db.table_exists("EE Waiver"):
        for row in frappe.get_all(
            "EE Waiver",
            filters={"booking": booking},
            fields=["name", "status", "signer_name", "signed_at"],
        ):
            waivers.append(
                {
                    "id": row.name,
                    "status": row.status,
                    "signer": row.signer_name or "",
                    "signed_at": str(row.signed_at or ""),
                    "can_sign": row.status == "pending",
                }
            )
    hold_status = getattr(doc, "ee_damage_hold_status", None) or "none"
    coi_needed = bool(venue and cint(venue.coi_required) and (not coi or coi.status != "delivered"))
    from entertainment_express.api.vendors import _assignments_for

    return {
        "venue_id": doc.venue if getattr(doc, "venue", None) else "",
        "venue_name": venue.venue_name if venue else "",
        "coi_required": bool(venue and cint(venue.coi_required)),
        "coi_needed": coi_needed,
        "coi": {"id": coi.name, "status": coi.status, "file": coi.file or ""} if coi else None,
        "waivers": waivers,
        "hold_status": hold_status,
        "hold_invoice": getattr(doc, "ee_damage_hold_invoice", None) or "",
        "event_insurance": bool(cint(getattr(doc, "ee_event_insurance", 0))),
        "event_insurance_amount": _money(getattr(doc, "ee_event_insurance_amount", 0)),
        "vendors": _assignments_for(booking),
        "load_in": getattr(doc, "load_in_notes", None) or "",
        "parking": getattr(doc, "parking_notes", None) or "",
        "power": getattr(doc, "power_notes", None) or "",
        "curfew": getattr(doc, "noise_curfew", None) or "",
    }


@frappe.whitelist()
def save_coi(booking: str, file: str = "", additional_insured: str = "", status: str = "delivered") -> dict:
    _require_staff()
    existing = frappe.db.get_value("EE Certificate of Insurance", {"booking": booking}, "name")
    payload = {
        "booking": booking,
        "venue": frappe.db.get_value("Event Booking", booking, "venue"),
        "status": status if status in ("requested", "issued", "delivered") else "delivered",
        "additional_insured": additional_insured,
        "file": file,
        "issued_on": nowdate() if status == "delivered" else None,
    }
    if existing:
        doc = frappe.get_doc("EE Certificate of Insurance", existing)
        doc.update(payload)
        doc.save()
    else:
        doc = frappe.get_doc({"doctype": "EE Certificate of Insurance", **payload})
        doc.insert()
    return {"id": doc.name, "status": doc.status}


@frappe.whitelist()
def save_waiver_template(values: dict | str | None = None, name: str | None = None) -> dict:
    _require_staff()
    if isinstance(values, str):
        values = frappe.parse_json(values) or {}
    values = values or {}
    title = (values.get("title") or "").strip()
    if not title:
        frappe.throw("Title is required.")
    payload = {
        "title": title,
        "event_types": values.get("event_types") or "",
        "body": values.get("body") or "",
        "active": 1 if cint(values.get("active", 1)) else 0,
    }
    if name:
        doc = frappe.get_doc("EE Waiver Template", name)
        doc.update(payload)
        doc.save()
    else:
        doc = frappe.get_doc({"doctype": "EE Waiver Template", **payload})
        doc.insert()
    return {"id": doc.name, "title": doc.title}


@frappe.whitelist()
def list_waiver_templates() -> list[dict]:
    _require_staff()
    if not frappe.db.table_exists("EE Waiver Template"):
        return []
    return [
        {"id": r.name, "title": r.title, "event_types": r.event_types or "", "active": bool(r.active), "body": r.body or ""}
        for r in frappe.get_all(
            "EE Waiver Template",
            fields=["name", "title", "event_types", "active", "body"],
            order_by="title asc",
        )
    ]


@frappe.whitelist()
def issue_waiver(booking: str, template: str) -> dict:
    _require_staff()
    if frappe.db.exists("EE Waiver", {"booking": booking, "template": template, "status": "pending"}):
        name = frappe.db.get_value("EE Waiver", {"booking": booking, "template": template, "status": "pending"}, "name")
        return {"id": name}
    doc = frappe.get_doc({"doctype": "EE Waiver", "booking": booking, "template": template, "status": "pending"})
    doc.insert()
    customer = frappe.db.get_value("Event Booking", booking, "customer")
    email = frappe.db.get_value("Customer", customer, "email_id") if customer else ""
    _notify("waiver_needed", email or "", {"event_name": frappe.db.get_value("Event Booking", booking, "event_name") or ""})
    return {"id": doc.name}


@frappe.whitelist()
def list_my_waivers() -> list[dict]:
    _require_payer()
    customer = frappe.db.get_value("Customer", {"email_id": frappe.session.user}, "name")
    if not customer or not frappe.db.table_exists("EE Waiver"):
        return []
    bookings = frappe.get_all("Event Booking", filters={"customer": customer}, pluck="name")
    if not bookings:
        return []
    rows = []
    for row in frappe.get_all(
        "EE Waiver",
        filters={"booking": ["in", bookings]},
        fields=["name", "booking", "template", "status", "signer_name", "signed_at"],
        order_by="modified desc",
        limit_page_length=40,
    ):
        title = frappe.db.get_value("EE Waiver Template", row.template, "title") if row.template else "Waiver"
        body = frappe.db.get_value("EE Waiver Template", row.template, "body") if row.template else ""
        rows.append(
            {
                "id": row.name,
                "kind": "waiver",
                "title": title or "Waiver",
                "body": body or "",
                "status": row.status,
                "event": frappe.db.get_value("Event Booking", row.booking, "event_name") or row.booking,
                "can_sign": row.status == "pending",
                "signer_name": row.signer_name or "",
                "signed_at": str(row.signed_at or ""),
            }
        )
    return rows


@frappe.whitelist()
def sign_waiver(name: str, signer_name: str) -> dict:
    _require_payer()
    doc = frappe.get_doc("EE Waiver", name)
    customer = frappe.db.get_value("Customer", {"email_id": frappe.session.user}, "name")
    booking_customer = frappe.db.get_value("Event Booking", doc.booking, "customer")
    if customer and booking_customer and customer != booking_customer:
        frappe.throw("Not allowed.", frappe.PermissionError)
    signer_name = (signer_name or "").strip()
    if not signer_name:
        frappe.throw("Name is required.")
    ip = ""
    try:
        ip = frappe.local.request_ip or ""
    except Exception:
        ip = ""
    stamp = str(now_datetime())
    doc.status = "signed"
    doc.signer_name = signer_name[:140]
    doc.signer_email = frappe.session.user
    doc.signed_at = now_datetime()
    doc.signer_ip = ip[:40]
    doc.signature_hash = hashlib.sha256(f"{name}:{signer_name}:{stamp}:{ip}".encode()).hexdigest()[:40]
    doc.save(ignore_permissions=True)
    return {"ok": True, "status": "signed", "signed_at": str(doc.signed_at)}


@frappe.whitelist()
def place_hold(booking: str, amount: float) -> dict:
    _require_staff()
    from entertainment_express.api.billing import create_damage_hold

    result = create_damage_hold(booking, amount)
    frappe.db.set_value(
        "Event Booking",
        booking,
        {"ee_damage_hold_invoice": result.get("invoice"), "ee_damage_hold_status": "held"},
    )
    return {"status": "held", "invoice": result.get("invoice"), "amount": _money(amount)}


@frappe.whitelist()
def capture_hold(booking: str, amount: float | None = None) -> dict:
    _require_staff()
    from entertainment_express.api.billing import capture_hold as _capture

    invoice = frappe.db.get_value("Event Booking", booking, "ee_damage_hold_invoice")
    if not invoice:
        frappe.throw("No hold on this job.")
    result = _capture(invoice, amount)
    frappe.db.set_value("Event Booking", booking, "ee_damage_hold_status", "captured")
    return {"status": "captured", "processor": result.get("status")}


@frappe.whitelist()
def release_hold(booking: str) -> dict:
    _require_staff()
    from entertainment_express.api.billing import release_hold as _release

    invoice = frappe.db.get_value("Event Booking", booking, "ee_damage_hold_invoice")
    if not invoice:
        frappe.throw("No hold on this job.")
    result = _release(invoice)
    frappe.db.set_value("Event Booking", booking, "ee_damage_hold_status", "released")
    return {"status": "released", "processor": result.get("status")}


@frappe.whitelist()
def set_event_insurance(booking: str, enabled: int = 0, amount: float = 0) -> dict:
    _require_staff()
    frappe.db.set_value(
        "Event Booking",
        booking,
        {"ee_event_insurance": 1 if cint(enabled) else 0, "ee_event_insurance_amount": flt(amount)},
    )
    return {"ok": True, "amount": _money(amount)}


def run_daily():
    try:
        from entertainment_express.api.workflow import automation_enabled
    except Exception:
        return
    if not automation_enabled("policy_expiry"):
        return
    if frappe.db.table_exists("EE Insurance Policy"):
        cutoff = add_days(nowdate(), 30)
        for row in frappe.get_all(
            "EE Insurance Policy",
            filters={"active": 1, "expires_on": ["<=", cutoff]},
            fields=["provider", "expires_on"],
        ):
            emails = frappe.get_all(
                "Has Role",
                filters={"role": "EE Tenant Admin", "parenttype": "User"},
                pluck="parent",
            )
            for user in emails[:5]:
                _notify("policy_expiring", user, {"provider": row.provider, "expires": str(row.expires_on or "")})
    if automation_enabled("coi_required") and frappe.db.table_exists("EE Venue"):
        for booking in frappe.get_all(
            "Event Booking",
            filters={"status": ["in", ["confirmed", "tentative"]], "event_date": [">=", nowdate()]},
            fields=["name", "venue", "event_name"],
            limit_page_length=80,
        ):
            if not booking.venue:
                continue
            if not cint(frappe.db.get_value("EE Venue", booking.venue, "coi_required")):
                continue
            delivered = frappe.db.exists("EE Certificate of Insurance", {"booking": booking.name, "status": "delivered"})
            if delivered:
                continue
            emails = frappe.get_all(
                "Has Role",
                filters={"role": "EE Tenant Admin", "parenttype": "User"},
                pluck="parent",
            )
            for user in emails[:3]:
                _notify("coi_required", user, {"event_name": booking.event_name or booking.name})
