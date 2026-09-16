# Copyright (c) 2026, Trec-Tor Consulting and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.utils import now_datetime


@frappe.whitelist()
def report_incident(booking_name, severity="Minor", category="Audio/Visual Equipment", description="", asset=None):
    """
    Logs on-site hardware fault or operational incident.
    Notifies owner flight deck and standby technicians.
    """
    if not booking_name or not frappe.db.exists("Event Booking", booking_name):
        return {"ok": False, "error": _("Valid booking_name required")}

    incident_doc = frappe.get_doc({
        "doctype": "EE Live Incident",
        "event_booking": booking_name,
        "reported_by": frappe.session.user,
        "incident_time": now_datetime(),
        "severity": severity,
        "category": category,
        "asset": asset,
        "description": description or _("Field incident reported"),
        "status": "Open"
    })
    incident_doc.insert(ignore_permissions=True)
    frappe.db.commit()

    # Real-time WebSocket alert
    if hasattr(frappe, "publish_realtime"):
        try:
            frappe.publish_realtime(
                event="live_incident_alert",
                message={
                    "incident_id": incident_doc.name,
                    "booking": booking_name,
                    "severity": severity,
                    "category": category,
                    "description": description,
                    "timestamp": str(now_datetime())
                },
                room="flight_deck_admin"
            )
        except Exception:
            pass

    return {
        "ok": True,
        "message": _("Incident logged and flight deck notified!"),
        "incident_id": incident_doc.name,
        "severity": severity,
        "status": "Open"
    }


@frappe.whitelist()
def resolve_incident(incident_id, resolution_notes="Resolved on-site"):
    """Marks live incident as resolved."""
    if not incident_id or not frappe.db.exists("EE Live Incident", incident_id):
        return {"ok": False, "error": _("Valid incident_id required")}

    frappe.db.set_value("EE Live Incident", incident_id, {
        "status": "Resolved",
        "resolution_notes": resolution_notes
    })
    frappe.db.commit()

    return {
        "ok": True,
        "incident_id": incident_id,
        "status": "Resolved"
    }
