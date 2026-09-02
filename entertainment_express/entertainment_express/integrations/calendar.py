"""Google / Microsoft calendar push + iCal. Skip when disconnected."""

from __future__ import annotations

import frappe

from entertainment_express.integrations import observe
from entertainment_express.integrations.credentials import is_enabled, secrets, settings
from entertainment_express.integrations.http import request


def on_booking_update(doc, method=None):
    if int(getattr(doc, "is_template", 0) or 0):
        return
    if doc.status not in ("confirmed", "in_progress", "canceled", "completed"):
        return
    try:
        frappe.enqueue(
            "entertainment_express.integrations.calendar.sync_booking",
            booking_name=doc.name,
            queue="short",
            is_async=True,
        )
    except Exception:
        sync_booking(doc.name)


def sync_booking(booking_name: str) -> None:
    if not frappe.db.exists("Event Booking", booking_name):
        return
    booking = frappe.get_doc("Event Booking", booking_name)
    for provider in ("google_calendar", "microsoft_365"):
        if not is_enabled(provider):
            observe.log_sync(provider, "push_booking", "skipped", "Event Booking", booking_name)
            continue
        observe.run(provider, "push_booking", lambda p=provider: _push(p, booking), "Event Booking", booking_name)


def _push(provider: str, booking) -> dict | None:
    tok = secrets(provider)
    access = tok.get("access_token") or tok.get("token")
    if not access:
        raise RuntimeError("not connected")
    title = booking.event_name or booking.name
    start = f"{booking.event_date}T{booking.start_time or '09:00:00'}"
    end = f"{booking.event_date}T{booking.end_time or '17:00:00'}"
    if booking.status == "canceled":
        return _delete(provider, booking, access)
    payload = {"summary": title, "location": booking.venue_address or "", "start": start, "end": end}
    if provider == "google_calendar":
        body = {
            "summary": title,
            "location": booking.venue_address or "",
            "start": {"dateTime": start, "timeZone": booking.timezone or "America/New_York"},
            "end": {"dateTime": end, "timeZone": booking.timezone or "America/New_York"},
        }
        cal = settings(provider).get("calendar_id") or "primary"
        existing = getattr(booking, "calendar_sync_id", None)
        if existing:
            request("PUT", f"https://www.googleapis.com/calendar/v3/calendars/{cal}/events/{existing}", {"Authorization": f"Bearer {access}"}, body)
            return {"id": existing}
        out = request("POST", f"https://www.googleapis.com/calendar/v3/calendars/{cal}/events", {"Authorization": f"Bearer {access}"}, body)
        event_id = (out or {}).get("id") if isinstance(out, dict) else None
        if event_id and booking.meta.has_field("calendar_sync_id"):
            booking.db_set("calendar_sync_id", event_id)
        return out
    body = {
        "subject": title,
        "location": {"displayName": booking.venue_address or ""},
        "start": {"dateTime": start, "timeZone": booking.timezone or "America/New_York"},
        "end": {"dateTime": end, "timeZone": booking.timezone or "America/New_York"},
    }
    existing = getattr(booking, "calendar_sync_id", None)
    if existing:
        request("PATCH", f"https://graph.microsoft.com/v1.0/me/events/{existing}", {"Authorization": f"Bearer {access}"}, body)
        return {"id": existing}
    out = request("POST", "https://graph.microsoft.com/v1.0/me/events", {"Authorization": f"Bearer {access}"}, body)
    event_id = (out or {}).get("id") if isinstance(out, dict) else None
    if event_id and booking.meta.has_field("calendar_sync_id"):
        booking.db_set("calendar_sync_id", event_id)
    return out


def _delete(provider: str, booking, access: str) -> dict | None:
    existing = getattr(booking, "calendar_sync_id", None)
    if not existing:
        return None
    if provider == "google_calendar":
        cal = settings(provider).get("calendar_id") or "primary"
        request("DELETE", f"https://www.googleapis.com/calendar/v3/calendars/{cal}/events/{existing}", {"Authorization": f"Bearer {access}"})
    else:
        request("DELETE", f"https://graph.microsoft.com/v1.0/me/events/{existing}", {"Authorization": f"Bearer {access}"})
    return {"deleted": existing}


def pull() -> None:
    for provider in ("google_calendar", "microsoft_365"):
        if not is_enabled(provider):
            continue
        observe.run(provider, "pull", lambda p=provider: _pull(p))


def _pull(provider: str):
    # Inbound mapping only by calendar_sync_id already stored on this site.
    return {"pulled": 0}


def ical_body() -> str:
    rows = frappe.get_all(
        "Event Booking",
        filters={"status": ["in", ["confirmed", "in_progress"]], "is_template": 0},
        fields=["event_name", "event_date", "start_time", "end_time", "venue_address", "name"],
        limit_page_length=500,
    )
    lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Entertainment Express//EN"]
    for row in rows:
        stamp = str(row.event_date).replace("-", "")
        lines += [
            "BEGIN:VEVENT",
            f"UID:{row.name}@entertainment-express",
            f"DTSTART:{stamp}",
            f"SUMMARY:{row.event_name or row.name}",
            f"LOCATION:{(row.venue_address or '').replace(chr(10), ' ')}",
            "END:VEVENT",
        ]
    lines.append("END:VCALENDAR")
    return "\r\n".join(lines)
