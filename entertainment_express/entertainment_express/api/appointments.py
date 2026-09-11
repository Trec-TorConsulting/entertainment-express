"""Consultation appointments. Distinct from Event Bookings. No money."""

from __future__ import annotations

import secrets
from datetime import datetime, timedelta

import frappe
from frappe.utils import add_days, cint, get_datetime, getdate, now_datetime

from entertainment_express.api.portal_owner import OWNER_ROLES
from entertainment_express.api.rate_limit import rate_limited

WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
STAFF = OWNER_ROLES | {"EE Sales", "System Manager"}
GUEST_ROLE = "EE Event Guest"
PAYER_ROLE = "EE Customer"
ACTIVE = ("requested", "scheduled", "rescheduled")


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
    try:
        from entertainment_express.api.hr_workforce import weekly_window

        window = weekly_window(employee, day)
        if window:
            return window
    except Exception:
        pass
    return None


def _time_off(employee: str, day) -> bool:
    try:
        from entertainment_express.api.hr_workforce import worker_on_time_off

        if worker_on_time_off(employee, day):
            return True
    except Exception:
        pass
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


def _pick_staff(meeting, start: datetime, end: datetime, booking: str | None = None) -> str | None:
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
    if scored:
        scored.sort()
        return scored[0][1]

    if candidates:
        return candidates[0]
    if booking and frappe.db.table_exists("Crew Assignment"):
        crew_emp = frappe.db.get_value("Crew Assignment", {"booking": booking, "status": ["not in", ["declined", "no_show"]]}, "crew_member")
        if crew_emp:
            return crew_emp
    if frappe.db.table_exists("Employee"):
        first_emp = frappe.db.get_value("Employee", {"status": "Active"}, "name")
        if first_emp:
            return first_emp
    return None


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
@rate_limited(limit=60)
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
@rate_limited(limit=30)
def book(
    meeting_type: str,
    start: str,
    full_name: str,
    email: str,
    phone: str = "",
    staff: str | None = None,
    notes: str = "",
    booking: str | None = None,
    customer: str | None = None,
    appointment_type: str = "video",
    status: str = "scheduled",
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

    try:
        start_dt = _as_dt(start)
    except Exception:
        start_dt = add_days(now_datetime(), 1).replace(hour=14, minute=0, second=0, microsecond=0)

    end_dt = start_dt + timedelta(minutes=cint(meeting.duration_minutes) or 30)
    chosen = staff if staff and (staff in _staff_for_type(meeting) or frappe.db.exists("Employee", staff)) else _pick_staff(meeting, start_dt, end_dt, booking=booking)
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
    if not customer and frappe.session.user and frappe.session.user != "Guest":
        session_roles = set(frappe.get_roles() or [])
        if PAYER_ROLE in session_roles:
            customer = frappe.db.get_value("Customer", {"email_id": frappe.session.user}, "name") or ""
    token = secrets.token_urlsafe(18)
    appt_data = {
        "doctype": "EE Appointment",
        "meeting_type": meeting.name,
        "staff": chosen,
        "status": status,
        "start": start_dt,
        "end": end_dt,
        "invitee_name": full_name[:140],
        "invitee_email": email[:240],
        "invitee_phone": (phone or "")[:30],
        "lead": lead_name,
        "customer": customer or "",
        "video_url": meeting.video_url or "",
        "cancel_token": token,
        "timezone": "America/New_York",
    }
    if frappe.db.has_column("EE Appointment", "event_booking"):
        appt_data["event_booking"] = booking or ""
    if frappe.db.has_column("EE Appointment", "appointment_type"):
        appt_data["appointment_type"] = appointment_type or "video"
    if frappe.db.has_column("EE Appointment", "notes"):
        appt_data["notes"] = (notes or "")[:1000]

    doc = frappe.get_doc(appt_data)
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
    return {"ok": True, "id": doc.name, "start": str(start_dt), "token": token, "status": doc.status}


@frappe.whitelist(allow_guest=True)
@rate_limited(limit=30)
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


@frappe.whitelist(allow_guest=True)
@rate_limited(limit=30)
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

    fields = ["name", "meeting_type", "staff", "start", "end", "status", "invitee_name"]
    if frappe.db.table_exists("EE Appointment"):
        if frappe.db.has_column("EE Appointment", "event_booking"):
            fields.append("event_booking")
        if frappe.db.has_column("EE Appointment", "appointment_type"):
            fields.append("appointment_type")
        if frappe.db.has_column("EE Appointment", "notes"):
            fields.append("notes")

    rows = []
    for row in frappe.get_all(
        "EE Appointment",
        filters=filters,
        fields=fields,
        order_by="start asc",
        limit_page_length=40,
    ):
        rows.append(
            {
                "id": row.name,
                "name": row.name,
                "title": frappe.db.get_value("EE Meeting Type", row.meeting_type, "type_name") or "Meeting",
                "who": row.invitee_name,
                "start": str(row.start or ""),
                "status": row.status,
                "meeting_type": row.meeting_type,
                "event_booking": row.get("event_booking") or "",
                "appointment_type": row.get("appointment_type") or "video",
                "notes": row.get("notes") or "",
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
def list_consult_staff() -> list[dict]:
    _require_staff()
    rows = []
    for emp in frappe.get_all(
        "Employee",
        filters={"status": "Active"},
        fields=["name", "employee_name"],
        limit_page_length=50,
    ):
        doc = frappe.get_doc("Employee", emp.name)
        hours = []
        for row in doc.get("ee_consult_hours") or []:
            hours.append(
                {
                    "weekday": row.weekday,
                    "start_time": str(row.start_time or "")[:8],
                    "end_time": str(row.end_time or "")[:8],
                }
            )
        rows.append({"id": emp.name, "name": emp.employee_name or emp.name, "hours": hours})
    return rows


@frappe.whitelist()
def save_hours(employee: str, hours: list | str | None = None) -> dict:
    _require_staff()
    if isinstance(hours, str):
        hours = frappe.parse_json(hours) or []
    emp = frappe.get_doc("Employee", employee)
    emp.set("ee_consult_hours", [])
    for row in hours or []:
        if not row.get("weekday") or not row.get("start_time") or not row.get("end_time"):
            continue
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


def _ensure_default_meeting_type() -> str:
    if not frappe.db.table_exists("EE Meeting Type"):
        return ""
    found = frappe.db.get_value("EE Meeting Type", {"active": 1}, "name")
    if found:
        return found
    any_mt = frappe.db.get_value("EE Meeting Type", {}, "name")
    if any_mt:
        frappe.db.set_value("EE Meeting Type", any_mt, "active", 1)
        return any_mt
    mt = frappe.get_doc({
        "doctype": "EE Meeting Type",
        "type_name": "Planning Consultation",
        "duration_minutes": 30,
        "location_type": "video",
        "active": 1,
        "slug": "planning-consultation",
        "video_url": "https://meet.google.com/ee-consult",
    })
    mt.insert(ignore_permissions=True)
    return mt.name


@frappe.whitelist()
def my_appointments(booking: str | None = None) -> list[dict]:
    _deny_event_guest()
    roles = set(frappe.get_roles() or [])
    filters: dict = {"status": ["in", list(ACTIVE)]}
    if roles.intersection(OWNER_ROLES | {"System Manager"}):
        pass
    elif "EE Sales" in roles:
        emp = frappe.db.get_value("Employee", {"user_id": frappe.session.user}, "name")
        filters["staff"] = emp or "__none__"
    else:
        customer = frappe.db.get_value("Customer", {"email_id": frappe.session.user}, "name")
        if customer:
            filters["customer"] = customer
        else:
            filters["invitee_email"] = frappe.session.user
    if booking and frappe.db.table_exists("EE Appointment") and frappe.db.has_column("EE Appointment", "event_booking"):
        filters["event_booking"] = booking

    if not frappe.db.table_exists("EE Appointment"):
        return []

    fields = ["name", "meeting_type", "staff", "start", "end", "status", "invitee_name"]
    if frappe.db.has_column("EE Appointment", "event_booking"):
        fields.append("event_booking")
    if frappe.db.has_column("EE Appointment", "appointment_type"):
        fields.append("appointment_type")
    if frappe.db.has_column("EE Appointment", "notes"):
        fields.append("notes")

    rows = []
    for row in frappe.get_all(
        "EE Appointment",
        filters=filters,
        fields=fields,
        order_by="start asc",
        limit_page_length=40,
    ):
        mt_val = row.get("meeting_type") if isinstance(row, dict) else getattr(row, "meeting_type", "")
        staff_val = row.get("staff") if isinstance(row, dict) else getattr(row, "staff", "")
        row_name = row.get("name") if isinstance(row, dict) else getattr(row, "name", "")
        invitee = row.get("invitee_name") if isinstance(row, dict) else getattr(row, "invitee_name", "Host")
        start_val = row.get("start") if isinstance(row, dict) else getattr(row, "start", "")
        end_val = row.get("end") if isinstance(row, dict) else getattr(row, "end", "")
        status_val = row.get("status") if isinstance(row, dict) else getattr(row, "status", "scheduled")
        appt_type_val = row.get("appointment_type") if isinstance(row, dict) else getattr(row, "appointment_type", "video")
        notes_val = row.get("notes") if isinstance(row, dict) else getattr(row, "notes", "")
        booking_val = row.get("event_booking") if isinstance(row, dict) else getattr(row, "event_booking", "")

        type_name = frappe.db.get_value("EE Meeting Type", mt_val, "type_name") if mt_val else "Planning Session"
        host_name = frappe.db.get_value("Employee", staff_val, "employee_name") if staff_val else "Event Director"
        rows.append(
            {
                "id": row_name,
                "name": row_name,
                "title": type_name or "Planning Consultation",
                "subject": type_name or "Event Planning Consultation",
                "who": invitee or "Host",
                "host_name": host_name or "Event Director",
                "start": str(start_val or ""),
                "start_time": str(start_val or ""),
                "end": str(end_val or ""),
                "status": status_val,
                "appointment_type": appt_type_val or "video",
                "meet_url": "https://meet.google.com/ee-consult",
                "notes": notes_val or "",
                "event_booking": booking_val or "",
                "meeting_type": mt_val,
            }
        )
    return rows


@frappe.whitelist()
def available_slots(booking: str | None = None) -> list[dict]:
    _deny_event_guest()
    meeting_type = _ensure_default_meeting_type()
    if meeting_type:
        try:
            raw_slots = list_slots(meeting_type=meeting_type, days=7)
            if raw_slots:
                result = []
                for s in raw_slots[:8]:
                    st = s.get("start", "")
                    result.append({
                        "id": f"{meeting_type}|{st}|{s.get('staff', '')}",
                        "label": f"{st}",
                        "start": st,
                        "meeting_type": meeting_type,
                        "staff": s.get("staff")
                    })
                return result
        except Exception:
            pass

    base_date = getdate()
    tomorrow = add_days(base_date, 1)
    day_after = add_days(base_date, 2)
    day_three = add_days(base_date, 3)

    return [
        {
            "id": f"{meeting_type or 'DEFAULT'}|{tomorrow} 14:00:00|",
            "label": f"Tomorrow ({tomorrow.strftime('%a, %b %d')}) at 2:00 PM EST",
            "start": f"{tomorrow} 14:00:00",
            "meeting_type": meeting_type or "",
        },
        {
            "id": f"{meeting_type or 'DEFAULT'}|{tomorrow} 16:30:00|",
            "label": f"Tomorrow ({tomorrow.strftime('%a, %b %d')}) at 4:30 PM EST",
            "start": f"{tomorrow} 16:30:00",
            "meeting_type": meeting_type or "",
        },
        {
            "id": f"{meeting_type or 'DEFAULT'}|{day_after} 11:00:00|",
            "label": f"{day_after.strftime('%A (%b %d)')} at 11:00 AM EST",
            "start": f"{day_after} 11:00:00",
            "meeting_type": meeting_type or "",
        },
        {
            "id": f"{meeting_type or 'DEFAULT'}|{day_three} 15:00:00|",
            "label": f"{day_three.strftime('%A (%b %d)')} at 3:00 PM EST",
            "start": f"{day_three} 15:00:00",
            "meeting_type": meeting_type or "",
        },
    ]


@frappe.whitelist()
def book_appointment(slot: str, appointment_type: str = "video", notes: str = "", booking: str | None = None) -> dict:
    _deny_event_guest()
    user = frappe.session.user
    customer = (frappe.db.get_value("Customer", {"email_id": user}, "name") if user and user != "Guest" else "") or ""
    customer_name = (frappe.db.get_value("Customer", {"email_id": user}, "customer_name") if customer else None) or user

    meeting_type = _ensure_default_meeting_type()

    start_str = slot
    staff = None
    if "|" in slot:
        parts = slot.split("|")
        meeting_type = parts[0] or meeting_type
        start_str = parts[1]
        staff = parts[2] if len(parts) > 2 and parts[2] else None
    elif slot.startswith("SLOT-"):
        base_date = getdate()
        offset_days = 1 if slot in ("SLOT-1", "SLOT-2") else (2 if slot == "SLOT-3" else 3)
        slot_time = "14:00:00" if slot == "SLOT-1" else ("16:30:00" if slot == "SLOT-2" else ("11:00:00" if slot == "SLOT-3" else "15:00:00"))
        start_str = f"{add_days(base_date, offset_days)} {slot_time}"

    if not frappe.db.table_exists("EE Appointment"):
        frappe.throw("Appointment scheduling is not enabled on this site.")

    status = "requested" if booking else "scheduled"

    res = book(
        meeting_type=meeting_type,
        start=start_str,
        full_name=customer_name,
        email=user if user != "Guest" else "client@example.com",
        staff=staff,
        notes=notes,
        booking=booking,
        customer=customer,
        appointment_type=appointment_type,
        status=status,
    )
    return {
        "ok": True,
        "id": res.get("id"),
        "status": res.get("status", status),
        "start": res.get("start"),
        "message": "Consultation requested successfully. Our team will review and confirm your session." if status == "requested" else "Appointment confirmed."
    }


@frappe.whitelist()
def accept_appointment(name: str) -> dict:
    _require_staff()
    doc = frappe.get_doc("EE Appointment", name)
    doc.status = "scheduled"
    doc.save(ignore_permissions=True)
    meeting_name = frappe.db.get_value("EE Meeting Type", doc.meeting_type, "type_name") if doc.meeting_type else "Consultation"
    _notify(
        "appointment_booked",
        doc.invitee_email,
        {
            "invitee_name": doc.invitee_name,
            "meeting_name": meeting_name,
            "start_label": str(doc.start),
            "company_name": _company_name(),
            "manage_link": f"/schedule?token={doc.cancel_token}",
        },
    )
    return {"ok": True, "status": "scheduled", "id": doc.name}


@frappe.whitelist()
def cancel_appointment(appointment: str, reason: str = "") -> dict:
    _deny_event_guest()
    if frappe.db.table_exists("EE Appointment") and frappe.db.exists("EE Appointment", appointment):
        doc = frappe.get_doc("EE Appointment", appointment)
        doc.status = "canceled"
        if reason:
            doc.notes = f"{doc.notes or ''}\nCancellation reason: {reason}".strip()
        doc.save(ignore_permissions=True)
        return {"ok": True, "status": "canceled"}
    return {"ok": True}
