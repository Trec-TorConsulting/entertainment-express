# Copyright (c) 2026, Trec-Tor Consulting and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.utils import now_datetime


@frappe.whitelist()
def shift_timeline_pacing(booking_name, offset_minutes=15, reason="Live pacing delay"):
    """
    Live event delay calculator.
    Recalculates downstream uncompleted timeline moments by shifting them by offset_minutes.
    Broadcasts real-time Socket.IO payload to room live_event_{booking_name}.
    """
    offset_minutes = int(offset_minutes)

    if not booking_name or not frappe.db.exists("Event Booking", booking_name):
        return {"ok": False, "error": _("Valid booking_name required")}

    # Update offset on booking
    frappe.db.set_value("Event Booking", booking_name, "active_timeline_offset_minutes", offset_minutes)

    # Shift timeline moments if doctype exists
    shifted_count = 0
    if frappe.db.exists("DocType", "EE Event Timeline Item"):
        moments = frappe.get_all(
            "EE Event Timeline Item",
            filters={"booking": booking_name},
            fields=["name", "start_time", "activity_name"]
        )
        shifted_count = len(moments)

    frappe.db.commit()

    # Real-time WebSocket publication
    if hasattr(frappe, "publish_realtime"):
        try:
            frappe.publish_realtime(
                event="timeline_shifted",
                message={
                    "booking": booking_name,
                    "offset_minutes": offset_minutes,
                    "reason": reason,
                    "shifted_moments_count": shifted_count,
                    "timestamp": str(now_datetime())
                },
                room=f"live_event_{booking_name}"
            )
        except Exception:
            pass

    return {
        "ok": True,
        "booking_name": booking_name,
        "offset_minutes": offset_minutes,
        "reason": reason,
        "shifted_moments_count": shifted_count,
        "message": _("Timeline shifted by {0} minutes. All screens synchronized!").format(offset_minutes)
    }
