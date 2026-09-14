"""Unit tests for Production BOMs, Van-as-a-Warehouse Rolling Inventory,
Scan-to-Truck Loadout, Return Reconciliation, and Sub-Rental Procurement.
"""

import sys
from types import ModuleType, SimpleNamespace
from datetime import date, datetime, timedelta
import pytest

# Ensure a mock 'frappe' module is available if running outside Frappe bench
if "frappe" in sys.modules:
    mock_frappe = sys.modules["frappe"]
else:
    mock_frappe = ModuleType("frappe")
    sys.modules["frappe"] = mock_frappe

if not hasattr(mock_frappe, "PermissionError"):
    mock_frappe.PermissionError = type("PermissionError", (Exception,), {})
if not hasattr(mock_frappe, "DoesNotExistError"):
    mock_frappe.DoesNotExistError = type("DoesNotExistError", (Exception,), {})
if not hasattr(mock_frappe, "ValidationError"):
    mock_frappe.ValidationError = type("ValidationError", (ValueError,), {})

mock_frappe.get_roles = lambda *a, **k: ["EE Tenant Admin", "EE Dispatcher", "EE Crew"]
mock_frappe.throw = lambda msg, exc=None: (_ for _ in ()).throw(exc(msg) if exc else Exception(msg))
mock_frappe.whitelist = lambda *a, **k: (lambda fn: fn)
mock_frappe.log_error = lambda *a, **k: None
mock_frappe.sendmail = lambda *a, **k: None
mock_frappe.get_doc = lambda *a, **k: None
mock_frappe.get_all = lambda *a, **k: []

mock_utils = ModuleType("frappe.utils")
mock_utils.cint = lambda v: int(v or 0)
mock_utils.flt = lambda v, p=2: round(float(v or 0), p) if p else float(v or 0)
mock_utils.nowdate = lambda: str(date.today())
mock_utils.today = lambda: str(date.today())
mock_utils.getdate = lambda d=None: (
    d if isinstance(d, date)
    else datetime.strptime(str(d)[:10], "%Y-%m-%d").date() if d
    else date.today()
)
mock_utils.add_days = lambda d, n: str(mock_utils.getdate(d) + timedelta(days=n))
mock_utils.now_datetime = lambda: "2026-09-14 12:00:00"

mock_doc_module = ModuleType("frappe.model.document")

class Document:
    def __init__(self, *args, **kwargs):
        self.name = kwargs.get("name", "DOC-001")
        for k, v in kwargs.items():
            setattr(self, k, v)

    def is_new(self):
        return False

    def save(self, *a, **k):
        return self

    def insert(self, *a, **k):
        return self

    def append(self, fieldname, value):
        if not hasattr(self, fieldname):
            setattr(self, fieldname, [])
        val = getattr(self, fieldname)
        if isinstance(value, dict):
            obj = SimpleNamespace(**value)
            val.append(obj)
        else:
            val.append(value)
        return value

mock_doc_module.Document = Document

mock_frappe.utils = mock_utils
mock_frappe.model = ModuleType("frappe.model")
mock_frappe.model.document = mock_doc_module
mock_frappe.defaults = SimpleNamespace(get_user_default=lambda *_: "Test Sound Co")
if not hasattr(mock_frappe, "db") or not mock_frappe.db:
    mock_frappe.db = SimpleNamespace()

mock_frappe.db.get_default = lambda *_: "USD"
mock_frappe.db.exists = lambda *a, **k: False
mock_frappe.db.table_exists = lambda *_: True
mock_frappe.db.get_value = lambda *a, **k: None
mock_frappe.db.get_single_value = lambda *a, **k: None
mock_frappe.db.get_all = lambda *a, **k: []
mock_frappe.db.set_value = lambda *a, **k: None
mock_frappe.db.count = lambda *a, **k: 0
mock_frappe.db.commit = lambda: None
mock_frappe.db.sql = lambda *a, **k: []
mock_frappe.get_meta = lambda dt: SimpleNamespace(has_field=lambda f: True)
mock_frappe.session = SimpleNamespace(user="Administrator")

sys.modules["frappe"] = mock_frappe
sys.modules["frappe.utils"] = mock_utils
sys.modules["frappe.model"] = mock_frappe.model
sys.modules["frappe.model.document"] = mock_doc_module

import frappe
from entertainment_express.logistics.bom_expander import (
    expand_booking_bom,
    expand_production_bom,
    get_production_bom_for_item,
)
from entertainment_express.logistics.van_transfer import (
    create_loadout_session,
    scan_item_to_session,
    commit_loadout_transfer,
    commit_return_checkin,
    validate_scanned_barcode,
    get_van_manifest,
)
from entertainment_express.logistics.sub_rentals import (
    create_sub_rental_po,
    check_sub_rental_deadlines,
)
from entertainment_express.equipment_fleet.doctype.vehicle.vehicle import Vehicle


def test_production_bom_expansion(monkeypatch):
    """Test recursive production BOM expansion with nested sub-assemblies and consumables."""
    db_store = {
        "Production BOM": {
            "BOM-STAGE-RIG": SimpleNamespace(
                name="BOM-STAGE-RIG",
                parent_item="PKG-CONCERT-STAGE",
                is_active=1,
                items=[
                    SimpleNamespace(
                        item_code="KIT-AMP-RACK",
                        item_name="Touring Amp Rack",
                        qty=1.0,
                        is_sub_assembly=1,
                        is_consumable=0,
                        notes="Stage left rack",
                    ),
                    SimpleNamespace(
                        item_code="SPK-SUB-18",
                        item_name="18-inch Subwoofer",
                        qty=4.0,
                        is_sub_assembly=0,
                        is_consumable=0,
                        notes="Front array",
                    ),
                    SimpleNamespace(
                        item_code="GAFF-TAPE",
                        item_name="Pro Gaff Tape Black",
                        qty=2.0,
                        is_sub_assembly=0,
                        is_consumable=1,
                        notes="Consumable roll",
                    ),
                ],
            ),
            "BOM-AMP-RACK": SimpleNamespace(
                name="BOM-AMP-RACK",
                parent_item="KIT-AMP-RACK",
                is_active=1,
                items=[
                    SimpleNamespace(
                        item_code="AMP-CROWN-XLS",
                        item_name="Crown XLS 2502",
                        qty=2.0,
                        is_sub_assembly=0,
                        is_consumable=0,
                        notes="Drive subs",
                    ),
                    SimpleNamespace(
                        item_code="PWR-DISTRO-30A",
                        item_name="30A Power Distro Rack",
                        qty=1.0,
                        is_sub_assembly=0,
                        is_consumable=0,
                        notes="L14-30 input",
                    ),
                ],
            ),
        }
    }

    monkeypatch.setattr(
        frappe.db,
        "get_value",
        lambda dt, filters, fieldname=None, as_dict=False: (
            "BOM-STAGE-RIG" if filters.get("parent_item") == "PKG-CONCERT-STAGE"
            else "BOM-AMP-RACK" if filters.get("parent_item") == "KIT-AMP-RACK"
            else None
        ) if dt == "Production BOM" else None,
    )
    monkeypatch.setattr(
        frappe.db,
        "exists",
        lambda dt, name: name in db_store.get(dt, {}),
    )
    monkeypatch.setattr(
        frappe,
        "get_doc",
        lambda dt, name=None: db_store.get(dt, {}).get(name),
    )

    expanded = expand_production_bom("PKG-CONCERT-STAGE")
    assert len(expanded) >= 4

    # Verify parent and nested items
    item_codes = [e["item_code"] for e in expanded]
    assert "KIT-AMP-RACK" in item_codes
    assert "SPK-SUB-18" in item_codes
    assert "GAFF-TAPE" in item_codes
    assert "AMP-CROWN-XLS" in item_codes
    assert "PWR-DISTRO-30A" in item_codes

    # Verify consumable detection
    gaff = next(e for e in expanded if e["item_code"] == "GAFF-TAPE")
    assert gaff["is_consumable"] is True
    assert gaff["qty"] == 2.0

    # Verify sub-assembly detection
    amp_rack = next(e for e in expanded if e["item_code"] == "KIT-AMP-RACK")
    assert amp_rack["is_sub_assembly"] is True


def test_vehicle_van_warehouse_provisioning(monkeypatch):
    """Test auto-provisioning of child warehouse for vehicle."""
    created_warehouses = []

    class MockWarehouse(frappe.model.document.Document):
        def insert(self, *a, **k):
            created_warehouses.append(self.name)
            return self

    monkeypatch.setattr(
        frappe,
        "get_doc",
        lambda d: MockWarehouse(**d) if isinstance(d, dict) and d.get("doctype") == "Warehouse" else None,
    )
    monkeypatch.setattr(frappe.db, "exists", lambda dt, name: False)
    monkeypatch.setattr(frappe.db, "get_value", lambda dt, name, field: "TSC")

    veh = Vehicle(doctype="Vehicle", vehicle_name="Van Alpha", company="Test Sound Co", linked_warehouse=None)
    veh.validate()

    assert veh.linked_warehouse == "Van Alpha - TSC"
    assert "Van Alpha - TSC" in created_warehouses


def test_scan_to_truck_and_loadout_commit(monkeypatch):
    """Test barcode scan-to-truck staging and atomic Stock Entry transfer generation."""
    stock_entries = []
    asset_locations = {}

    assets_db = {
        "ASSET-001": SimpleNamespace(
            name="ASSET-001",
            asset_name="JBL SRX828SP Subwoofer #1",
            item_code="SPK-SUB-18",
            barcode="BC-SRX-001",
            status="available",
            current_location="Main Warehouse",
        ),
        "ASSET-002": SimpleNamespace(
            name="ASSET-002",
            asset_name="Crown XLS 2502 Amp #1",
            item_code="AMP-CROWN-XLS",
            barcode="BC-AMP-002",
            status="available",
            current_location="Main Warehouse",
        ),
    }

    class MockStockEntry(frappe.model.document.Document):
        def insert(self, *a, **k):
            stock_entries.append(self)
            return self

        def submit(self):
            self.docstatus = 1
            return self

    sessions = {}

    def mock_get_doc(dt, name=None):
        if isinstance(dt, dict):
            doctype = dt.get("doctype")
            if doctype == "Vehicle Loadout Session":
                s = frappe.model.document.Document(**dt)
                s.name = f"VLS-{len(sessions)+1}"
                sessions[s.name] = s
                return s
            if doctype == "Stock Entry":
                se = MockStockEntry(**dt)
                se.name = f"STE-TRF-{len(stock_entries)+1}"
                return se
            return frappe.model.document.Document(**dt)
        if dt == "Vehicle Loadout Session":
            return sessions.get(name)
        if dt == "Vehicle":
            return SimpleNamespace(
                name="VEH-01",
                vehicle_name="Van 01",
                linked_warehouse="Van 01 - TSC",
                ensure_van_warehouse=lambda: None,
            )
        if dt == "Service Asset":
            return assets_db.get(name)
        if dt == "Stock Entry" and isinstance(name, dict):
            se = MockStockEntry(**name)
            se.name = f"STE-TRF-{len(stock_entries)+1}"
            return se
        if dt == "Event Booking":
            return SimpleNamespace(
                name=name,
                assigned_assets=[
                    SimpleNamespace(asset="ASSET-001", asset_name="JBL Subwoofer", quantity_reserved=1),
                ],
                service_items=[],
                assigned_packages=[],
            )
        return frappe.model.document.Document()

    monkeypatch.setattr(frappe, "get_doc", mock_get_doc)
    monkeypatch.setattr(
        frappe.db,
        "get_value",
        lambda dt, filters, fieldname=None, as_dict=False: (
            assets_db.get("ASSET-001").__dict__ if filters.get("barcode") == "BC-SRX-001"
            else assets_db.get("ASSET-002").__dict__ if filters.get("barcode") == "BC-AMP-002"
            else None
        ) if dt == "Service Asset" else None,
    )
    monkeypatch.setattr(
        frappe.db,
        "exists",
        lambda dt, name: True if dt in ("DocType", "Service Asset") else False,
    )
    monkeypatch.setattr(
        frappe.db,
        "set_value",
        lambda dt, name, vals: asset_locations.update({name: vals}),
    )

    # 1. Create loadout session
    sess = create_loadout_session(booking_name="BK-001", vehicle_name="VEH-01", session_type="loadout")
    session_id = sess["session_id"]
    assert sess["status"] == "draft"
    assert sess["target_warehouse"] == "Van 01 - TSC"

    # 2. Scan asset to session
    scan_res = scan_item_to_session(session_id, "BC-SRX-001")
    assert scan_res["scanned_count"] == 1
    assert scan_res["last_scanned"]["asset"] == "ASSET-001"

    # 3. Commit transfer
    commit_res = commit_loadout_transfer(session_id, allow_incomplete=True)
    assert commit_res["status"] == "committed"
    assert len(stock_entries) == 1
    assert stock_entries[0].stock_entry_type == "Material Transfer"
    assert stock_entries[0].to_warehouse == "Van 01 - TSC"

    # Verify asset location updated to van warehouse
    assert asset_locations["ASSET-001"]["current_location"] == "Van 01 - TSC"
    assert asset_locations["ASSET-001"]["status"] == "in_transit"


def test_post_event_return_checkin_reconciliation(monkeypatch):
    """Test post-event vehicle check-in and automated detection of Missing in Transit equipment."""
    asset_status_updates = {}

    outbound_session = SimpleNamespace(
        name="VLS-OUT-01",
        vehicle="VEH-01",
        booking="BK-001",
        session_type="loadout",
        status="committed",
        scanned_items=[
            SimpleNamespace(asset="ASSET-001", asset_name="JBL Subwoofer", status="loaded"),
            SimpleNamespace(asset="ASSET-002", asset_name="Crown Amp", status="loaded"),
        ],
    )

    return_session = frappe.model.document.Document(
        name="VLS-RET-01",
        vehicle="VEH-01",
        booking="BK-001",
        session_type="return_checkin",
        status="draft",
        source_warehouse="Van 01 - TSC",
        target_warehouse="Stores - TSC",
        scanned_items=[
            # Only ASSET-001 was scanned back in! ASSET-002 is left in the truck or lost
            SimpleNamespace(asset="ASSET-001", asset_name="JBL Subwoofer", status="returned"),
        ],
    )

    def mock_get_doc(dt, name=None):
        if dt == "Vehicle Loadout Session":
            if name == "VLS-OUT-01":
                return outbound_session
            if name == "VLS-RET-01":
                return return_session
        if dt == "Stock Entry" and isinstance(name, dict):
            se = SimpleNamespace(**name)
            se.name = "STE-RET-001"
            se.insert = lambda *a, **k: se
            se.submit = lambda *a, **k: se
            return se
        return frappe.model.document.Document()

    monkeypatch.setattr(frappe, "get_doc", mock_get_doc)
    monkeypatch.setattr(
        frappe,
        "get_all",
        lambda dt, filters=None, **k: (
            [SimpleNamespace(name="VLS-OUT-01")] if dt == "Vehicle Loadout Session" and filters.get("session_type") == "loadout"
            else []
        ),
    )
    monkeypatch.setattr(
        frappe.db,
        "exists",
        lambda dt, name: True if dt in ("DocType", "Service Asset") else False,
    )
    monkeypatch.setattr(
        frappe.db,
        "set_value",
        lambda dt, name, vals: asset_status_updates.update({name: vals}),
    )

    result = commit_return_checkin("VLS-RET-01")
    assert result["returned_count"] == 1
    assert result["missing_count"] == 1
    assert result["missing_items"][0]["asset"] == "ASSET-002"

    # Verify that unreturned gear was automatically flagged as 'Missing in Transit'
    assert asset_status_updates["ASSET-002"]["status"] == "Missing in Transit"
    # Scanned returned gear reset to available
    assert asset_status_updates["ASSET-001"]["status"] == "available"


def test_sub_rental_procurement_and_deadline_alerts(monkeypatch):
    """Test Sub Rental Order drafting, customer markup pricing, and 24-hour return alert cron."""
    orders_db = {}
    purchase_orders = []
    sent_emails = []

    class MockSubRentalOrder(frappe.model.document.Document):
        def insert(self, *a, **k):
            self.name = f"SRO-{len(orders_db)+1}"
            orders_db[self.name] = self
            return self

    class MockPO(frappe.model.document.Document):
        def insert(self, *a, **k):
            self.name = f"PO-{len(purchase_orders)+1}"
            purchase_orders.append(self)
            return self

    monkeypatch.setattr(
        frappe,
        "get_doc",
        lambda d: MockSubRentalOrder(**d) if isinstance(d, dict) and d.get("doctype") == "Sub Rental Order"
        else MockPO(**d) if isinstance(d, dict) and d.get("doctype") == "Purchase Order"
        else None,
    )
    monkeypatch.setattr(frappe.db, "exists", lambda dt, name=None: dt in ("DocType", "Purchase Order"))
    monkeypatch.setattr(frappe, "sendmail", lambda recipients, subject, message: sent_emails.append(subject))

    # 1. Create sub-rental order with 35% client markup
    items = [
        {"item_code": "RENT-GENSET", "item_name": "50kVA Generator", "qty": 1, "daily_rate": 400.0, "days": 2},
        {"item_code": "RENT-CABLE", "item_name": "Camlock Feeders", "qty": 4, "daily_rate": 25.0, "days": 2},
    ]
    # Total cost = (1 * 400 * 2) + (4 * 25 * 2) = 800 + 200 = $1,000.00
    # Customer markup 35% -> $1,350.00
    sro_res = create_sub_rental_po(
        booking_id="BK-FEST-2026",
        vendor_id="SUNBELT-RENTALS",
        items=items,
        delivery_date="2026-09-15",
        return_date="2026-09-17",
        markup_percent=35.0,
    )

    assert sro_res["total_cost"] == 1000.0
    assert sro_res["customer_price"] == 1350.0
    assert len(purchase_orders) == 1
    assert purchase_orders[0].supplier == "SUNBELT-RENTALS"

    # 2. Test scheduled return deadline check (simulate order due tomorrow)
    tomorrow = str(date.today() + timedelta(days=1))
    urgent_order = SimpleNamespace(
        name="SRO-URGENT",
        booking="BK-FEST-2026",
        vendor="SUNBELT-RENTALS",
        return_deadline=tomorrow,
        status="Delivered",
    )

    monkeypatch.setattr(
        frappe,
        "get_all",
        lambda dt, filters=None, **k: [urgent_order] if dt == "Sub Rental Order" else [],
    )

    alerts = check_sub_rental_deadlines()
    assert len(alerts) == 1
    assert alerts[0]["order"] == "SRO-URGENT"
    assert "within 24 hours" in alerts[0]["alert"]
    assert len(sent_emails) == 1
