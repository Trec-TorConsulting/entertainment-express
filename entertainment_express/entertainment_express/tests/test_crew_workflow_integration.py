"""
Integration tests: crew shift accept → check-in → check-out (phase-4 task 6.2).

End-to-end against mobile_api_v2 with JWT tokens; asserts assignment and
booking status transitions, including auto-complete when last crew checks out.
"""

from datetime import datetime, timedelta
from unittest.mock import patch

import frappe

from entertainment_express.api.auth_jwt import issue_token_pair
from entertainment_express.api import mobile_api_v2 as api


_rl = patch("entertainment_express.api.rate_limit.check_rate_limit", return_value=None)


def _crew_token(employee: str) -> str:
    return issue_token_pair(employee, scopes=["crew_read", "crew_write"])["access_token"]


def _ensure_customer() -> str:
    name = "CUS-INTEGRATION-CREW-FLOW"
    existing = frappe.db.get_value("Customer", {"customer_name": name}, "name")
    if existing:
        return existing
    return frappe.get_doc({
        "doctype": "Customer",
        "customer_name": name,
        "customer_type": "Individual",
    }).insert().name


class TestCrewAcceptCheckInCheckOutFlow:
    """Full mobile API crew lifecycle against one booking."""

    @_rl
    def test_single_crew_flow_completes_booking(self):
        customer = _ensure_customer()
        today = frappe.utils.getdate()
        emp = frappe.get_doc({
            "doctype": "Employee",
            "employee_name": "Integration Solo Crew",
            "employee": f"EMP-INT-{frappe.utils.random_string(5)}",
            "status": "Active",
        }).insert()

        booking = frappe.get_doc({
            "doctype": "Event Booking",
            "event_name": f"Integration Solo {frappe.utils.random_string(4)}",
            "event_date": today,
            "start_time": datetime.combine(today, datetime.strptime("18:00", "%H:%M").time()),
            "end_time": datetime.combine(today, datetime.strptime("22:00", "%H:%M").time()),
            "status": "confirmed",
            "customer": customer,
        }).insert()

        ca = frappe.get_doc({
            "doctype": "Crew Assignment",
            "booking": booking.name,
            "crew_member": emp.name,
            "role": "DJ",
            "status": "offered",
        }).insert()

        tok = _crew_token(emp.name)

        # 1) Accept
        accept = api.crew_shift_accept(assignment_id=ca.name, token=tok)
        assert accept["status"] == "success", accept
        assert frappe.db.get_value("Crew Assignment", ca.name, "status") == "accepted"

        detail = api.crew_shift_detail(assignment_id=ca.name, token=tok)
        assert detail["status"] == "success"
        assert detail["data"]["status"] == "accepted"

        # 2) Check-in with GPS
        checkin = api.crew_check_in(
            assignment_id=ca.name,
            latitude=40.7128,
            longitude=-74.0060,
            photo_url="https://cdn.example/checkin.jpg",
            token=tok,
        )
        assert checkin["status"] == "success", checkin
        assert checkin["data"]["status"] == "checked_in"
        assert frappe.db.get_value("Crew Assignment", ca.name, "status") == "checked_in"
        assert frappe.db.get_value("Crew Assignment", ca.name, "check_in")

        from entertainment_express.api.dispatch_realtime import get_crew_location

        cached = get_crew_location(ca.name)
        assert cached is not None
        assert abs(cached["latitude"] - 40.7128) < 0.001

        # 3) Check-out → assignment completed + booking auto-completed
        checkout = api.crew_check_out(
            assignment_id=ca.name, notes="Event wrapped cleanly", token=tok
        )
        assert checkout["status"] == "success", checkout
        assert checkout["data"]["status"] == "checked_out"
        assert frappe.db.get_value("Crew Assignment", ca.name, "status") == "completed"
        assert frappe.db.get_value("Crew Assignment", ca.name, "check_out")
        assert frappe.db.get_value("Event Booking", booking.name, "status") == "completed"

    @_rl
    def test_multi_crew_booking_completes_only_after_last_checkout(self):
        customer = _ensure_customer()
        today = frappe.utils.getdate() + timedelta(days=1)

        booking = frappe.get_doc({
            "doctype": "Event Booking",
            "event_name": f"Integration Duo {frappe.utils.random_string(4)}",
            "event_date": today,
            "start_time": datetime.combine(today, datetime.strptime("17:00", "%H:%M").time()),
            "end_time": datetime.combine(today, datetime.strptime("21:00", "%H:%M").time()),
            "status": "confirmed",
            "customer": customer,
        }).insert()

        emps = []
        assignments = []
        for role in ("DJ", "Host"):
            emp = frappe.get_doc({
                "doctype": "Employee",
                "employee_name": f"Integration {role}",
                "employee": f"EMP-INT-{frappe.utils.random_string(5)}",
                "status": "Active",
            }).insert()
            ca = frappe.get_doc({
                "doctype": "Crew Assignment",
                "booking": booking.name,
                "crew_member": emp.name,
                "role": role,
                "status": "offered",
            }).insert()
            emps.append(emp)
            assignments.append(ca)

        # Both accept + check in
        for emp, ca in zip(emps, assignments):
            tok = _crew_token(emp.name)
            assert api.crew_shift_accept(assignment_id=ca.name, token=tok)["status"] == "success"
            assert api.crew_check_in(
                assignment_id=ca.name, latitude=34.05, longitude=-118.24, token=tok
            )["status"] == "success"

        # First checkout — booking stays confirmed
        first = api.crew_check_out(
            assignment_id=assignments[0].name, token=_crew_token(emps[0].name)
        )
        assert first["status"] == "success"
        assert frappe.db.get_value("Event Booking", booking.name, "status") == "confirmed"

        # Second checkout — booking completes
        second = api.crew_check_out(
            assignment_id=assignments[1].name, token=_crew_token(emps[1].name)
        )
        assert second["status"] == "success"
        assert frappe.db.get_value("Event Booking", booking.name, "status") == "completed"
        for ca in assignments:
            assert frappe.db.get_value("Crew Assignment", ca.name, "status") == "completed"

    @_rl
    def test_decline_blocks_check_in(self):
        customer = _ensure_customer()
        today = frappe.utils.getdate() + timedelta(days=2)
        emp = frappe.get_doc({
            "doctype": "Employee",
            "employee_name": "Integration Decliner",
            "employee": f"EMP-INT-{frappe.utils.random_string(5)}",
            "status": "Active",
        }).insert()
        booking = frappe.get_doc({
            "doctype": "Event Booking",
            "event_name": f"Integration Decline {frappe.utils.random_string(4)}",
            "event_date": today,
            "start_time": datetime.combine(today, datetime.strptime("18:00", "%H:%M").time()),
            "end_time": datetime.combine(today, datetime.strptime("22:00", "%H:%M").time()),
            "status": "confirmed",
            "customer": customer,
        }).insert()
        ca = frappe.get_doc({
            "doctype": "Crew Assignment",
            "booking": booking.name,
            "crew_member": emp.name,
            "role": "DJ",
            "status": "offered",
        }).insert()

        tok = _crew_token(emp.name)
        declined = api.crew_shift_decline(
            assignment_id=ca.name, reason="Schedule conflict", token=tok
        )
        assert declined["status"] == "success"
        assert frappe.db.get_value("Crew Assignment", ca.name, "status") == "declined"

        checkin = api.crew_check_in(
            assignment_id=ca.name, latitude=1.0, longitude=2.0, token=tok
        )
        assert checkin["status"] == "error"

    @_rl
    def test_run_sheet_readable_after_accept(self):
        customer = _ensure_customer()
        today = frappe.utils.getdate() + timedelta(days=3)
        emp = frappe.get_doc({
            "doctype": "Employee",
            "employee_name": "Integration RunSheet",
            "employee": f"EMP-INT-{frappe.utils.random_string(5)}",
            "status": "Active",
        }).insert()
        booking = frappe.get_doc({
            "doctype": "Event Booking",
            "event_name": f"Integration RS {frappe.utils.random_string(4)}",
            "event_date": today,
            "start_time": datetime.combine(today, datetime.strptime("19:00", "%H:%M").time()),
            "end_time": datetime.combine(today, datetime.strptime("23:00", "%H:%M").time()),
            "status": "confirmed",
            "customer": customer,
        }).insert()
        ca = frappe.get_doc({
            "doctype": "Crew Assignment",
            "booking": booking.name,
            "crew_member": emp.name,
            "role": "Host",
            "status": "offered",
        }).insert()

        tok = _crew_token(emp.name)
        assert api.crew_shift_accept(assignment_id=ca.name, token=tok)["status"] == "success"

        sheet = api.crew_run_sheet(booking_id=booking.name, token=tok)
        assert sheet["status"] == "success"
        assert sheet["data"]["booking_id"] == booking.name
        assert sheet["data"]["crew_count"] >= 1
