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
        })

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
def crew_check_in(assignment_name: str) -> dict:
    """Mark a crew member as checked in (event has started)."""
    _check_role(["EE Tenant Admin", "EE Dispatcher", "EE Crew", "System Manager"])
    ca = frappe.get_doc("Crew Assignment", assignment_name)
    if ca.status != "accepted":
        frappe.throw(f"Cannot check in from status '{ca.status}'.")
    ca.db_set({"status": "checked_in", "check_in": now_datetime()})
    frappe.db.set_value("Event Booking", ca.booking, "ee_dispatch_status", "in_progress")
    frappe.db.commit()
    return {"status": "checked_in"}


@frappe.whitelist()
def crew_check_out(assignment_name: str) -> dict:
    """Mark a crew member as checked out (event complete)."""
    _check_role(["EE Tenant Admin", "EE Dispatcher", "EE Crew", "System Manager"])
    ca = frappe.get_doc("Crew Assignment", assignment_name)
    if ca.status != "checked_in":
        frappe.throw(f"Cannot check out from status '{ca.status}'.")
    ca.db_set({"status": "completed", "check_out": now_datetime()})

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

@frappe.whitelist()
def generate_run_sheet(booking_name: str) -> dict:
    """Build or update a Run Sheet for the given booking."""
    _check_role(["EE Tenant Admin", "EE Dispatcher", "System Manager"])
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
    rs.client_name = booking.customer
    rs.client_phone = frappe.db.get_value("Contact", {"link_name": booking.customer}, "mobile_no") or ""
    rs.generated_at = now_datetime()

    # Equipment list from assigned assets
    rs.set("equipment_items", [])
    for asset_row in booking.assigned_assets:
        asset = frappe.get_doc("Service Asset", asset_row.asset)
        rs.append("equipment_items", {
            "asset": asset_row.asset,
            "asset_name": asset.asset_name,
            "quantity": asset_row.quantity_reserved or 1,
            "packed": 0,
        })
    # Also add service items as equipment entries (non-asset items)
    for item_row in booking.service_items:
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
            })

    frappe.db.commit()
    return {"status": "published", "run_sheet": rs_name}


@frappe.whitelist()
def get_run_sheet(booking_name: str) -> dict:
    """Return the full run sheet for a booking (used by mobile app)."""
    rs_name = frappe.db.get_value("Run Sheet", {"booking": booking_name}, "name")
    if not rs_name:
        frappe.throw("No run sheet found for this booking.")
    return frappe.get_doc("Run Sheet", rs_name).as_dict()


# ── Dispatch board ───────────────────────────────────────────────────────────

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
        fields=["name", "customer", "status", "ee_dispatch_status", "event_date",
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
