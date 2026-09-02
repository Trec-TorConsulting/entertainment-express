"""Weather forecast refresh job for outdoor / weather-sensitive bookings."""

from __future__ import annotations

from datetime import datetime, timedelta

import frappe
from frappe.utils import get_datetime, now_datetime


def refresh_booking_weather() -> dict:
    """
    Idempotent: refresh forecasts for confirmed weather-sensitive bookings
    inside the tenant lead window. Never cancels a booking.
    """
    if not frappe.db.table_exists("EE Weather Policy"):
        return {"refreshed": 0, "skipped": "no_policy"}

    try:
        policy = frappe.get_single("EE Weather Policy")
    except Exception:
        return {"refreshed": 0, "skipped": "no_policy"}

    if not int(getattr(policy, "enabled", 0) or 0):
        return {"refreshed": 0, "skipped": "disabled"}

    lead_hours = int(getattr(policy, "lead_hours", 48) or 48)
    now = now_datetime()
    cutoff = now + timedelta(hours=lead_hours)

    bookings = frappe.get_all(
        "Event Booking",
        filters={
            "status": ["in", ["confirmed", "in_progress", "tentative"]],
            "weather_sensitive": 1,
            "is_template": 0,
        },
        fields=["name", "event_date", "start_time", "end_time", "venue_geo", "weather_status"],
        limit_page_length=200,
    )

    from entertainment_express.api.weather import refresh_one_booking

    refreshed = 0
    for row in bookings:
        start = _combine(row.event_date, row.start_time)
        if not start or start < now or start > cutoff:
            continue
        try:
            refresh_one_booking(row.name, policy=policy)
            refreshed += 1
        except Exception:
            frappe.logger().error(f"weather refresh failed for {row.name}")

    return {"refreshed": refreshed}


def _combine(event_date, start_time) -> datetime | None:
    if not event_date:
        return None
    try:
        d = frappe.utils.getdate(event_date)
        t = frappe.utils.get_time(start_time or "12:00:00")
        return datetime.combine(d, t)
    except Exception:
        try:
            return get_datetime(f"{event_date} {start_time or '12:00:00'}")
        except Exception:
            return None
