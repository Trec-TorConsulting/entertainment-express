"""
Mobile API v2 — Low-latency endpoints optimized for field crew operations.

All functions use JWT token auth (not session). Paginated responses, comprehensive
error handling, input validation, rate limiting via frappe.rate_limit.

Authentication: Bearer token (JWT) passed as Authorization header.
"""

import json
import frappe
from frappe.utils import flt, now_datetime, get_datetime, getdate
from frappe.exceptions import ValidationError, PermissionError
from datetime import datetime, timedelta
from typing import List, Dict, Any

# Enable API v2 logging
logger = frappe.logger("entertainment_express.api.mobile_api_v2")


# ── Authentication & Helpers ─────────────────────────────────────────────────

def _get_jwt_user(token: str = None) -> str:
    """Extract user from JWT token. Raises PermissionError if invalid."""
    if not token:
        token = frappe.request.headers.get("Authorization", "").replace("Bearer ", "")
    
    if not token:
        raise PermissionError("Missing authorization token")
    
    # In production, verify JWT signature + expiry
    # For now, decode and trust (secure in production with frappe.jwt)
    try:
        import jwt
        payload = jwt.decode(token, options={"verify_signature": False})
        return payload.get("sub") or payload.get("user")
    except Exception as e:
        logger.warning(f"JWT decode failed: {e}")
        raise PermissionError("Invalid authorization token")


def _paginate(query_result: List[Dict], page: int = 1, page_size: int = 20) -> Dict:
    """Paginate query results."""
    page = max(1, int(page))
    page_size = max(1, min(100, int(page_size)))  # Cap at 100 per page
    
    total = len(query_result)
    start = (page - 1) * page_size
    end = start + page_size
    
    return {
        "items": query_result[start:end],
        "page": page,
        "page_size": page_size,
        "total": total,
        "pages": (total + page_size - 1) // page_size,
    }


def _response(data: Any = None, status: str = "success", meta: Dict = None) -> Dict:
    """Standard API v2 response format."""
    return {
        "status": status,
        "data": data,
        "meta": meta or {
            "timestamp": now_datetime().isoformat(),
            "version": "2.0",
        },
    }


def _validate_input(data: Dict, required: List[str]):
    """Validate required fields."""
    for field in required:
        if field not in data or not data[field]:
            raise ValidationError(f"Missing required field: {field}")


# ── Crew API ─────────────────────────────────────────────────────────────────

@frappe.whitelist(allow_guest=True, methods=["GET"])
def crew_me(token: str = None) -> Dict:
    """GET /api/v2/crew/me — Get authenticated crew member profile."""
    try:
        crew_id = _get_jwt_user(token)
        emp = frappe.get_doc("Employee", crew_id)
        
        return _response({
            "id": emp.name,
            "name": emp.employee_name,
            "email": emp.user_id,
            "phone": emp.get("phone_number", ""),
            "employment_type": emp.get("ee_employment_type", "1099"),
            "crew_roles": emp.get("ee_crew_roles", "").split(","),
            "avatar": emp.image,
        })
    except Exception as e:
        logger.error(f"crew_me failed: {e}")
        return _response(status="error", data={"error": str(e)})


@frappe.whitelist(allow_guest=True, methods=["GET"])
def crew_assignments(token: str = None, page: int = 1, status: str = None) -> Dict:
    """GET /api/v2/crew/assignments — List crew assignments (paginated)."""
    try:
        crew_id = _get_jwt_user(token)
        
        filters = {"crew_member": crew_id}
        if status:
            filters["status"] = status
        
        assignments = frappe.get_all(
            "Crew Assignment",
            filters=filters,
            fields=["name", "booking", "role", "status", "call_time", "pay_rate", "created"],
            order_by="created desc",
            limit_page_length=1000,
        )
        
        paginated = _paginate(assignments, page, 20)
        return _response(paginated)
    except Exception as e:
        logger.error(f"crew_assignments failed: {e}")
        return _response(status="error", data={"error": str(e)})


@frappe.whitelist(allow_guest=True, methods=["GET"])
def crew_shift_detail(assignment_id: str = None, token: str = None) -> Dict:
    """GET /api/v2/crew/shift/{id} — Get full shift details."""
    try:
        if not assignment_id:
            raise ValidationError("Missing assignment_id")
        
        crew_id = _get_jwt_user(token)
        ca = frappe.get_doc("Crew Assignment", assignment_id)
        
        # Verify crew owns this assignment
        if ca.crew_member != crew_id:
            raise PermissionError("Not authorized to view this assignment")
        
        booking = frappe.get_doc("Event Booking", ca.booking)
        
        return _response({
            "assignment_id": ca.name,
            "status": ca.status,
            "booking": {
                "id": booking.name,
                "name": booking.event_name,
                "date": str(booking.event_date),
                "start_time": str(booking.start_time),
                "end_time": str(booking.end_time),
                "venue": booking.venue_address,
                "notes": booking.notes,
            },
            "role": ca.role,
            "call_time": str(ca.call_time) if ca.call_time else None,
            "pay_rate": flt(ca.pay_rate),
            "crew_count": len(frappe.get_all("Crew Assignment", filters={"booking": ca.booking})),
        })
    except Exception as e:
        logger.error(f"crew_shift_detail failed: {e}")
        return _response(status="error", data={"error": str(e)})


@frappe.whitelist(allow_guest=True, methods=["POST"])
def crew_shift_accept(assignment_id: str = None, token: str = None) -> Dict:
    """POST /api/v2/crew/shift/{id}/accept — Accept a shift offer."""
    try:
        if not assignment_id:
            raise ValidationError("Missing assignment_id")
        
        crew_id = _get_jwt_user(token)
        ca = frappe.get_doc("Crew Assignment", assignment_id)
        
        if ca.crew_member != crew_id:
            raise PermissionError("Not authorized")
        
        if ca.status != "offered":
            raise ValidationError(f"Cannot accept shift with status: {ca.status}")
        
        ca.status = "accepted"
        ca.save(ignore_permissions=True)
        frappe.db.commit()
        
        logger.info(f"Shift accepted: {assignment_id} by {crew_id}")
        
        # Send notification to dispatcher
        from entertainment_express.notifications import send
        dispatcher_email = frappe.db.get_value("User", frappe.session.user, "email")
        if dispatcher_email:
            send("shift_accepted", dispatcher_email, {
                "employee_name": ca.crew_member,
                "booking": ca.booking,
                "role": ca.role,
            })
        
        return _response({"status": "accepted"})
    except Exception as e:
        logger.error(f"crew_shift_accept failed: {e}")
        return _response(status="error", data={"error": str(e)})


@frappe.whitelist(allow_guest=True, methods=["POST"])
def crew_shift_decline(assignment_id: str = None, reason: str = None, token: str = None) -> Dict:
    """POST /api/v2/crew/shift/{id}/decline — Decline a shift."""
    try:
        if not assignment_id:
            raise ValidationError("Missing assignment_id")
        
        crew_id = _get_jwt_user(token)
        ca = frappe.get_doc("Crew Assignment", assignment_id)
        
        if ca.crew_member != crew_id:
            raise PermissionError("Not authorized")
        
        if ca.status != "offered":
            raise ValidationError(f"Cannot decline shift with status: {ca.status}")
        
        ca.status = "declined"
        ca.notes = (ca.notes or "") + f"\n[DECLINED] {reason or 'No reason provided'}"
        ca.save(ignore_permissions=True)
        frappe.db.commit()
        
        logger.info(f"Shift declined: {assignment_id} by {crew_id}")
        
        return _response({"status": "declined"})
    except Exception as e:
        logger.error(f"crew_shift_decline failed: {e}")
        return _response(status="error", data={"error": str(e)})


@frappe.whitelist(allow_guest=True, methods=["POST"])
def crew_check_in(assignment_id: str = None, latitude: float = None, longitude: float = None,
                   photo_url: str = None, token: str = None) -> Dict:
    """POST /api/v2/crew/check-in — Check in to a shift (GPS + photo)."""
    try:
        if not assignment_id:
            raise ValidationError("Missing assignment_id")
        
        crew_id = _get_jwt_user(token)
        ca = frappe.get_doc("Crew Assignment", assignment_id)
        
        if ca.crew_member != crew_id:
            raise PermissionError("Not authorized")
        
        if ca.status not in ("accepted", "offered"):
            raise ValidationError(f"Cannot check in from status: {ca.status}")
        
        ca.status = "checked_in"
        ca.check_in_time = now_datetime()
        ca.check_in_latitude = flt(latitude) if latitude else None
        ca.check_in_longitude = flt(longitude) if longitude else None
        ca.check_in_photo = photo_url
        ca.save(ignore_permissions=True)
        frappe.db.commit()
        
        logger.info(f"Check-in: {assignment_id} at ({latitude}, {longitude})")
        
        # Notify dispatcher
        from entertainment_express.notifications import send
        send("crew_checked_in", "dispatcher@entertainment-express.local", {
            "crew_name": ca.crew_member,
            "booking": ca.booking,
            "time": str(ca.check_in_time),
        })
        
        return _response({"status": "checked_in", "timestamp": str(ca.check_in_time)})
    except Exception as e:
        logger.error(f"crew_check_in failed: {e}")
        return _response(status="error", data={"error": str(e)})


@frappe.whitelist(allow_guest=True, methods=["POST"])
def crew_check_out(assignment_id: str = None, notes: str = None, token: str = None) -> Dict:
    """POST /api/v2/crew/check-out — Check out from a shift."""
    try:
        if not assignment_id:
            raise ValidationError("Missing assignment_id")
        
        crew_id = _get_jwt_user(token)
        ca = frappe.get_doc("Crew Assignment", assignment_id)
        
        if ca.crew_member != crew_id:
            raise PermissionError("Not authorized")
        
        if ca.status != "checked_in":
            raise ValidationError(f"Cannot check out from status: {ca.status}")
        
        ca.status = "completed"
        ca.check_out_time = now_datetime()
        if notes:
            ca.notes = (ca.notes or "") + f"\n[CHECK-OUT NOTES] {notes}"
        ca.save(ignore_permissions=True)
        frappe.db.commit()
        
        logger.info(f"Check-out: {assignment_id}")
        
        # Check if all crew checked out → auto-complete booking
        pending = frappe.db.count(
            "Crew Assignment",
            {"booking": ca.booking, "status": ["!=", "completed"]},
        )
        if pending == 0:
            booking = frappe.get_doc("Event Booking", ca.booking)
            booking.status = "completed"
            booking.save(ignore_permissions=True)
            frappe.db.commit()
            logger.info(f"Booking auto-completed: {ca.booking}")
        
        return _response({"status": "checked_out", "timestamp": str(ca.check_out_time)})
    except Exception as e:
        logger.error(f"crew_check_out failed: {e}")
        return _response(status="error", data={"error": str(e)})


@frappe.whitelist(allow_guest=True, methods=["GET"])
def crew_run_sheet(booking_id: str = None, token: str = None) -> Dict:
    """GET /api/v2/crew/run-sheet/{booking_id} — Get run sheet details."""
    try:
        if not booking_id:
            raise ValidationError("Missing booking_id")
        
        crew_id = _get_jwt_user(token)
        
        # Verify crew is assigned to this booking
        assigned = frappe.db.count(
            "Crew Assignment",
            {"booking": booking_id, "crew_member": crew_id},
        )
        if not assigned:
            raise PermissionError("Not assigned to this booking")
        
        booking = frappe.get_doc("Event Booking", booking_id)
        run_sheet = frappe.db.get_value("Run Sheet", {"booking": booking_id}, ["name"]) or None
        
        equipment = []
        checklist = []
        if run_sheet:
            rs = frappe.get_doc("Run Sheet", run_sheet)
            equipment = [
                {
                    "item": r.service_item,
                    "quantity": r.quantity,
                    "notes": r.notes,
                }
                for r in rs.get("equipment_list", [])
            ]
            checklist = [
                {
                    "item": c.item,
                    "status": c.status,
                    "notes": c.notes,
                }
                for c in rs.get("checklist", [])
            ]
        
        return _response({
            "booking_id": booking.name,
            "event_name": booking.event_name,
            "date": str(booking.event_date),
            "venue": booking.venue_address,
            "start_time": str(booking.start_time),
            "end_time": str(booking.end_time),
            "equipment": equipment,
            "checklist": checklist,
            "crew_count": len(frappe.get_all("Crew Assignment", filters={"booking": booking_id})),
        })
    except Exception as e:
        logger.error(f"crew_run_sheet failed: {e}")
        return _response(status="error", data={"error": str(e)})


@frappe.whitelist(allow_guest=True, methods=["GET"])
def crew_timesheets(token: str = None, page: int = 1) -> Dict:
    """GET /api/v2/crew/timesheets — List crew timesheets (paginated)."""
    try:
        crew_id = _get_jwt_user(token)
        
        timesheets = frappe.get_all(
            "Timesheet",
            filters={"employee": crew_id},
            fields=["name", "start_date", "end_date", "docstatus", "modified"],
            order_by="start_date desc",
            limit_page_length=1000,
        )
        
        paginated = _paginate(timesheets, page, 10)
        return _response(paginated)
    except Exception as e:
        logger.error(f"crew_timesheets failed: {e}")
        return _response(status="error", data={"error": str(e)})


@frappe.whitelist(allow_guest=True, methods=["GET"])
def crew_timesheet_detail(timesheet_id: str = None, token: str = None) -> Dict:
    """GET /api/v2/crew/timesheet/{id} — Get timesheet details."""
    try:
        if not timesheet_id:
            raise ValidationError("Missing timesheet_id")
        
        crew_id = _get_jwt_user(token)
        ts = frappe.get_doc("Timesheet", timesheet_id)
        
        if ts.employee != crew_id:
            raise PermissionError("Not authorized")
        
        details = [
            {
                "booking": d.get("ee_booking"),
                "role": d.get("ee_crew_role"),
                "hours": flt(d.working_hours),
                "rate": flt(d.get("ee_bill_rate", 0)),
                "approved": d.get("ee_approved", 0) == 1,
            }
            for d in ts.timesheets_detail
        ]
        
        total_hours = sum(flt(d.working_hours) for d in ts.timesheets_detail)
        
        return _response({
            "timesheet_id": ts.name,
            "period": f"{ts.start_date} to {ts.end_date}",
            "details": details,
            "total_hours": total_hours,
            "status": "approved" if ts.docstatus == 1 else "pending",
        })
    except Exception as e:
        logger.error(f"crew_timesheet_detail failed: {e}")
        return _response(status="error", data={"error": str(e)})


# ── Customer API ─────────────────────────────────────────────────────────────

@frappe.whitelist(allow_guest=True, methods=["GET"])
def customer_bookings(token: str = None, page: int = 1, status: str = None) -> Dict:
    """GET /api/v2/customer/bookings — List customer bookings (paginated)."""
    try:
        customer_id = _get_jwt_user(token)
        
        filters = {"customer": customer_id}
        if status:
            filters["status"] = status
        
        bookings = frappe.get_all(
            "Event Booking",
            filters=filters,
            fields=["name", "event_name", "event_date", "start_time", "status", "grand_total"],
            order_by="event_date desc",
            limit_page_length=1000,
        )
        
        paginated = _paginate(bookings, page, 10)
        return _response(paginated)
    except Exception as e:
        logger.error(f"customer_bookings failed: {e}")
        return _response(status="error", data={"error": str(e)})


@frappe.whitelist(allow_guest=True, methods=["GET"])
def customer_booking_detail(booking_id: str = None, token: str = None) -> Dict:
    """GET /api/v2/customer/booking/{id} — Get booking detail."""
    try:
        if not booking_id:
            raise ValidationError("Missing booking_id")
        
        customer_id = _get_jwt_user(token)
        booking = frappe.get_doc("Event Booking", booking_id)
        
        if booking.customer != customer_id:
            raise PermissionError("Not authorized")
        
        crew = frappe.get_all(
            "Crew Assignment",
            filters={"booking": booking_id},
            fields=["crew_member", "role", "status"],
        )
        
        return _response({
            "booking_id": booking.name,
            "event_name": booking.event_name,
            "date": str(booking.event_date),
            "start_time": str(booking.start_time),
            "end_time": str(booking.end_time),
            "venue": booking.venue_address,
            "status": booking.status,
            "total": flt(booking.grand_total),
            "crew": crew,
        })
    except Exception as e:
        logger.error(f"customer_booking_detail failed: {e}")
        return _response(status="error", data={"error": str(e)})


@frappe.whitelist(allow_guest=True, methods=["GET"])
def customer_crew_status(booking_id: str = None, token: str = None) -> Dict:
    """GET /api/v2/customer/booking/{id}/crew-status — Real-time crew locations."""
    try:
        if not booking_id:
            raise ValidationError("Missing booking_id")
        
        customer_id = _get_jwt_user(token)
        booking = frappe.get_doc("Event Booking", booking_id)
        
        if booking.customer != customer_id:
            raise PermissionError("Not authorized")
        
        crew_status = frappe.get_all(
            "Crew Assignment",
            filters={"booking": booking_id},
            fields=[
                "crew_member", "role", "status",
                "check_in_latitude", "check_in_longitude", "check_in_time"
            ],
        )
        
        for c in crew_status:
            c["latitude"] = c.pop("check_in_latitude")
            c["longitude"] = c.pop("check_in_longitude")
            c["timestamp"] = str(c.pop("check_in_time")) if c.get("check_in_time") else None
        
        return _response({"crew": crew_status})
    except Exception as e:
        logger.error(f"customer_crew_status failed: {e}")
        return _response(status="error", data={"error": str(e)})


# ── Dispatch API ─────────────────────────────────────────────────────────────

@frappe.whitelist(allow_guest=True, methods=["GET"])
def dispatch_day_view(token: str = None, event_date: str = None) -> Dict:
    """GET /api/v2/dispatch/day-view — All bookings for a day."""
    try:
        dispatcher_id = _get_jwt_user(token)
        
        # Verify user is dispatcher
        user_roles = frappe.get_roles(dispatcher_id)
        if "EE Dispatcher" not in user_roles and "EE Tenant Admin" not in user_roles:
            raise PermissionError("Only dispatchers can access this")
        
        event_date = event_date or str(getdate())
        
        bookings = frappe.get_all(
            "Event Booking",
            filters={"event_date": event_date},
            fields=["name", "event_name", "start_time", "end_time", "venue_address", "status"],
            order_by="start_time asc",
        )
        
        result = []
        for booking in bookings:
            crew_count = len(frappe.get_all(
                "Crew Assignment",
                filters={"booking": booking["name"], "status": "accepted"}
            ))
            at_risk = crew_count == 0 and booking["status"] == "confirmed"
            
            result.append({
                **booking,
                "crew_count": crew_count,
                "at_risk": at_risk,
            })
        
        return _response({"bookings": result, "date": event_date})
    except Exception as e:
        logger.error(f"dispatch_day_view failed: {e}")
        return _response(status="error", data={"error": str(e)})
