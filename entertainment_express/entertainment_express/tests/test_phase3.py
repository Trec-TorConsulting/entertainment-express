"""
Phase 3 (HR & Workforce) Tests.
"""

import frappe
import pytest
from frappe.test_runner import make_test_objects
from datetime import datetime, timedelta


class TestWorkerAvailability:
    """Test worker availability checks."""

    def test_worker_not_available_outside_hours(self):
        """Assigning crew outside their availability hours should fail."""
        # Create a 1099 employee
        emp = frappe.get_doc({
            "doctype": "Employee",
            "employee_name": "Test Crew 1",
            "employee": "EMP-TEST-001",
            "status": "Active",
            "ee_employment_type": "1099",
        }).insert()

        # Create availability: only 10 AM - 6 PM Monday–Friday
        wa = frappe.get_doc({
            "doctype": "Worker Availability",
            "employee": emp.name,
            "monday_start_time": "10:00:00",
            "monday_end_time": "18:00:00",
            "tuesday_start_time": "10:00:00",
            "tuesday_end_time": "18:00:00",
            "wednesday_start_time": "10:00:00",
            "wednesday_end_time": "18:00:00",
            "thursday_start_time": "10:00:00",
            "thursday_end_time": "18:00:00",
            "friday_start_time": "10:00:00",
            "friday_end_time": "18:00:00",
        }).insert()

        # Create a booking for 8 AM (outside availability)
        booking_date = datetime.now().date()
        if booking_date.weekday() == 6:  # Skip Sunday
            booking_date += timedelta(days=1)

        booking = frappe.get_doc({
            "doctype": "Event Booking",
            "event_name": "Test Event",
            "event_date": booking_date,
            "start_time": datetime.combine(booking_date, datetime.strptime("08:00", "%H:%M").time()),
            "end_time": datetime.combine(booking_date, datetime.strptime("09:00", "%H:%M").time()),
            "status": "draft",
            "customer": "CUS-TEST",
        }).insert()

        from entertainment_express.api.hr_workforce import check_worker_availability

        result = check_worker_availability(
            emp.name,
            str(booking.start_time),
            str(booking.end_time),
        )
        assert result["available"] is False
        assert "outside" in result["reason"].lower()

    def test_worker_available_within_hours(self):
        """Assigning crew within their availability hours should succeed."""
        emp = frappe.get_doc({
            "doctype": "Employee",
            "employee_name": "Test Crew 2",
            "employee": f"EMP-TEST-{frappe.utils.random_string(4)}",
            "status": "Active",
            "ee_employment_type": "1099",
        }).insert()

        wa = frappe.get_doc({
            "doctype": "Worker Availability",
            "employee": emp.name,
            "monday_start_time": "10:00:00",
            "monday_end_time": "18:00:00",
            "tuesday_start_time": "10:00:00",
            "tuesday_end_time": "18:00:00",
            "wednesday_start_time": "10:00:00",
            "wednesday_end_time": "18:00:00",
            "thursday_start_time": "10:00:00",
            "thursday_end_time": "18:00:00",
            "friday_start_time": "10:00:00",
            "friday_end_time": "18:00:00",
        }).insert()

        booking_date = datetime.now().date()
        if booking_date.weekday() == 6:
            booking_date += timedelta(days=1)

        booking = frappe.get_doc({
            "doctype": "Event Booking",
            "event_name": "Test Event",
            "event_date": booking_date,
            "start_time": datetime.combine(booking_date, datetime.strptime("14:00", "%H:%M").time()),
            "end_time": datetime.combine(booking_date, datetime.strptime("16:00", "%H:%M").time()),
            "status": "draft",
            "customer": "CUS-TEST",
        }).insert()

        from entertainment_express.api.hr_workforce import check_worker_availability

        result = check_worker_availability(
            emp.name,
            str(booking.start_time),
            str(booking.end_time),
        )
        assert result["available"] is True

    def test_time_off_blocks_assignment(self):
        """Employee with time-off flag cannot be assigned."""
        emp = frappe.get_doc({
            "doctype": "Employee",
            "employee_name": "Test Crew 3",
            "employee": f"EMP-TEST-{frappe.utils.random_string(4)}",
            "status": "Active",
            "ee_employment_type": "1099",
        }).insert()

        wa = frappe.get_doc({
            "doctype": "Worker Availability",
            "employee": emp.name,
            "monday_start_time": "10:00:00",
            "monday_end_time": "18:00:00",
            "tuesday_start_time": "10:00:00",
            "tuesday_end_time": "18:00:00",
            "wednesday_start_time": "10:00:00",
            "wednesday_end_time": "18:00:00",
            "thursday_start_time": "10:00:00",
            "thursday_end_time": "18:00:00",
            "friday_start_time": "10:00:00",
            "friday_end_time": "18:00:00",
        }).insert()

        booking_date = datetime.now().date()
        if booking_date.weekday() == 6:
            booking_date += timedelta(days=1)

        # Create time-off entry
        time_off = frappe.get_doc({
            "doctype": "Event Booking",
            "event_name": "Time Off",
            "event_date": booking_date,
            "start_time": datetime.combine(booking_date, datetime.strptime("10:00", "%H:%M").time()),
            "end_time": datetime.combine(booking_date, datetime.strptime("18:00", "%H:%M").time()),
            "status": "time_off",
            "customer": emp.name,
        }).insert()

        booking = frappe.get_doc({
            "doctype": "Event Booking",
            "event_name": "Test Event",
            "event_date": booking_date,
            "start_time": datetime.combine(booking_date, datetime.strptime("14:00", "%H:%M").time()),
            "end_time": datetime.combine(booking_date, datetime.strptime("16:00", "%H:%M").time()),
            "status": "draft",
            "customer": "CUS-TEST",
        }).insert()

        from entertainment_express.api.hr_workforce import check_worker_availability

        result = check_worker_availability(
            emp.name,
            str(booking.start_time),
            str(booking.end_time),
        )
        assert result["available"] is False
        assert "time-off" in result["reason"].lower()


class TestTimesheets:
    """Test timesheet creation and approval."""

    def test_timesheet_creation(self):
        """Creating a timesheet should succeed."""
        emp = frappe.get_doc({
            "doctype": "Employee",
            "employee_name": "Test Crew 4",
            "employee": f"EMP-TEST-{frappe.utils.random_string(4)}",
            "status": "Active",
        }).insert()

        from entertainment_express.api.hr_workforce import get_or_create_timesheet

        start_date = frappe.utils.getdate()
        result = get_or_create_timesheet(emp.name, str(start_date))
        assert result["created"] is True

        ts = frappe.get_doc("Timesheet", result["timesheet"])
        assert ts.employee == emp.name
        assert ts.start_date == start_date


class TestPayRuns:
    """Test pay run generation and finalization."""

    def test_pay_run_creation(self):
        """Creating a pay run should succeed."""
        emp = frappe.get_doc({
            "doctype": "Employee",
            "employee_name": "Test Crew 5",
            "employee": f"EMP-TEST-{frappe.utils.random_string(4)}",
            "status": "Active",
            "ee_default_pay_rate": 100,
        }).insert()

        from entertainment_express.api.hr_workforce import create_pay_run

        period_from = frappe.utils.getdate()
        period_to = frappe.utils.getdate() + timedelta(days=7)
        result = create_pay_run(str(period_from), str(period_to), [emp.name])

        pr = frappe.get_doc("Pay Run", result["pay_run"])
        assert pr.period_from == period_from
        assert pr.status == "draft"

    def test_pay_run_finalization(self):
        """Finalizing a pay run should lock it."""
        emp = frappe.get_doc({
            "doctype": "Employee",
            "employee_name": "Test Crew 6",
            "employee": f"EMP-TEST-{frappe.utils.random_string(4)}",
            "status": "Active",
        }).insert()

        from entertainment_express.api.hr_workforce import create_pay_run, finalize_pay_run

        period_from = frappe.utils.getdate()
        period_to = frappe.utils.getdate() + timedelta(days=7)
        pr_result = create_pay_run(str(period_from), str(period_to), [emp.name])
        pr_name = pr_result["pay_run"]

        finalize_result = finalize_pay_run(pr_name)
        assert finalize_result["status"] == "finalized"

        pr = frappe.get_doc("Pay Run", pr_name)
        assert pr.status == "finalized"


class TestCompliance:
    """Test compliance document management."""

    def test_compliance_status(self):
        """Getting compliance status should return required docs."""
        emp = frappe.get_doc({
            "doctype": "Employee",
            "employee_name": "Test Crew 7",
            "employee": f"EMP-TEST-{frappe.utils.random_string(4)}",
            "status": "Active",
            "ee_employment_type": "1099",
        }).insert()

        from entertainment_express.api.hr_workforce import get_compliance_status

        result = get_compliance_status(emp.name)
        assert result["employment_type"] == "1099"
        assert "w9" in result["documents"]
        assert result["documents"]["w9"]["status"] == "missing"
