"""
Phase-2 tests: Crew assignment conflicts, run sheet generation, token verification.
"""

import pytest
import frappe
from frappe.utils import now_datetime, add_to_date
from datetime import date, time, datetime


class TestCrewAssignmentConflicts:

    def setup_method(self):
        """Ensure test fixtures exist."""
        if not frappe.db.exists("EE Crew Role", "DJ"):
            frappe.get_doc({
                "doctype": "EE Crew Role",
                "role_name": "DJ",
                "active": 1,
            }).insert(ignore_permissions=True)

        if not frappe.db.exists("Customer", "TEST-DISPATCH-CUST"):
            frappe.get_doc({
                "doctype": "Customer",
                "customer_name": "TEST-DISPATCH-CUST",
            }).insert(ignore_permissions=True)

        if not frappe.db.exists("Employee", "TEST-CREW-001"):
            frappe.get_doc({
                "doctype": "Employee",
                "first_name": "Test",
                "last_name": "Crew",
                "employee_name": "Test Crew",
                "status": "Active",
                "date_of_joining": "2024-01-01",
                "gender": "Male",
                "company": frappe.db.get_single_value("Global Defaults", "default_company") or "Test Co",
            }).insert(ignore_permissions=True)

        frappe.db.commit()

    def test_double_assignment_blocked(self):
        """
        WHEN the same employee already has an accepted assignment overlapping
        a new booking, the second assignment is blocked.
        """
        from entertainment_express.api.dispatch import assign_crew

        # Create two overlapping bookings
        bk1 = frappe.get_doc({
            "doctype": "Event Booking",
            "customer": "TEST-DISPATCH-CUST",
            "status": "confirmed",
            "event_date": date(2032, 1, 10),
            "start_time": time(10, 0),
            "end_time": time(14, 0),
        })
        bk1.insert(ignore_permissions=True)

        bk2 = frappe.get_doc({
            "doctype": "Event Booking",
            "customer": "TEST-DISPATCH-CUST",
            "status": "confirmed",
            "event_date": date(2032, 1, 10),
            "start_time": time(12, 0),
            "end_time": time(16, 0),
        })
        bk2.insert(ignore_permissions=True)
        frappe.db.commit()

        # Assign and accept for bk1
        frappe.set_user("Administrator")
        result = assign_crew(bk1.name, "TEST-CREW-001", "DJ")
        ca_name = result["assignment"]
        frappe.db.set_value("Crew Assignment", ca_name, "status", "accepted")
        frappe.db.commit()

        # Assigning to bk2 should raise a conflict
        with pytest.raises(Exception):
            assign_crew(bk2.name, "TEST-CREW-001", "DJ")

    def test_non_overlapping_assignments_allowed(self):
        """Assignments on different dates are always allowed."""
        from entertainment_express.api.dispatch import assign_crew
        frappe.set_user("Administrator")

        bk = frappe.get_doc({
            "doctype": "Event Booking",
            "customer": "TEST-DISPATCH-CUST",
            "status": "confirmed",
            "event_date": date(2033, 3, 1),
            "start_time": time(10, 0),
            "end_time": time(14, 0),
        })
        bk.insert(ignore_permissions=True)
        frappe.db.commit()

        result = assign_crew(bk.name, "TEST-CREW-001", "DJ")
        assert result["status"] == "offered"


class TestRunSheetGeneration:

    def test_run_sheet_fields_populated(self):
        """Run sheet pulls venue, client, and equipment from booking."""
        from entertainment_express.api.dispatch import generate_run_sheet

        if not frappe.db.exists("Customer", "TEST-RS-CUST"):
            frappe.get_doc({
                "doctype": "Customer", "customer_name": "TEST-RS-CUST"
            }).insert(ignore_permissions=True)

        bk = frappe.get_doc({
            "doctype": "Event Booking",
            "customer": "TEST-RS-CUST",
            "status": "confirmed",
            "event_date": date(2034, 5, 5),
            "start_time": time(14, 0),
            "end_time": time(18, 0),
            "venue_address": "123 Test Ave, Springfield, IL 62701",
        })
        bk.insert(ignore_permissions=True)
        frappe.db.commit()

        frappe.set_user("Administrator")
        result = generate_run_sheet(bk.name)
        assert result["booking"] == bk.name

        rs = frappe.get_doc("Run Sheet", {"booking": bk.name})
        assert rs.venue_address == "123 Test Ave, Springfield, IL 62701"
        assert rs.client_name == "TEST-RS-CUST"
        assert len(rs.checklist_items) > 0

    def test_run_sheet_default_checklist(self):
        """Default checklist items are created if none exist."""
        from entertainment_express.api.dispatch import _default_checklist

        class FakeBooking:
            pass

        tasks = _default_checklist(FakeBooking())
        assert len(tasks) > 0
        assert all(isinstance(t, str) for t in tasks)


class TestShiftTokenVerification:

    def test_bad_token_rejected(self):
        """accept_shift with a wrong token raises PermissionError."""
        from entertainment_express.api.dispatch import accept_shift

        if not frappe.db.exists("Customer", "TEST-TOKEN-CUST"):
            frappe.get_doc({
                "doctype": "Customer", "customer_name": "TEST-TOKEN-CUST"
            }).insert(ignore_permissions=True)
        if not frappe.db.exists("Employee", "TEST-TOKEN-EMP"):
            frappe.get_doc({
                "doctype": "Employee",
                "first_name": "Token", "last_name": "Test",
                "employee_name": "Token Test",
                "status": "Active",
                "date_of_joining": "2024-01-01",
                "gender": "Male",
                "company": frappe.db.get_single_value("Global Defaults", "default_company") or "Test Co",
            }).insert(ignore_permissions=True)

        bk = frappe.get_doc({
            "doctype": "Event Booking",
            "customer": "TEST-TOKEN-CUST",
            "status": "confirmed",
            "event_date": date(2035, 1, 1),
            "start_time": time(10, 0),
            "end_time": time(14, 0),
        })
        bk.insert(ignore_permissions=True)

        ca = frappe.get_doc({
            "doctype": "Crew Assignment",
            "booking": bk.name,
            "crew_member": "TEST-TOKEN-EMP",
            "role": "DJ",
            "status": "offered",
            "shift_token": "correct_token_abc123",
        })
        ca.insert(ignore_permissions=True)
        frappe.db.commit()

        with pytest.raises((frappe.PermissionError, Exception)):
            accept_shift(assignment=ca.name, token="WRONG_TOKEN")


class TestAtRiskScheduler:

    def test_flag_at_risk_runs_without_error(self):
        """The scheduler function is callable and doesn't raise."""
        from entertainment_express.scheduling_dispatch.scheduler import flag_at_risk_events
        # Should complete without raising (no bookings in the past)
        flag_at_risk_events()
