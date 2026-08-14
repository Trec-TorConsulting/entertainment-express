"""Auto-attach planning forms and evaluation forms to bookings."""

from __future__ import annotations

import frappe


def on_booking_update(doc, method=None):
    if doc.status in ("confirmed", "in_progress"):
        attach_forms(doc.name, purpose="planning")
        try:
            from entertainment_express.billing_payments.schedules import ensure_schedule

            ensure_schedule(doc.name)
        except Exception:
            frappe.log_error(frappe.get_traceback(), "EE payment schedule")
    if doc.status == "completed":
        attach_forms(doc.name, purpose="evaluation")


def attach_forms(booking_name: str, purpose: str = "planning") -> list[str]:
    booking = frappe.get_doc("Event Booking", booking_name)
    event_type = (getattr(booking, "event_type", None) or "").strip().lower()
    templates = frappe.get_all(
        "Planning Form Template",
        filters={"active": 1, "purpose": purpose},
        fields=["name", "event_type"],
    )
    created = []
    for tmpl in templates:
        tmpl_type = (tmpl.event_type or "").strip().lower()
        if tmpl_type and event_type and tmpl_type != event_type:
            continue
        if tmpl_type and not event_type:
            continue
        exists = frappe.db.exists(
            "Planning Form Instance",
            {"booking": booking_name, "template": tmpl.name},
        )
        if exists:
            continue
        inst = frappe.get_doc(
            {
                "doctype": "Planning Form Instance",
                "booking": booking_name,
                "template": tmpl.name,
                "status": "not_started",
            }
        )
        inst.insert(ignore_permissions=True)
        created.append(inst.name)
    if created:
        frappe.db.commit()
    return created
