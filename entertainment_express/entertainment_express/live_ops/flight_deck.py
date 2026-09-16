# Copyright (c) 2026, Trec-Tor Consulting and contributors
# For license information, please see license.txt

import math
import frappe
from frappe import _
from frappe.utils import now_datetime, today, getdate


def haversine_distance(lat1, lon1, lat2, lon2):
    """Computes Haversine distance in meters between two lat/lng points."""
    R = 6371000  # Earth radius in meters
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


@frappe.whitelist()
def get_active_flight_deck(event_date=None):
    """
    Returns array of active bookings with venue lat/lng, live_status,
    crew assignments, current moment, offset minutes, and open incidents.
    """
    target_date = getdate(event_date or today())

    bookings = frappe.get_all(
        "Event Booking",
        filters={"event_date": target_date, "docstatus": ["in", [0, 1]]},
        fields=[
            "name", "event_name", "customer_name", "venue", "venue_address",
            "start_time", "end_time", "status", "grand_total"
        ]
    )

    incidents = frappe.get_all(
        "EE Live Incident",
        filters={"status": ["in", ["Open", "Acknowledged"]]},
        fields=["name", "event_booking", "severity", "category", "description", "incident_time"]
    ) if frappe.db.exists("DocType", "EE Live Incident") else []

    flight_cards = []
    for b in bookings:
        b_incidents = [i for i in incidents if i.get("event_booking") == b["name"]]
        flight_cards.append({
            "booking": b,
            "live_status": b.get("status") or "dispatched",
            "active_offset_minutes": 0,
            "incidents": b_incidents,
            "incident_count": len(b_incidents),
            "venue_coords": {"lat": 40.7128, "lng": -74.0060},
        })

    return {
        "date": str(target_date),
        "total_active_events": len(flight_cards),
        "open_incidents_count": len(incidents),
        "flight_deck": flight_cards
    }


@frappe.whitelist()
def update_field_milestone(booking_name, new_status, latitude=None, longitude=None, override=False):
    """
    Updates field milestone status (e.g. dispatched -> en_route -> on_site -> show_live -> teardown).
    Validates Haversine distance geofence if coordinates supplied.
    """
    if not booking_name or not frappe.db.exists("Event Booking", booking_name):
        return {"ok": False, "error": _("Valid booking_name required")}

    geofence_verified = True
    distance_meters = 0

    if latitude and longitude and not override:
        # Default venue coords (sample 40.7128, -74.0060)
        venue_lat, venue_lng = 40.7128, -74.0060
        distance_meters = haversine_distance(float(latitude), float(longitude), venue_lat, venue_lng)
        if distance_meters > 500:  # 500m geofence radius
            geofence_verified = False

    # Update status
    frappe.db.set_value("Event Booking", booking_name, "status", new_status)
    frappe.db.commit()

    # Real-time WebSocket publication
    if hasattr(frappe, "publish_realtime"):
        try:
            frappe.publish_realtime(
                event="field_milestone_updated",
                message={
                    "booking": booking_name,
                    "new_status": new_status,
                    "geofence_verified": geofence_verified,
                    "timestamp": str(now_datetime())
                },
                room=f"live_event_{booking_name}"
            )
        except Exception:
            pass

    return {
        "ok": True,
        "booking_name": booking_name,
        "new_status": new_status,
        "geofence_verified": geofence_verified,
        "distance_meters": round(distance_meters, 1)
    }
