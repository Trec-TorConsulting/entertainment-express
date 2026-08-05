"""
Unit tests for dispatch realtime helpers (phase-4 task 1.2).

Tests build_day_view, location cache, and subscription metadata without
requiring a live Socket.IO connection.
"""

import frappe
from datetime import datetime, timedelta

from entertainment_express.api.dispatch_realtime import (
    DISPATCH_EVENTS,
    build_day_view,
    get_crew_location,
    store_crew_location,
    subscription_info,
    _is_at_risk,
)


class TestDispatchRealtimeHelpers:
    """Dispatch board realtime utility functions."""

    def test_subscription_info_shape(self):
        info = subscription_info("2026-07-23")
        assert info["subscribed"] is True
        assert info["event_date"] == "2026-07-23"
        assert info["socket_path"] == "/socket.io/"
        assert "crew_location_update" in info["events"]
        assert set(info["events"]) == set(DISPATCH_EVENTS)

    def test_store_and_get_crew_location(self):
        payload = store_crew_location(
            "EE-CA-TEST-001",
            40.7128,
            -74.0060,
            crew_id="EMP-001",
            booking_id="EB-001",
            status="checked_in",
        )
        assert payload["latitude"] == 40.7128
        assert payload["longitude"] == -74.0060
        assert payload["crew_id"] == "EMP-001"

        cached = get_crew_location("EE-CA-TEST-001")
        assert cached is not None
        assert cached["assignment_id"] == "EE-CA-TEST-001"
        assert cached["status"] == "checked_in"

    def test_is_at_risk_within_48h_no_crew(self):
        tomorrow = frappe.utils.getdate() + timedelta(days=1)
        booking = {"status": "confirmed", "event_date": tomorrow}
        assert _is_at_risk(booking, []) is True

    def test_is_at_risk_not_confirmed(self):
        tomorrow = frappe.utils.getdate() + timedelta(days=1)
        booking = {"status": "draft", "event_date": tomorrow}
        assert _is_at_risk(booking, []) is False

    def test_is_at_risk_with_accepted_crew(self):
        tomorrow = frappe.utils.getdate() + timedelta(days=1)
        booking = {"status": "confirmed", "event_date": tomorrow}
        assignments = [{"status": "accepted"}]
        assert _is_at_risk(booking, assignments) is False

    def test_build_day_view_includes_crew_and_summary(self):
        today = frappe.utils.getdate()

        booking = frappe.get_doc({
            "doctype": "Event Booking",
            "event_name": "Realtime Day View Test",
            "event_date": today,
            "start_time": datetime.combine(today, datetime.strptime("18:00", "%H:%M").time()),
            "end_time": datetime.combine(today, datetime.strptime("22:00", "%H:%M").time()),
            "status": "confirmed",
            "customer": _ensure_test_customer(),
        }).insert()

        emp = frappe.get_doc({
            "doctype": "Employee",
            "employee_name": "Realtime Crew",
            "employee": f"EMP-RT-{frappe.utils.random_string(4)}",
            "status": "Active",
        }).insert()

        assignment = frappe.get_doc({
            "doctype": "Crew Assignment",
            "booking": booking.name,
            "crew_member": emp.name,
            "role": "DJ",
            "status": "checked_in",
            "check_in": frappe.utils.now_datetime(),
        }).insert()

        store_crew_location(
            assignment.name,
            34.0522,
            -118.2437,
            crew_id=emp.name,
            booking_id=booking.name,
        )

        payload = build_day_view(str(today))
        assert payload["date"] == str(today)
        assert payload["summary"]["total_bookings"] >= 1

        matched = [b for b in payload["bookings"] if b["name"] == booking.name]
        assert len(matched) == 1
        row = matched[0]
        assert row["crew_count"] >= 1
        assert len(row["crew_assignments"]) >= 1
        assert row["crew_assignments"][0]["location"] is not None
        assert row["crew_assignments"][0]["location"]["latitude"] == 34.0522


def _ensure_test_customer() -> str:
    existing = frappe.db.get_value("Customer", {"customer_name": "Realtime Test Customer"}, "name")
    if existing:
        return existing
    return frappe.get_doc({
        "doctype": "Customer",
        "customer_name": "Realtime Test Customer",
        "customer_type": "Individual",
    }).insert().name
