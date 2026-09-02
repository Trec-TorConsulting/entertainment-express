"""
Dispatch API — crew assignment lifecycle, run sheet, dispatch board.

All functions @frappe.whitelist(), role-checked.
Shift accept/decline use HMAC tokens (no session required for crew link).
"""

import hmac
import hashlib
import secrets

import frappe
from frappe.utils import flt, now_datetime, get_datetime


# ── Crew assignment ──────────────────────────────────────────────────────────

@frappe.whitelist()
def assign_crew(booking_name: str, employee_name: str, role_name: str,
                call_time: str = None, pay_basis: str = None, pay_rate: float = 0.0) -> dict:
    """
    Create a Crew Assignment (status=offered) and notify the crew member.
    Conflict check: blocks if the employee already has an accepted/checked-in
    assignment overlapping this booking's event window.
    """
    _check_role(["EE Tenant Admin", "EE Dispatcher", "System Manager"])

    booking = frappe.get_doc("Event Booking", booking_name)

    # Conflict check: overlapping accepted/checked_in assignments
    conflicts = frappe.db.sql(
        """
        SELECT ca.name
        FROM `tabCrew Assignment` ca
        JOIN `tabEvent Booking` eb ON eb.name = ca.booking
        WHERE ca.crew_member = %(emp)s
          AND ca.status IN ('accepted', 'checked_in')
          AND ca.booking != %(booking)s
          AND eb.event_date = %(event_date)s
          AND eb.start_time < %(end_time)s
          AND eb.end_time   > %(start_time)s
        """,
        {
            "emp": employee_name,
            "booking": booking_name,
            "event_date": booking.event_date,
            "start_time": booking.start_time,
            "end_time": booking.end_time,
        },
        as_dict=True,
    )
    if conflicts:
        frappe.throw(
            f"Employee {employee_name} already has a conflicting assignment "
            f"({conflicts[0]['name']}) for this event window.",
            frappe.ValidationError,
        )

    # Check worker availability (phase-3 integration)
    try:
        from entertainment_express.api.hr_workforce import check_worker_availability
        avail_result = check_worker_availability(
            employee_name,
            str(booking.start_time),
            str(booking.end_time),
        )
        if not avail_result.get("available"):
            frappe.throw(
                f"Worker not available: {avail_result.get('reason', 'Unknown reason')}",
                frappe.ValidationError,
            )
    except ImportError:
        # hr_workforce module not yet available; skip check
        pass

    token = _assignment_token(f"OFFER:{employee_name}")
    ca = frappe.get_doc({
        "doctype": "Crew Assignment",
        "booking": booking_name,
        "crew_member": employee_name,
        "role": role_name,
        "status": "offered",
        "call_time": frappe.utils.get_datetime(call_time) if call_time else None,
        "pay_basis": pay_basis or "",
        "pay_rate": flt(pay_rate),
        "shift_token": token,
    })
    ca.insert(ignore_permissions=False)
    frappe.db.commit()

    # Notify crew
    crew_email = frappe.db.get_value("Employee", employee_name, "user_id") or \
                 frappe.db.get_value("Employee", employee_name, "prefered_email") or ""
    if crew_email:
        site_url = frappe.utils.get_url()
        accept_link = f"{site_url}/api/method/entertainment_express.api.dispatch.accept_shift?assignment={ca.name}&token={token}"
        decline_link = f"{site_url}/api/method/entertainment_express.api.dispatch.decline_shift?assignment={ca.name}&token={token}"
        from entertainment_express.notifications import send
        send("shift_offered", crew_email, {
            "employee_name": frappe.db.get_value("Employee", employee_name, "employee_name"),
            "event_date": str(booking.event_date),
            "venue_address": booking.venue_address or "",
            "role": role_name,
            "call_time": str(call_time or ""),
            "accept_link": accept_link,
            "decline_link": decline_link,
            "field_link": f"{site_url}/employee/field",
        }, channels=["email", "push"])

    return {"assignment": ca.name, "status": "offered"}


@frappe.whitelist(allow_guest=True)
def accept_shift(assignment: str = None, token: str = None) -> dict:
    """Crew-facing: accept a shift offer via tokenized link."""
    if not assignment or not token:
        frappe.throw("Invalid request.", frappe.PermissionError)

    ca = frappe.get_doc("Crew Assignment", assignment)
    if token != ca.shift_token:
        frappe.throw("Invalid or expired token.", frappe.PermissionError)
    if ca.status != "offered":
        return {"status": ca.status, "message": f"Assignment is already {ca.status}."}

    # Final conflict check at acceptance time
    booking = frappe.get_doc("Event Booking", ca.booking)
    conflicts = frappe.db.sql(
        """
        SELECT name FROM `tabCrew Assignment`
        WHERE crew_member = %(emp)s AND status IN ('accepted','checked_in')
          AND booking != %(booking)s
        """,
        {"emp": ca.crew_member, "booking": ca.booking},
        as_dict=True,
    )
    if conflicts:
        frappe.throw("Conflict: you already have an accepted assignment at this time.")

    ca.db_set("status", "accepted")
    frappe.db.commit()

    # Notify dispatcher
    _notify_dispatcher("shift_accepted", {
        "employee_name": frappe.db.get_value("Employee", ca.crew_member, "employee_name"),
        "booking": ca.booking,
        "role": ca.role,
    })
    return {"status": "accepted"}


@frappe.whitelist(allow_guest=True)
def decline_shift(assignment: str = None, token: str = None) -> dict:
    """Crew-facing: decline a shift offer."""
    if not assignment or not token:
        frappe.throw("Invalid request.", frappe.PermissionError)

    ca = frappe.get_doc("Crew Assignment", assignment)
    if token != ca.shift_token:
        frappe.throw("Invalid or expired token.", frappe.PermissionError)
    if ca.status not in ("offered",):
        return {"status": ca.status}

    ca.db_set("status", "declined")
    frappe.db.commit()

    _notify_dispatcher("shift_declined", {
        "employee_name": frappe.db.get_value("Employee", ca.crew_member, "employee_name"),
        "booking": ca.booking,
        "role": ca.role,
    })
    return {"status": "declined"}


@frappe.whitelist()
def crew_check_in(assignment_name: str, latitude: float = None, longitude: float = None) -> dict:
    """Mark a crew member as checked in (event has started). Optional GPS."""
    _check_role(["EE Tenant Admin", "EE Dispatcher", "EE Crew", "EE Entertainer", "System Manager"])
    ca = frappe.get_doc("Crew Assignment", assignment_name)
    if ca.status != "accepted":
        frappe.throw(f"Cannot check in from status '{ca.status}'.")
    updates = {"status": "checked_in", "check_in": now_datetime(), "stage": "on-site"}
    if latitude not in (None, "", "null"):
        updates["check_in_lat"] = flt(latitude)
    if longitude not in (None, "", "null"):
        updates["check_in_lng"] = flt(longitude)
    ca.db_set(updates)
    frappe.db.set_value("Event Booking", ca.booking, "ee_dispatch_status", "in_progress")
    if latitude not in (None, "", "null") and longitude not in (None, "", "null"):
        try:
            from entertainment_express.api.dispatch_realtime import publish_crew_location_update

            publish_crew_location_update(
                ca.name,
                flt(latitude),
                flt(longitude),
                crew_id=ca.crew_member,
                booking_id=ca.booking,
                status="checked_in",
            )
        except Exception:
            pass
    try:
        from entertainment_express.api.hr_workforce import get_or_create_timesheet

        today = frappe.utils.today() if hasattr(frappe.utils, "today") else frappe.utils.nowdate()
        get_or_create_timesheet(ca.crew_member, str(today))
    except Exception:
        pass
    frappe.db.commit()
    return {"status": "checked_in"}


@frappe.whitelist()
def crew_check_out(assignment_name: str) -> dict:
    """Mark a crew member as checked out (event complete)."""
    _check_role(["EE Tenant Admin", "EE Dispatcher", "EE Crew", "EE Entertainer", "System Manager"])
    ca = frappe.get_doc("Crew Assignment", assignment_name)
    if ca.status != "checked_in":
        frappe.throw(f"Cannot check out from status '{ca.status}'.")
    ca.db_set({"status": "completed", "check_out": now_datetime(), "stage": "complete"})

    # If all crew for the booking are completed, mark booking completed
    open_assignments = frappe.db.count(
        "Crew Assignment",
        {"booking": ca.booking, "status": ["in", ["offered", "accepted", "checked_in"]]},
    )
    if open_assignments == 0:
        frappe.db.set_value("Event Booking", ca.booking, {
            "ee_dispatch_status": "completed",
            "status": "completed",
        })
    frappe.db.commit()
    return {"status": "completed"}


# ── Run sheet ────────────────────────────────────────────────────────────────

def _build_run_sheet(booking_name: str):
    """Create or refresh a Run Sheet. Caller must authorize."""
    booking = frappe.get_doc("Event Booking", booking_name)

    # Get or create Run Sheet
    rs_name = frappe.db.get_value("Run Sheet", {"booking": booking_name}, "name")
    if rs_name:
        rs = frappe.get_doc("Run Sheet", rs_name)
    else:
        rs = frappe.get_doc({"doctype": "Run Sheet", "booking": booking_name})
        rs.insert(ignore_permissions=True)

    # Populate from booking
    client = frappe.get_doc("Customer", booking.customer)
    rs.venue_address = booking.venue_address or ""
    rs.venue_geo = booking.venue_geo or ""
    notes = []
    for label, field in (("Load-in", "load_in_notes"), ("Parking", "parking_notes"), ("Power", "power_notes"), ("Curfew", "noise_curfew")):
        value = getattr(booking, field, None) or ""
        if value:
            notes.append(f"{label}: {value}")
    if notes:
        extra = "\n".join(notes)
        rs.access_notes = f"{rs.access_notes or ''}\n{extra}".strip() if rs.access_notes else extra
    rs.client_name = booking.customer
    rs.client_phone = frappe.db.get_value("Contact", {"link_name": booking.customer}, "mobile_no") or ""
    rs.generated_at = now_datetime()

    # Equipment list from assigned assets
    rs.set("equipment_items", [])
    for asset_row in booking.assigned_assets or []:
        asset = frappe.get_doc("Service Asset", asset_row.asset)
        rs.append("equipment_items", {
            "asset": asset_row.asset,
            "asset_name": asset.asset_name,
            "quantity": asset_row.quantity_reserved or 1,
            "packed": 0,
        })
    # Also add service items as equipment entries (non-asset items)
    for item_row in booking.service_items or []:
        if not any(eq.asset_name == item_row.item_name for eq in rs.equipment_items):
            rs.append("equipment_items", {
                "asset": None,
                "asset_name": item_row.item_name,
                "quantity": int(item_row.qty or 1),
                "packed": 0,
            })

    # Default checklist items (if empty)
    if not rs.checklist_items:
        for i, task in enumerate(_default_checklist(booking), 1):
            rs.append("checklist_items", {"order": i, "description": task, "done": 0})

    rs.save(ignore_permissions=True)
    frappe.db.commit()
    return {"run_sheet": rs.name, "booking": booking_name}


@frappe.whitelist()
def generate_run_sheet(booking_name: str) -> dict:
    """Build or update a Run Sheet for the given booking."""
    _check_role(["EE Tenant Admin", "EE Dispatcher", "System Manager"])
    return _build_run_sheet(booking_name)


@frappe.whitelist()
def publish_run_sheet(booking_name: str) -> dict:
    """Set published=1 and notify all accepted crew."""
    _check_role(["EE Tenant Admin", "EE Dispatcher", "System Manager"])
    rs_name = frappe.db.get_value("Run Sheet", {"booking": booking_name}, "name")
    if not rs_name:
        frappe.throw("Run Sheet not found. Generate it first.")

    frappe.db.set_value("Run Sheet", rs_name, "published", 1)
    frappe.db.set_value("Event Booking", booking_name, "ee_dispatch_status", "dispatched")

    # Notify all accepted/offered crew
    assignments = frappe.get_all(
        "Crew Assignment",
        filters={"booking": booking_name, "status": ["in", ["offered", "accepted"]]},
        fields=["crew_member", "role"],
    )
    booking = frappe.get_doc("Event Booking", booking_name)
    for ca in assignments:
        crew_email = frappe.db.get_value("Employee", ca["crew_member"], "user_id") or ""
        if crew_email:
            from entertainment_express.notifications import send
            send("run_sheet_published", crew_email, {
                "employee_name": frappe.db.get_value("Employee", ca["crew_member"], "employee_name"),
                "event_date": str(booking.event_date),
                "venue_address": booking.venue_address or "",
                "role": ca["role"],
                "field_link": f"{frappe.utils.get_url()}/employee/field",
            }, channels=["email", "push"])

    frappe.db.commit()
    return {"status": "published", "run_sheet": rs_name}


@frappe.whitelist()
def get_run_sheet(booking_name: str) -> dict:
    """Return the full run sheet for a booking (used by mobile app)."""
    rs_name = frappe.db.get_value("Run Sheet", {"booking": booking_name}, "name")
    if not rs_name:
        frappe.throw("No run sheet found for this booking.")
    data = frappe.get_doc("Run Sheet", rs_name).as_dict()
    try:
        from entertainment_express.event_planning import crew_view

        data["planning"] = crew_view.planning(booking_name)
        data["timeline"] = crew_view.timeline(booking_name)
        data["music"] = crew_view.music(booking_name)
    except Exception:
        data["planning"] = []
        data["timeline"] = {}
        data["music"] = {}
    return data


# ── Dispatch board ───────────────────────────────────────────────────────────

@frappe.whitelist()
def list_available_crew(event_date: str = None, role_name: str = None) -> list:
    """
    List Active employees available for assignment on a date.
    Excludes employees with accepted/checked_in conflicts that day.
    """
    _check_role(["EE Tenant Admin", "EE Dispatcher", "System Manager"])
    event_date = frappe.utils.getdate(event_date) if event_date else frappe.utils.getdate()

    busy = set()
    day_assignments = frappe.db.sql(
        """
        SELECT ca.crew_member
        FROM `tabCrew Assignment` ca
        JOIN `tabEvent Booking` eb ON eb.name = ca.booking
        WHERE ca.status IN ('accepted', 'checked_in')
          AND eb.event_date = %s
        """,
        (event_date,),
        as_dict=True,
    )
    busy = {row.crew_member for row in day_assignments}

    employees = frappe.get_all(
        "Employee",
        filters={"status": "Active"},
        fields=["name", "employee_name", "user_id", "image", "ee_crew_roles", "ee_default_pay_rate", "ee_pay_basis"],
        limit_page_length=200,
    )

    result = []
    for emp in employees:
        if emp["name"] in busy:
            continue
        roles = [r.strip() for r in (emp.get("ee_crew_roles") or "").split(",") if r.strip()]
        if role_name and role_name not in roles:
            continue
        result.append({
            "employee": emp["name"],
            "employee_name": emp["employee_name"],
            "roles": roles,
            "avatar": emp.get("image"),
            "pay_rate": flt(emp.get("ee_default_pay_rate")),
            "pay_basis": emp.get("ee_pay_basis") or "per_event",
            "available": True,
        })
    return result


@frappe.whitelist()
def get_dispatch_analytics(days: int = 30) -> dict:
    """
    Utilization and reliability snapshot for the dispatch portal.
    utilization = assigned_shifts / (active_crew * days) (bounded).
    """
    _check_role(["EE Tenant Admin", "EE Dispatcher", "System Manager"])
    from datetime import timedelta

    days = max(1, min(90, int(days or 30)))
    start = frappe.utils.add_days(frappe.utils.getdate(), -days)

    active_crew = frappe.db.count("Employee", {"status": "Active"}) or 1
    assignments = frappe.get_all(
        "Crew Assignment",
        filters={"creation": [">=", str(start)]},
        fields=["name", "crew_member", "status", "booking"],
    )

    offered = len([a for a in assignments if a["status"] == "offered"])
    accepted = len([a for a in assignments if a["status"] in ("accepted", "checked_in", "completed")])
    declined = len([a for a in assignments if a["status"] == "declined"])
    completed = len([a for a in assignments if a["status"] == "completed"])
    no_show = len([a for a in assignments if a["status"] == "no_show"])

    bookings = frappe.get_all(
        "Event Booking",
        filters={"event_date": [">=", str(start)]},
        fields=["name", "customer", "status", "event_date", "grand_total"],
    )
    repeat_customers = {}
    for b in bookings:
        repeat_customers[b["customer"]] = repeat_customers.get(b["customer"], 0) + 1
    repeat_booking_count = sum(1 for c, n in repeat_customers.items() if n > 1)

    total_shifts = len(assignments) or 1
    utilization = round(min(100.0, (accepted / max(active_crew * days, 1)) * 100), 1)
    accept_rate = round((accepted / total_shifts) * 100, 1) if assignments else 0.0
    reliability = round(((completed) / max(accepted, 1)) * 100, 1) if accepted else 0.0

    by_crew = {}
    for a in assignments:
        key = a["crew_member"]
        by_crew.setdefault(key, {"crew_member": key, "accepted": 0, "completed": 0, "declined": 0})
        if a["status"] in ("accepted", "checked_in", "completed"):
            by_crew[key]["accepted"] += 1
        if a["status"] == "completed":
            by_crew[key]["completed"] += 1
        if a["status"] == "declined":
            by_crew[key]["declined"] += 1

    crew_rows = []
    for emp_id, stats in by_crew.items():
        stats["employee_name"] = frappe.db.get_value("Employee", emp_id, "employee_name") or emp_id
        crew_rows.append(stats)
    crew_rows.sort(key=lambda r: r["completed"], reverse=True)

    return {
        "window_days": days,
        "active_crew": active_crew,
        "bookings": len(bookings),
        "repeat_booking_customers": repeat_booking_count,
        "shifts": {
            "offered": offered,
            "accepted": accepted,
            "declined": declined,
            "completed": completed,
            "no_show": no_show,
        },
        "utilization_pct": utilization,
        "accept_rate_pct": accept_rate,
        "reliability_pct": reliability,
        "crew": crew_rows[:50],
    }


@frappe.whitelist()
def get_dispatch_board(date: str) -> list:
    """
    Return all bookings for the given date with crew/asset assignment status.
    `at_risk` = True if a confirmed booking within 48h has unfilled required crew roles.
    """
    _check_role(["EE Tenant Admin", "EE Dispatcher", "System Manager"])
    from datetime import datetime, timedelta

    event_date = frappe.utils.getdate(date)
    now = now_datetime()
    at_risk_cutoff = now + timedelta(hours=48)
    at_risk_date = at_risk_cutoff.date()

    bookings = frappe.get_all(
        "Event Booking",
        filters={"event_date": event_date, "status": ["in", ["tentative", "confirmed", "in_progress"]]},
        fields=["name", "customer", "event_name", "status", "ee_dispatch_status", "event_date",
                "start_time", "end_time", "venue_address", "grand_total"],
        order_by="start_time asc",
    )

    result = []
    for bk in bookings:
        # Crew assignments
        assignments = frappe.get_all(
            "Crew Assignment",
            filters={"booking": bk["name"]},
            fields=["name", "crew_member", "role", "status", "call_time"],
        )
        # Asset assignments from booking
        assets = frappe.get_all(
            "Event Booking Asset",
            filters={"parent": bk["name"]},
            fields=["asset", "asset_name"],
        )
        # At-risk: confirmed + within 48h + no accepted crew assignment
        is_at_risk = False
        if bk["status"] == "confirmed" and event_date <= at_risk_date:
            accepted = [a for a in assignments if a["status"] in ("accepted", "checked_in")]
            is_at_risk = len(accepted) == 0

        result.append({
            **bk,
            "crew_assignments": assignments,
            "assets": assets,
            "at_risk": is_at_risk,
        })
    return result


@frappe.whitelist()
def suggest_crew(booking_name: str, role_name: str | None = None) -> list:
    """Rank available crew for a job: role match first, then anyone free that day."""
    _check_role(["EE Tenant Admin", "EE Dispatcher", "System Manager"])
    booking = frappe.get_doc("Event Booking", booking_name)
    wanted = (role_name or "").strip()
    rows = list_available_crew(event_date=str(booking.event_date), role_name=None)
    matched = [r for r in rows if wanted and wanted in (r.get("roles") or [])]
    matched_ids = {r["employee"] for r in matched}
    rest = [r for r in rows if r["employee"] not in matched_ids]
    ranked = []
    for idx, row in enumerate(matched + rest, 1):
        reason = (
            "Has this role and is free that day"
            if wanted and row["employee"] in matched_ids
            else "Free that day"
        )
        ranked.append(
            {
                "employee": row["employee"],
                "name": row["employee_name"],
                "roles": row.get("roles") or [],
                "rank": idx,
                "reason": reason,
            }
        )
    return ranked[:8]


@frappe.whitelist()
def assign_asset(booking_name: str, asset_name: str, quantity: int = 1) -> dict:
    """Reserve a service asset on a booking if the window is free on this site."""
    _check_role(["EE Tenant Admin", "EE Dispatcher", "System Manager"])
    booking = frappe.get_doc("Event Booking", booking_name)
    from datetime import datetime

    start_t = frappe.utils.get_time(booking.start_time or "12:00:00")
    end_t = frappe.utils.get_time(booking.end_time or "18:00:00")
    start = datetime.combine(frappe.utils.getdate(booking.event_date), start_t)
    end = datetime.combine(frappe.utils.getdate(booking.event_date), end_t)
    from entertainment_express.booking.availability import check

    result = check(asset_name, start, end)
    if not result.get("available"):
        frappe.throw(result.get("reason") or "That gear is already booked for this window.")
    existing = [row.asset for row in (booking.assigned_assets or [])]
    if asset_name in existing:
        return {"status": "already", "asset": asset_name}
    booking.append(
        "assigned_assets",
        {"asset": asset_name, "quantity_reserved": int(quantity or 1)},
    )
    booking.save()
    frappe.db.commit()
    return {"status": "assigned", "asset": asset_name}


def compute_day_route(date: str) -> dict:
    """Order the day's jobs by start time and attach drive minutes when maps are on."""
    jobs = get_dispatch_board(date)
    stops = []
    prev_geo = ""
    for idx, job in enumerate(jobs, 1):
        geo = frappe.db.get_value("Event Booking", job["name"], "venue_geo") or ""
        travel = None
        if prev_geo and geo:
            try:
                from entertainment_express.integrations.maps import travel_minutes

                travel = travel_minutes(prev_geo, geo)
            except Exception:
                travel = None
        stops.append(
            {
                "sequence": idx,
                "booking": job["name"],
                "title": job.get("event_name") or job["name"],
                "when": str(job.get("start_time") or ""),
                "place": job.get("venue_address") or "",
                "travel_minutes": travel,
            }
        )
        if geo:
            prev_geo = geo
    return {"day": date, "stops": stops}


@frappe.whitelist()
def plan_routes(date: str) -> dict:
    """Build and save today's stop order. Missing maps keys skip drive times."""
    _check_role(["EE Tenant Admin", "EE Dispatcher", "System Manager"])
    payload = compute_day_route(date)
    if not frappe.db.exists("DocType", "Route Plan"):
        return payload
    name = frappe.db.get_value("Route Plan", {"plan_date": date}, "name")
    if name:
        doc = frappe.get_doc("Route Plan", name)
    else:
        doc = frappe.get_doc({"doctype": "Route Plan", "plan_date": date})
        doc.insert()
    doc.set("stops", [])
    for stop in payload["stops"]:
        doc.append(
            "stops",
            {
                "sequence": stop["sequence"],
                "booking": stop["booking"],
                "title": stop["title"],
                "call_time": stop["when"],
                "travel_minutes": stop["travel_minutes"],
                "venue_address": stop["place"],
            },
        )
    doc.save()
    frappe.db.commit()
    return payload


# ── Helpers ──────────────────────────────────────────────────────────────────

def _default_checklist(booking) -> list[str]:
    """Return sensible default checklist items based on service items."""
    tasks = [
        "Confirm arrival time with client",
        "Unload and stage all equipment",
        "Test all equipment before doors open",
        "Review event timeline / run-of-show",
        "Confirm emergency contacts on site",
        "Post-event: pack all equipment",
        "Post-event: confirm no items left behind",
    ]
    return tasks


def _notify_dispatcher(template_key: str, context: dict) -> None:
    dispatchers = frappe.get_all(
        "Has Role",
        filters={"role": "EE Dispatcher", "parenttype": "User"},
        fields=["parent"],
        limit=3,
    )
    from entertainment_express.notifications import send
    for d in dispatchers:
        email = frappe.db.get_value("User", d["parent"], "email")
        if email:
            send(template_key, email, context)


def _assignment_token(seed: str) -> str:
    secret = frappe.conf.get("ee_signing_secret") or "CHANGE_ME_IN_SITE_CONFIG"
    return hmac.new(secret.encode(), seed.encode(), hashlib.sha256).hexdigest()[:32]


def _check_role(allowed_roles: list[str]) -> None:
    if frappe.session.user == "Guest":
        frappe.throw("Authentication required.", frappe.PermissionError)
    if not any(r in frappe.get_roles(frappe.session.user) for r in allowed_roles):
        frappe.throw("Insufficient permissions.", frappe.PermissionError)
