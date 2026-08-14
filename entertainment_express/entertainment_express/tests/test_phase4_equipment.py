"""Phase 4 — equipment, fleet, packing, stock."""

from datetime import date, datetime, time

import frappe
import pytest

from entertainment_express.booking.availability import check
from entertainment_express.api.fleet_ops import (
    assign_vehicle,
    checkout,
    generate_packing_list,
    packing_status,
    transfer_stock,
    create_sub_rental,
)


class TestAssetOutOfService:
    def setup_method(self):
        if not frappe.db.exists("Service Asset", {"asset_name": "OOS Bounce"}):
            self.asset = frappe.get_doc({
                "doctype": "Service Asset",
                "asset_name": "OOS Bounce",
                "asset_type": "inflatable",
                "status": "out_of_service",
                "quantity": 1,
            }).insert(ignore_permissions=True)
        else:
            self.asset = frappe.get_doc("Service Asset", {"asset_name": "OOS Bounce"})
            self.asset.status = "out_of_service"
            self.asset.save()

    def test_oos_not_bookable(self):
        result = check(self.asset.name, datetime(2035, 1, 1, 10, 0), datetime(2035, 1, 1, 14, 0))
        assert result["available"] is False


class TestVehicleConflict:
    def setup_method(self):
        if not frappe.db.exists("Customer", "TEST-FLEET-CUST"):
            frappe.get_doc({"doctype": "Customer", "customer_name": "TEST-FLEET-CUST"}).insert(ignore_permissions=True)
        if not frappe.db.exists("DocType", "Vehicle"):
            pytest.skip("migrate required")

    def test_double_assign_blocked(self):
        frappe.set_user("Administrator")
        veh = frappe.get_doc({
            "doctype": "Vehicle",
            "vehicle_name": "Box 12",
            "status": "active",
            "plate": "TEST-12",
        }).insert(ignore_permissions=True)
        bk1 = frappe.get_doc({
            "doctype": "Event Booking",
            "customer": "TEST-FLEET-CUST",
            "status": "confirmed",
            "event_name": "A",
            "event_date": date(2035, 2, 1),
            "start_time": time(10, 0),
            "end_time": time(14, 0),
        }).insert(ignore_permissions=True)
        bk2 = frappe.get_doc({
            "doctype": "Event Booking",
            "customer": "TEST-FLEET-CUST",
            "status": "confirmed",
            "event_name": "B",
            "event_date": date(2035, 2, 1),
            "start_time": time(12, 0),
            "end_time": time(16, 0),
        }).insert(ignore_permissions=True)
        assign_vehicle(bk1.name, veh.name)
        with pytest.raises(Exception):
            assign_vehicle(bk2.name, veh.name)


class TestScanAndPacking:
    def setup_method(self):
        if not frappe.db.exists("Customer", "TEST-FLEET-CUST"):
            frappe.get_doc({"doctype": "Customer", "customer_name": "TEST-FLEET-CUST"}).insert(ignore_permissions=True)
        if not frappe.db.exists("DocType", "Packing List"):
            pytest.skip("migrate required")

    def test_checkout_and_missing_pack_flag(self):
        frappe.set_user("Administrator")
        asset = frappe.get_doc({
            "doctype": "Service Asset",
            "asset_name": "Scan Booth",
            "asset_type": "booth",
            "status": "available",
            "quantity": 1,
            "barcode": "SCANBOOTH1",
        }).insert(ignore_permissions=True)
        bk = frappe.get_doc({
            "doctype": "Event Booking",
            "customer": "TEST-FLEET-CUST",
            "status": "confirmed",
            "event_name": "Scan Event",
            "event_date": date(2035, 3, 1),
            "start_time": time(10, 0),
            "end_time": time(14, 0),
        }).insert(ignore_permissions=True)
        bk.append("assigned_assets", {"asset": asset.name, "quantity_reserved": 1})
        bk.save()
        checkout(bk.name, code="SCANBOOTH1")
        generate_packing_list(bk.name)
        status = packing_status(bk.name)
        assert status["missing"]
        assert status["status"] in ("ready", "missing_items")


class TestStockAndSubrental:
    def test_transfer_and_subrental(self):
        if not frappe.db.exists("DocType", "EE Location"):
            pytest.skip("migrate required")
        frappe.set_user("Administrator")
        a = frappe.get_doc({"doctype": "EE Location", "location_name": "Warehouse A", "location_type": "warehouse"}).insert(ignore_permissions=True)
        b = frappe.get_doc({"doctype": "EE Location", "location_name": "Warehouse B", "location_type": "warehouse"}).insert(ignore_permissions=True)
        frappe.get_doc({
            "doctype": "Stock Balance",
            "location": a.name,
            "item_code": "GLOW-STICK",
            "item_name": "Glow sticks",
            "qty": 10,
            "reorder_level": 2,
        }).insert(ignore_permissions=True)
        result = transfer_stock(a.name, b.name, "GLOW-STICK", 4)
        assert result["from_qty"] == 6
        assert result["to_qty"] == 4
        if not frappe.db.exists("Customer", "TEST-FLEET-CUST"):
            frappe.get_doc({"doctype": "Customer", "customer_name": "TEST-FLEET-CUST"}).insert(ignore_permissions=True)
        bk = frappe.get_doc({
            "doctype": "Event Booking",
            "customer": "TEST-FLEET-CUST",
            "status": "confirmed",
            "event_name": "Shortage",
            "event_date": date(2035, 4, 1),
            "start_time": time(10, 0),
            "end_time": time(12, 0),
        }).insert(ignore_permissions=True)
        sub = create_sub_rental(bk.name, "Extra booth", 1, "Partner Co", 150)
        assert sub["sub_rental"]
