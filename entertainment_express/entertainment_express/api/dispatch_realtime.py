"""
Dispatch board realtime — Socket.IO event publishing and day-view builder.

Publishes events consumed by the dispatch portal WebSocket client:
  crew_location_update, shift_status_update, at_risk_alert, booking_status_change

Uses Frappe's publish_realtime (Redis → frappe-socketio). Last-known crew GPS
is cached in Redis for polling fallback and customer crew-status views.
"""

from __future__ import annotations

from datetime import timedelta
from typing import Any

import frappe
from frappe.utils import flt, getdate, now_datetime

logger = frappe.logger("entertainment_express.dispatch_realtime")

DISPATCH_EVENTS = (
    "crew_location_update",
    "shift_status_update",
    "at_risk_alert",
    "booking_status_change",
    "runsheet_update",
    "new_message",
)

LOCATION_CACHE_PREFIX = "ee:crew_location:"
LOCATION_CACHE_TTL = 3600  # 1 hour


def _location_cache_key(assignment_id: str) -> str:
    return f"{LOCATION_CACHE_PREFIX}{assignment_id}"


def store_crew_location(
    assignment_id: str,
    latitude: float,
    longitude: float,
    *,
    crew_id: str | None = None,
    booking_id: str | None = None,
    status: str = "checked_in",
) -> dict[str, Any]:
    """Persist last-known crew GPS in Redis."""
    payload = {
        "assignment_id": assignment_id,
        "crew_id": crew_id,
        "booking_id": booking_id,
        "latitude": flt(latitude),
        "longitude": flt(longitude),
        "timestamp": now_datetime().isoformat(),
        "status": status,
    }
    frappe.cache().set_value(
        _location_cache_key(assignment_id),
        payload,
        expires_in_sec=LOCATION_CACHE_TTL,
    )
    return payload


def get_crew_location(assignment_id: str) -> dict[str, Any] | None:
    """Return cached GPS for an assignment, if any."""
    return frappe.cache().get_value(_location_cache_key(assignment_id))


def publish_dispatch_event(event: str, message: dict[str, Any]) -> None:
    """Broadcast a dispatch event to all Socket.IO clients on this site."""
    if event not in DISPATCH_EVENTS:
        logger.warning("Unknown dispatch event: %s", event)
    try:
        frappe.publish_realtime(event, message, after_commit=True)
    except Exception as exc:
        logger.warning("publish_realtime failed for %s: %s", event, exc)


def publish_crew_location_update(
    assignment_id: str,
    latitude: float,
    longitude: float,
    *,
    crew_id: str | None = None,
    booking_id: str | None = None,
    status: str = "checked_in",
) -> dict[str, Any]:
    payload = store_crew_location(
        assignment_id,
        latitude,
        longitude,
        crew_id=crew_id,
        booking_id=booking_id,
        status=status,
    )
    publish_dispatch_event("crew_location_update", payload)
    return payload


def publish_shift_status_update(
    assignment_id: str,
    booking_id: str,
    status: str,
    crew_member: str,
    *,
    role: str | None = None,
) -> None:
    publish_dispatch_event(
        "shift_status_update",
        {
            "assignment_id": assignment_id,
            "booking_id": booking_id,
            "status": status,
            "crew_member": crew_member,
            "role": role,
            "timestamp": now_datetime().isoformat(),
        },
    )


def publish_at_risk_alert(booking: dict[str, Any]) -> None:
    publish_dispatch_event(
        "at_risk_alert",
        {
            "booking_id": booking.get("name"),
            "event_name": booking.get("event_name"),
            "event_date": str(booking.get("event_date", "")),
            "start_time": str(booking.get("start_time", "")),
            "crew_count": booking.get("crew_count", 0),
            "status": "no_crew" if booking.get("crew_count", 0) == 0 else "understaffed",
            "recommendation": "Assign and confirm crew before the 48h window closes.",
        },
    )


def publish_booking_status_change(booking_id: str, status: str) -> None:
    publish_dispatch_event(
        "booking_status_change",
        {
            "booking_id": booking_id,
            "status": status,
            "timestamp": now_datetime().isoformat(),
        },
    )


def _is_at_risk(booking: dict[str, Any], assignments: list[dict[str, Any]]) -> bool:
    """Confirmed booking within 48h with no accepted/checked-in crew."""
    if booking.get("status") != "confirmed":
        return False
    event_date = getdate(booking.get("event_date"))
    cutoff = (now_datetime() + timedelta(hours=48)).date()
    if event_date > cutoff:
        return False
    accepted = [a for a in assignments if a.get("status") in ("accepted", "checked_in")]
    return len(accepted) == 0


def build_day_view(event_date: str | None = None) -> dict[str, Any]:
    """
    Build dispatch day-view payload: bookings, crew assignments, at-risk flags,
    and last-known crew locations.
    """
    event_date = str(event_date or getdate())
    now = now_datetime()

    bookings = frappe.get_all(
        "Event Booking",
        filters={"event_date": event_date, "status": ["in", ["tentative", "confirmed", "in_progress", "completed"]]},
        fields=[
            "name",
            "event_name",
            "customer",
            "status",
            "ee_dispatch_status",
            "event_date",
            "start_time",
            "end_time",
            "venue_address",
            "grand_total",
        ],
        order_by="start_time asc",
    )

    result = []
    at_risk_count = 0
    for bk in bookings:
        assignments = frappe.get_all(
            "Crew Assignment",
            filters={"booking": bk["name"]},
            fields=[
                "name",
                "crew_member",
                "role",
                "status",
                "call_time",
                "check_in",
                "check_out",
            ],
        )

        crew_with_location = []
        for assignment in assignments:
            cached = get_crew_location(assignment["name"])
            crew_with_location.append(
                {
                    **assignment,
                    "call_time": str(assignment["call_time"]) if assignment.get("call_time") else None,
                    "check_in": str(assignment["check_in"]) if assignment.get("check_in") else None,
                    "check_out": str(assignment["check_out"]) if assignment.get("check_out") else None,
                    "location": cached,
                }
            )

        accepted_count = len([a for a in assignments if a["status"] in ("accepted", "checked_in")])
        at_risk = _is_at_risk(bk, assignments)
        if at_risk:
            at_risk_count += 1

        result.append(
            {
                **bk,
                "start_time": str(bk["start_time"]) if bk.get("start_time") else None,
                "end_time": str(bk["end_time"]) if bk.get("end_time") else None,
                "crew_assignments": crew_with_location,
                "crew_count": accepted_count,
                "at_risk": at_risk,
            }
        )

    return {
        "date": event_date,
        "bookings": result,
        "summary": {
            "total_bookings": len(result),
            "at_risk_count": at_risk_count,
            "generated_at": now.isoformat(),
        },
    }


def subscription_info(event_date: str | None = None) -> dict[str, Any]:
    """Connection metadata for dispatch portal Socket.IO clients."""
    event_date = str(event_date or getdate())
    site_url = frappe.utils.get_url()
    return {
        "subscribed": True,
        "event_date": event_date,
        "socket_url": site_url,
        "socket_path": "/socket.io/",
        "transports": ["websocket"],
        "events": list(DISPATCH_EVENTS),
        "subscribe_emit": "subscribe_day_view",
        "subscribe_payload": {"event_date": event_date},
    }
