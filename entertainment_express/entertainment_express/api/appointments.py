"""Consultation appointments. Distinct from Event Bookings. No money."""

from __future__ import annotations

import secrets
from datetime import datetime, timedelta

import frappe
from frappe.utils import add_days, cint, get_datetime, getdate, now_datetime

from entertainment_express.api.portal_owner import OWNER_ROLES

WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
STAFF = OWNER_ROLES | {"EE Sales", "System Manager"}
GUEST_ROLE = "EE Event Guest"
PAYER_ROLE = "EE Customer"
ACTIVE = ("scheduled", "rescheduled")


def _require_staff() -> None:
    roles = set(frappe.get_roles() or [])
    if not roles.intersection(STAFF):
        frappe.throw("Not allowed.", frappe.PermissionError)


def _deny_event_guest() -> None:
    roles = set(frappe.get_roles() or [])
    if GUEST_ROLE in roles and PAYER_ROLE not in roles:
        frappe.throw("Only the host can do this.", frappe.PermissionError)


def _client_ip() -> str:
    try:
        return frappe.local.request_ip or (frappe.request.headers.get("X-Forwarded-For") or "").split(",")[0].strip()
    except Exception:
        return "unknown"


def _as_dt(value) -> datetime:
    return get_datetime(value)


def _as_time(value):
    raw = str(value or "09:00:00")
    parts = raw.split(":")
    return datetime.min.replace(hour=int(parts[0] or 0), minute=int(parts[1] or 0) if len(parts) > 1 else 0).time()


def _company_name() -> str:
    return frappe.db.get_single_value("EE Portal Settings", "brand_name") or frappe.db.get_default("company") or ""


def _notify(key: str, email: str, ctx: dict) -> None:
    if not email:
        return
    try:
        from entertainment_express.notifications import send

        send(key, email, ctx)
    except Exception:
        frappe.logger().error("appointment notify failed")


def _staff_for_type(meeting) -> list[str]:
    if meeting.assigned_staff:
        return [meeting.assigned_staff]
    employees = frappe.get_all(
        "Employee",
        filters={"status": "Active"},
        fields=["name", "user_id"],
        limit_page_length=50,
    )
    out = []
    for emp in employees:
        if not emp.user_id:
            continue
        roles = set(frappe.get_roles(emp.user_id) or [])
        if roles.intersection({"EE Sales", "EE Tenant Admin"}):
            out.append(emp.name)
    return out


def _hours_for_day(employee: str, day) -> tuple | None:
    if not employee or not frappe.db.exists("Employee", employee):
        return None
    emp = frappe.get_doc("Employee", employee)
    day_s = str(getdate(day))
    for row in emp.get("ee_consult_overrides") or []:
        if str(row.override_date) == day_s:
            if cint(row.closed):
                return None
            if row.start_time and row.end_time:
                return (_as_time(row.start_time), _as_time(row.end_time))
    weekday = WEEKDAYS[getdate(day).weekday()]
    for row in emp.get("ee_consult_hours") or []:
        if row.weekday == weekday:
            return (_as_time(row.start_time), _as_time(row.end_time))
    return None


def _time_off(employee: str, day) -> bool:
    if not frappe.db.table_exists("Event Booking"):
        return False
    return bool(
        frappe.db.count(
            "Event Booking",
            {"status": "time_off", "event_date": getdate(day), "customer": employee},
        )
    )


def _busy_windows(employee: str, day) -> list[tuple[datetime, datetime]]:
    windows = []
    start_day = datetime.combine(getdate(day), datetime.min.time())
    end_day = start_day + timedelta(days=1)
    if frappe.db.table_exists("EE Appointment"):
        for row in frappe.get_all(
            "EE Appointment",
            filters={"staff": employee, "status": ["in", list(ACTIVE)], "start": ["between", [start_day, end_day]]},
            fields=["start", "end"],
        ):
            windows.append((_as_dt(row.start), _as_dt(row.end)))
    if frappe.db.table_exists("Crew Assignment"):
        for ca in frappe.get_all(
            "Crew Assignment",
            filters={"crew_member": employee, "status": ["not in", ["declined", "no_show"]]},
            fields=["booking", "call_time"],
            limit_page_length=50,
        ):
            booking = frappe.db.get_value(
                "Event Booking",
                ca.booking,
                ["event_date", "start_time", "end_time", "status"],
                as_dict=True,
            )
            if not booking or str(booking.event_date) != str(getdate(day)):
                continue
            if booking.status not in ("tentative", "confirmed", "in_progress"):
                continue
            bstart = datetime.combine(getdate(booking.event_date), _as_time(booking.start_time or "18:00:00"))
            bend = datetime.combine(getdate(booking.event_date), _as_time(booking.end_time or "22:00:00"))
            windows.append((bstart, bend))
    return windows


def _overlaps(start: datetime, end: datetime, windows: list[tuple[datetime, datetime]]) -> bool:
    for other_s, other_e in windows:
        if start < other_e and end > other_s:
            return True
    return False


def _pick_staff(meeting, start: datetime, end: datetime) -> str | None:
    candidates = _staff_for_type(meeting)
    scored = []
    week_start = start.date() - timedelta(days=start.weekday())
    for emp in candidates:
        if _time_off(emp, start.date()):
            continue
        hours = _hours_for_day(emp, start.date())
        if not hours:
            continue
        day_start = datetime.combine(start.date(), hours[0])
        day_end = datetime.combine(start.date(), hours[1])
        if start < day_start or end > day_end:
            continue
        if _overlaps(start, end, _busy_windows(emp, start.date())):
            continue
        count = frappe.db.count(
            "EE Appointment",
            {"staff": emp, "status": ["in", list(ACTIVE)], "start": [">=", week_start]},
        )
        scored.append((count, emp))
    if not scored:
        return None
    scored.sort()
    return scored[0][1]


@frappe.whitelist(allow_guest=True)
def list_types() -> list[dict]:
    if not frappe.db.table_exists("EE Meeting Type"):
        return []
    rows = []
    for row in frappe.get_all(
        "EE Meeting Type",
        filters={"active": 1},
        fields=["name", "type_name", "slug", "duration_minutes", "location_type"],
        order_by="type_name asc",
    ):
        rows.append(
            {
                "id": row.name,
                "name": row.type_name or row.name,
                "slug": row.slug or row.name,
                "duration": cint(row.duration_minutes),
                "where": row.location_type or "video",
            }
        )
    return rows


@frappe.whitelist(allow_guest=True)
def list_slots(meeting_type: str, from_date: str | None = None, days: int = 14) -> list[dict]:
    if not frappe.db.table_exists("EE Meeting Type"):
        return []
    meeting = frappe.get_doc("EE Meeting Type", meeting_type)
    if not cint(meeting.active):
        return []
    duration = cint(meeting.duration_minutes) or 30
    before = cint(meeting.buffer_before)
    after = cint(meeting.buffer_after)
    start_day = getdate(from_date) if from_date else getdate()
    slots = []
    for offset in range(max(1, min(cint(days), 28))):
        day = add_days(start_day, offset)
        for emp in _staff_for_type(meeting):
            if _time_off(emp, day):
                continue
            hours = _hours_for_day(emp, day)
            if not hours:
                continue
            cursor = datetime.combine(getdate(day), hours[0])
            close = datetime.combine(getdate(day), hours[1])
            busy = _busy_windows(emp, day)
            while cursor + timedelta(minutes=duration) <= close:
                slot_start = cursor
                slot_end = cursor + timedelta(minutes=duration)
                padded_start = slot_start - timedelta(minutes=before)
                padded_end = slot_end + timedelta(minutes=after)
                if not _overlaps(padded_start, padded_end, busy) and slot_start > now_datetime():
                    slots.append({"start": slot_start.isoformat(sep=" "), "staff": emp, "meeting_type": meeting.name})
                cursor += timedelta(minutes=duration)
    slots.sort(key=lambda row: row["start"])
    return slots[:80]


@frappe.whitelist(allow_guest=True)
def book(
    meeting_type: str,
    start: str,
    full_name: str,
    email: str,
    phone: str = "",
    staff: str | None = None,
) -> dict:
    from entertainment_express.api.marketing import _check_rate_limit

    _check_rate_limit(f"ee:appt:book:{_client_ip()}", limit_count=8, window_seconds=3600)
    email = (email or "").strip()
    full_name = (full_name or "").strip()
    if not email or "@" not in email or not full_name:
        frappe.throw("Name and email are required.")
    meeting = frappe.get_doc("EE Meeting Type", meeting_type)
    if not cint(meeting.active):
        frappe.throw("That meeting is not open.")
    start_dt = _as_dt(start)
    end_dt = start_dt + timedelta(minutes=cint(meeting.duration_minutes) or 30)
    chosen = staff if staff in _staff_for_type(meeting) else _pick_staff(meeting, start_dt, end_dt)
    if not chosen:
        frappe.throw("That time is no longer open.")
    if _overlaps(start_dt, end_dt, _busy_windows(chosen, start_dt.date())) or _time_off(chosen, start_dt.date()):
        frappe.throw("That time is no longer open.")
    lead_name = frappe.db.get_value("Lead", {"email_id": email}, "name")
    if not lead_name:
        lead = frappe.get_doc({"doctype": "Lead", "lead_name": full_name[:140], "email_id": email[:240], "mobile_no": (phone or "")[:30], "status": "Open"})
        if lead.meta.has_field("ee_lead_type"):
            lead.ee_lead_type = "quote"
        lead.insert(ignore_permissions=True)
        lead_name = lead.name
    token = secrets.token_urlsafe(18)
    doc = frappe.get_doc(
        {
            "doctype": "EE Appointment",
            "meeting_type": meeting.name,
            "staff": chosen,
            "status": "scheduled",
            "start": start_dt,
            "end": end_dt,
            "invitee_name": full_name[:140],
            "invitee_email": email[:240],
            "invitee_phone": (phone or "")[:30],
            "lead": lead_name,
            "video_url": meeting.video_url,
            "cancel_token": token,
            "timezone": "America/New_York",
        }
    )
    doc.insert(ignore_permissions=True)
    _notify(
        "appointment_booked",
        email,
        {
            "invitee_name": full_name,
            "meeting_name": meeting.type_name,
            "start_label": str(start_dt),
            "company_name": _company_name(),
            "manage_link": f"/schedule?token={token}",
        },
    )
    return {"ok": True, "id": doc.name, "start": str(start_dt), "token": token}


@frappe.whitelist(allow_guest=True)
def cancel(name: str | None = None, token: str | None = None) -> dict:
    doc = _load_manageable(name, token)
    doc.status = "canceled"
    doc.save(ignore_permissions=True)
    _notify(
        "appointment_canceled",
        doc.invitee_email,
        {
            "invitee_name": doc.invitee_name,
            "meeting_name": frappe.db.get_value("EE Meeting Type", doc.meeting_type, "type_name") or "meeting",
            "start_label": str(doc.start),
            "company_name": _company_name(),
        },
    )
    return {"ok": True}


@frappe.whitelist()
def reschedule(name: str, start: str, token: str | None = None) -> dict:
    doc = _load_manageable(name, token)
    meeting = frappe.get_doc("EE Meeting Type", doc.meeting_type)
    start_dt = _as_dt(start)
    end_dt = start_dt + timedelta(minutes=cint(meeting.duration_minutes) or 30)
    if not _pick_staff(meeting, start_dt, end_dt) and doc.staff not in _staff_for_type(meeting):
        frappe.throw("That time is no longer open.")
    if _overlaps(start_dt, end_dt, [w for w in _busy_windows(doc.staff, start_dt.date()) if w[0] != _as_dt(doc.start)]):
        frappe.throw("That time is no longer open.")
    doc.start = start_dt
    doc.end = end_dt
    doc.status = "rescheduled"
    doc.save(ignore_permissions=True)
    return {"ok": True, "start": str(start_dt)}


def _load_manageable(name: str | None, token: str | None):
    if token:
        found = frappe.db.get_value("EE Appointment", {"cancel_token": token}, "name")
        if not found:
            frappe.throw("That link is not valid.", frappe.PermissionError)
        return frappe.get_doc("EE Appointment", found)
    _deny_event_guest()
    if not name:
        frappe.throw("Missing appointment.")
    doc = frappe.get_doc("EE Appointment", name)
    roles = set(frappe.get_roles() or [])
    if roles.intersection(STAFF):
        return doc
    if PAYER_ROLE in roles:
        customer = frappe.db.get_value("Customer", {"email_id": frappe.session.user}, "name")
        if customer and doc.customer == customer:
            return doc
        if (doc.invitee_email or "").lower() == (frappe.session.user or "").lower():
            return doc
    frappe.throw("Not allowed.", frappe.PermissionError)


@frappe.whitelist()
def complete(name: str, decision: str = "completed") -> dict:
    _require_staff()
    doc = frappe.get_doc("EE Appointment", name)
    doc.status = "no_show" if decision == "no_show" else "completed"
    doc.save(ignore_permissions=True)
    return {"ok": True, "status": doc.status}


@frappe.whitelist()
def list_mine() -> list[dict]:
    _deny_event_guest()
    roles = set(frappe.get_roles() or [])
    filters: dict = {"status": ["in", list(ACTIVE)]}
    if roles.intersection(OWNER_ROLES | {"System Manager"}):
        pass
    elif "EE Sales" in roles:
        emp = frappe.db.get_value("Employee", {"user_id": frappe.session.user}, "name")
        filters["staff"] = emp or "__none__"
    else:
        filters["invitee_email"] = frappe.session.user
    rows = []
    for row in frappe.get_all(
        "EE Appointment",
        filters=filters,
        fields=["name", "meeting_type", "staff", "start", "end", "status", "invitee_name"],
        order_by="start asc",
        limit_page_length=40,
    ):
        rows.append(
            {
                "id": row.name,
                "title": frappe.db.get_value("EE Meeting Type", row.meeting_type, "type_name") or "Meeting",
                "who": row.invitee_name,
                "start": str(row.start or ""),
                "status": row.status,
            }
        )
    return rows


@frappe.whitelist()
def save_meeting_type(values: dict | str | None = None, name: str | None = None) -> dict:
    _require_staff()
    if isinstance(values, str):
        values = frappe.parse_json(values) or {}
    values = values or {}
    payload = {
        "type_name": (values.get("name") or values.get("type_name") or "").strip(),
        "duration_minutes": cint(values.get("duration") or values.get("duration_minutes") or 30),
        "location_type": values.get("where") or values.get("location_type") or "video",
        "buffer_before": cint(values.get("buffer_before") or 0),
        "buffer_after": cint(values.get("buffer_after") or 0),
        "assigned_staff": values.get("staff") or values.get("assigned_staff") or None,
        "video_url": values.get("video_url") or "",
        "active": 1 if cint(values.get("active", 1)) else 0,
        "slug": values.get("slug") or "",
    }
    if not payload["type_name"]:
        frappe.throw("Name is required.")
    if name:
        doc = frappe.get_doc("EE Meeting Type", name)
        doc.update(payload)
        doc.save()
    else:
        doc = frappe.get_doc({"doctype": "EE Meeting Type", **payload})
        doc.insert()
    return {"id": doc.name, "name": doc.type_name}


@frappe.whitelist()
def save_hours(employee: str, hours: list | str | None = None) -> dict:
    _require_staff()
    if isinstance(hours, str):
        hours = frappe.parse_json(hours) or []
    emp = frappe.get_doc("Employee", employee)
    emp.set("ee_consult_hours", [])
    for row in hours or []:
        emp.append(
            "ee_consult_hours",
            {"weekday": row.get("weekday"), "start_time": row.get("start_time"), "end_time": row.get("end_time")},
        )
    emp.save()
    return {"ok": True}


@frappe.whitelist(allow_guest=True)
def ics(name: str, token: str) -> dict:
    doc = _load_manageable(name, token)
    title = frappe.db.get_value("EE Meeting Type", doc.meeting_type, "type_name") or "Meeting"
    stamp = _as_dt(doc.start).strftime("%Y%m%dT%H%M%S")
    end = _as_dt(doc.end).strftime("%Y%m%dT%H%M%S")
    body = "\r\n".join(
        [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "BEGIN:VEVENT",
            f"DTSTART:{stamp}",
            f"DTEND:{end}",
            f"SUMMARY:{title}",
            "END:VEVENT",
            "END:VCALENDAR",
        ]
    )
    return {"filename": "meeting.ics", "content": body}


def run_daily():
    try:
        from entertainment_express.api.workflow import automation_enabled

        if not automation_enabled("planning_form_reminder"):
            pass
    except Exception:
        pass
    horizon = add_days(getdate(), 1)
    if not frappe.db.table_exists("EE Appointment"):
        return
    for row in frappe.get_all(
        "EE Appointment",
        filters={"status": ["in", list(ACTIVE)], "start": ["between", [f"{horizon} 00:00:00", f"{horizon} 23:59:59"]]},
        fields=["invitee_email", "invitee_name", "meeting_type", "start"],
        limit_page_length=80,
    ):
        _notify(
            "appointment_reminder",
            row.invitee_email,
            {
                "invitee_name": row.invitee_name,
                "meeting_name": frappe.db.get_value("EE Meeting Type", row.meeting_type, "type_name") or "meeting",
                "start_label": str(row.start),
                "company_name": _company_name(),
            },
        )
