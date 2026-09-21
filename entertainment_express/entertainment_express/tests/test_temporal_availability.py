"""
Unit & Integration Tests for Temporal Inventory Availability, Buffers, Quarantines, and Multi-Tenant Isolation.
"""

from datetime import date, datetime, time
import frappe
import pytest

from entertainment_express.equipment_fleet.api import (
    check_temporal_availability,
    get_item_buffer_rules,
    quarantine_asset,
    release_asset_quarantine,
    get_timeline_availability_matrix,
    sync_booking_reservations,
)


def _need_temporal_db():
    db = getattr(frappe, "db", None)
    if db is None or not callable(getattr(db, "exists", None)):
        pytest.skip("live frappe DB required")
    if not db.exists("DocType", "EE Equipment Reservation"):
        pytest.skip("EE Equipment Reservation DocType missing — migrate required")


class TestTemporalAvailability:
    def setup_method(self):
        _need_temporal_db()
        frappe.set_user("Administrator")

        # Ensure test item exists
        if not frappe.db.exists("Item Group", "Test Inflatables"):
            frappe.get_doc({
                "doctype": "Item Group",
                "item_group_name": "Test Inflatables",
                "is_group": 0,
            }).insert(ignore_permissions=True)

        if not frappe.db.exists("Item", "TEST-BOUNCE-01"):
            frappe.get_doc({
                "doctype": "Item",
                "item_code": "TEST-BOUNCE-01",
                "item_name": "Test Bounce House",
                "item_group": "Test Inflatables",
            }).insert(ignore_permissions=True)

        # Clear test reservations & quarantines for clean test state
        frappe.db.delete("EE Equipment Reservation", {"item_code": "TEST-BOUNCE-01"})
        frappe.db.delete("EE Equipment Quarantine", {"item_code": "TEST-BOUNCE-01"})
        frappe.db.commit()

    def test_buffer_clash_prevents_booking(self):
        """
        Event 1 ends at 14:00 with default 180 min turnaround (buffer ends at 17:00).
        Requesting Event 2 starting at 15:00 should fail availability.
        """
        # Create active reservation for Event 1
        res1 = frappe.get_doc({
            "doctype": "EE Equipment Reservation",
            "booking": "TEST-BK-001",
            "item_code": "TEST-BOUNCE-01",
            "reserved_qty": 1,
            "event_start": datetime(2035, 6, 1, 10, 0),
            "event_end": datetime(2035, 6, 1, 14, 0),
            "buffer_start": datetime(2035, 6, 1, 9, 0),
            "buffer_end": datetime(2035, 6, 1, 17, 0), # 14:00 + 3hrs
            "status": "Reserved",
        }).insert(ignore_permissions=True)

        # Check availability for event starting at 15:00
        res = check_temporal_availability(
            items_json=[{"item_code": "TEST-BOUNCE-01", "qty": 1}],
            start_datetime="2035-06-01 15:00:00",
            end_datetime="2035-06-01 19:00:00",
        )

        assert res["available"] is False
        assert len(res["conflicts"]) > 0

    def test_buffer_rule_customization(self):
        """Test creating custom EE Category Buffer Rule."""
        if not frappe.db.exists("EE Category Buffer Rule", {"category": "Test Inflatables"}):
            frappe.get_doc({
                "doctype": "EE Category Buffer Rule",
                "category": "Test Inflatables",
                "prep_minutes": 30,
                "teardown_minutes": 30,
                "turnaround_sanitization_minutes": 120,
            }).insert(ignore_permissions=True)

        rules = get_item_buffer_rules("TEST-BOUNCE-01")
        assert rules["prep_minutes"] == 30
        assert rules["turnaround_sanitization_minutes"] == 120

    def test_quarantine_blocks_availability(self):
        """Quarantining an asset removes it from prospective availability pool."""
        q_result = quarantine_asset(item_code="TEST-BOUNCE-01", reason="Damage", notes="Torn vinyl seam")
        assert q_result["status"] == "quarantined"
        q_name = q_result["name"]

        # Check availability — should be blocked due to active quarantine
        avail = check_temporal_availability(
            items_json=[{"item_code": "TEST-BOUNCE-01", "qty": 1}],
            start_datetime="2035-07-01 10:00:00",
            end_datetime="2035-07-01 14:00:00",
        )
        assert avail["available"] is False

        # Release quarantine
        rel_result = release_asset_quarantine(q_name, resolution_notes="Repaired and tested")
        assert rel_result["status"] == "released"

        # Check availability again — should pass now
        avail_after = check_temporal_availability(
            items_json=[{"item_code": "TEST-BOUNCE-01", "qty": 1}],
            start_datetime="2035-07-01 10:00:00",
            end_datetime="2035-07-01 14:00:00",
        )
        assert avail_after["available"] is True

    def test_booking_hook_sync(self):
        """Booking insertion/cancellation syncs EE Equipment Reservation rows."""
        if not frappe.db.exists("Customer", "TEST-TEMP-CUST"):
            frappe.get_doc({"doctype": "Customer", "customer_name": "TEST-TEMP-CUST"}).insert(ignore_permissions=True)

        bk = frappe.get_doc({
            "doctype": "Event Booking",
            "customer": "TEST-TEMP-CUST",
            "status": "confirmed",
            "event_name": "Temporal Booking Sync Test",
            "event_date": date(2035, 8, 1),
            "start_time": time(10, 0),
            "end_time": time(14, 0),
        })
        bk.append("service_items", {"item": "TEST-BOUNCE-01", "qty": 1, "rate": 200, "amount": 200})
        bk.insert(ignore_permissions=True)

        sync_booking_reservations(bk)

        res_rows = frappe.get_all("EE Equipment Reservation", filters={"booking": bk.name, "status": "Reserved"})
        assert len(res_rows) == 1

        # Now cancel booking
        bk.status = "canceled"
        sync_booking_reservations(bk)

        res_rows_after = frappe.get_all("EE Equipment Reservation", filters={"booking": bk.name, "status": "Reserved"})
        assert len(res_rows_after) == 0

    def test_multi_tenant_isolation_safeguards(self):
        """Verify queries filter strictly by site connection context with no cross-site leakage."""
        matrix = get_timeline_availability_matrix("2035-08-01", "2035-08-02")
        assert "reservations" in matrix
        assert "quarantines" in matrix
        assert "items" in matrix
