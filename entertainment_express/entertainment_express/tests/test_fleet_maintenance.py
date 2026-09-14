"""
Unit tests and multi-tenant isolation verification for Equipment Lifecycle,
Safety Compliance, Telemetry, and Quarantine Management.
"""

import sys
from datetime import date, datetime, timedelta
from types import ModuleType, SimpleNamespace
import pytest

# Ensure a mock 'frappe' module is available if running outside Frappe bench
if "frappe" not in sys.modules:
    mock_frappe = ModuleType("frappe")
    mock_frappe.PermissionError = type("PermissionError", (Exception,), {})
    mock_frappe.DoesNotExistError = type("DoesNotExistError", (Exception,), {})
    mock_frappe.ValidationError = type("ValidationError", (ValueError,), {})
    mock_frappe.get_roles = lambda *a, **k: ["EE Tenant Admin"]
    mock_frappe.throw = lambda msg, exc=None: (_ for _ in ()).throw(exc(msg) if exc else Exception(msg))
    mock_frappe.whitelist = lambda *a, **k: (lambda fn: fn)
    mock_frappe.log_error = lambda *a, **k: None

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
    mock_utils.time_diff_in_hours = lambda t2, t1: 4.0
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

    mock_doc_module.Document = Document

    mock_frappe.utils = mock_utils
    mock_frappe.model = ModuleType("frappe.model")
    mock_frappe.model.document = mock_doc_module
    mock_frappe.defaults = SimpleNamespace(get_user_default=lambda *_: "Test Company")
    mock_frappe.db = SimpleNamespace(
        get_default=lambda *_: "USD",
        exists=lambda *a, **k: False,
        table_exists=lambda *_: True,
        get_value=lambda *a, **k: None,
        get_single_value=lambda *a, **k: None,
        get_all=lambda *a, **k: [],
        set_value=lambda *a, **k: None,
        count=lambda *a, **k: 0,
        commit=lambda: None,
        sql=lambda *a, **k: [],
    )
    mock_frappe.get_meta = lambda dt: SimpleNamespace(has_field=lambda f: True)
    mock_frappe.session = SimpleNamespace(user="Administrator")

    sys.modules["frappe"] = mock_frappe
    sys.modules["frappe.utils"] = mock_utils
    sys.modules["frappe.model"] = mock_frappe.model
    sys.modules["frappe.model.document"] = mock_doc_module

import frappe
if not hasattr(frappe, "get_doc"):
    frappe.get_doc = lambda *a, **k: None
if not hasattr(frappe, "get_all"):
    frappe.get_all = lambda *a, **k: []
if not hasattr(frappe, "session"):
    frappe.session = SimpleNamespace(user="Administrator")
if not hasattr(frappe, "DoesNotExistError"):
    frappe.DoesNotExistError = type("DoesNotExistError", (Exception,), {})
if not hasattr(frappe, "PermissionError"):
    frappe.PermissionError = type("PermissionError", (Exception,), {})
if not hasattr(frappe, "ValidationError"):
    frappe.ValidationError = type("ValidationError", (ValueError,), {})
if not hasattr(frappe, "get_roles"):
    frappe.get_roles = lambda *a, **k: ["EE Tenant Admin", "System Manager"]
if not hasattr(frappe, "throw"):
    frappe.throw = lambda msg, exc=None: (_ for _ in ()).throw(exc(msg) if exc else Exception(msg))


import frappe
from entertainment_express.fleet_maintenance.telemetry import (
    increment_asset_usage,
    evaluate_asset_maintenance_rules,
)
from entertainment_express.fleet_maintenance.quarantine import (
    quarantine_asset,
    release_quarantine,
)
from entertainment_express.fleet_maintenance.safety import (
    get_asset_safety_certificate_status,
    check_expiring_safety_certificates,
)
from entertainment_express.api import fleet_maintenance as fleet_api


class _MockTenantDb:
    """Mock tenant database with isolated table records."""
    def __init__(self, tenant_id="tenant_a"):
        self.tenant_id = tenant_id
        self.docs = {}

    def commit(self):
        pass

    def exists(self, doctype, name):
        if isinstance(name, dict):
            for (dt, _), doc in self.docs.items():
                if dt == doctype:
                    match = all(getattr(doc, k, None) == v for k, v in name.items())
                    if match:
                        return True
            return False
        return (doctype, name) in self.docs

    def get_doc(self, doctype, name=None):
        if isinstance(doctype, dict):
            dt = doctype.get("doctype")
            doc_name = doctype.get("name") or f"{dt}-{len(self.docs)+1}"
            doc = SimpleNamespace(**doctype)
            doc.name = doc_name
            doc.save = lambda *a, **k: self._save(doc)
            doc.insert = lambda *a, **k: self._save(doc)
            return doc
        key = (doctype, name)
        if key not in self.docs:
            doc = SimpleNamespace(name=name, doctype=doctype)
            doc.save = lambda *a, **k: self._save(doc)
            doc.insert = lambda *a, **k: self._save(doc)
            return doc
        return self.docs[key]

    def _save(self, doc):
        dt = getattr(doc, "doctype", "Doc")
        self.docs[(dt, doc.name)] = doc
        return doc

    def get_all(self, doctype, filters=None, fields=None, order_by=None, limit=None):
        res = []
        for (dt, _), doc in self.docs.items():
            if dt != doctype:
                continue
            if filters:
                match = True
                for k, v in filters.items():
                    doc_val = getattr(doc, k, None)
                    if isinstance(v, list) and len(v) == 2:
                        op, target = v[0], v[1]
                        if op == "!=" and doc_val == target:
                            match = False
                        elif op == "in" and doc_val not in target:
                            match = False
                        elif op == "<=" and doc_val > target:
                            match = False
                    elif doc_val != v:
                        match = False
                if not match:
                    continue
            row = {}
            if fields:
                for f in fields:
                    row[f] = getattr(doc, f, None)
            else:
                row = doc.__dict__.copy()
            res.append(row)
        return res

    def get_value(self, doctype, filters, fieldname="name"):
        if isinstance(filters, str):
            doc = self.docs.get((doctype, filters))
            if doc:
                return getattr(doc, fieldname, None)
        elif isinstance(filters, dict):
            for (dt, _), doc in self.docs.items():
                if dt == doctype:
                    if all(getattr(doc, k, None) == v for k, v in filters.items()):
                        return getattr(doc, fieldname, None)
        return None

    def set_value(self, doctype, name, fieldname, value=None):
        doc = self.docs.get((doctype, name))
        if doc:
            if isinstance(fieldname, dict):
                for k, v in fieldname.items():
                    setattr(doc, k, v)
            else:
                setattr(doc, fieldname, value)

    def count(self, doctype, filters=None):
        return len(self.get_all(doctype, filters=filters))

    def sql(self, query, values=None, as_dict=True):
        # Simulated booking conflict query
        if "FROM `tabEvent Booking Asset` eba" in query:
            asset = values.get("asset") if values else None
            conflicts = []
            for (dt, _), doc in self.docs.items():
                if dt == "Event Booking":
                    assigned = getattr(doc, "assigned_assets", []) or []
                    if any(getattr(a, "asset", None) == asset for a in assigned):
                        conflicts.append({
                            "booking_name": doc.name,
                            "event_date": doc.event_date,
                            "event_name": doc.event_name,
                            "customer": doc.customer,
                        })
            return conflicts
        return []


@pytest.fixture
def mock_db(monkeypatch):
    db = _MockTenantDb("tenant_a")
    monkeypatch.setattr(frappe, "db", db)
    monkeypatch.setattr(frappe, "get_doc", db.get_doc)
    monkeypatch.setattr(frappe, "get_all", db.get_all)
    return db


def test_increment_asset_usage_telemetry(mock_db):
    """Test 2.1: Usage telemetry increments operating hours and event count on booking completion."""
    asset = SimpleNamespace(
        doctype="Service Asset",
        name="EE-ASSET-001",
        asset_name="Castle Bounce House",
        asset_type="inflatable",
        operating_hours=10.0,
        event_count=5,
        condition_status="Dispatched",
        status="available",
    )
    asset.save = lambda *a, **k: mock_db._save(asset)
    mock_db._save(asset)

    booking = SimpleNamespace(
        doctype="Event Booking",
        name="EE-BK-2026-001",
        event_name="Smith Birthday",
        event_date="2026-09-14",
        start_time="12:00:00",
        end_time="16:00:00",
        status="completed",
        assigned_assets=[SimpleNamespace(asset="EE-ASSET-001", quantity_reserved=1)],
        flags=SimpleNamespace(),
    )

    updated = increment_asset_usage(booking)
    assert "EE-ASSET-001" in updated

    saved_asset = mock_db.get_doc("Service Asset", "EE-ASSET-001")
    assert saved_asset.operating_hours == 14.0  # 10 + 4.0
    assert saved_asset.event_count == 6  # 5 + 1
    assert saved_asset.condition_status == "Available"


def test_maintenance_schedule_trigger(mock_db):
    """Test 2.2: Maintenance rule evaluator triggers when hours threshold is met."""
    schedule = SimpleNamespace(
        doctype="Equipment Maintenance Schedule",
        name="EMS-001",
        rule_name="50-Hour Inflatable Seam Inspection",
        asset_category="inflatable",
        trigger_type="operating_hours",
        interval_value=50.0,
        service_checklist="Check seams, anchor points, baffle walls",
        is_active=1,
    )
    mock_db._save(schedule)

    asset = SimpleNamespace(
        doctype="Service Asset",
        name="EE-ASSET-002",
        asset_name="Giant Obstacle Course",
        asset_type="inflatable",
        operating_hours=52.0,  # Exceeds 50.0
        event_count=12,
        condition_status="Available",
        status="available",
    )
    asset.save = lambda *a, **k: mock_db._save(asset)
    mock_db._save(asset)

    triggered = evaluate_asset_maintenance_rules(asset)
    assert len(triggered) == 1

    rec = mock_db.get_doc("Maintenance Record", triggered[0])
    assert rec.asset == "EE-ASSET-002"
    assert rec.status == "open"
    assert rec.blocks_booking == 1
    assert "50-Hour Inflatable Seam Inspection" in rec.notes

    # Asset condition status updated to Pending Inspection
    saved_asset = mock_db.get_doc("Service Asset", "EE-ASSET-002")
    assert saved_asset.condition_status == "Pending Inspection"


def test_quarantine_asset_and_conflict_scanning(mock_db):
    """Test 3.2: Quarantining an asset revokes availability and detects future booking conflicts."""
    asset = SimpleNamespace(
        doctype="Service Asset",
        name="EE-ASSET-003",
        asset_name="Premium DJ Booth Rig",
        asset_type="dj_rig",
        condition_status="Available",
        status="available",
        condition="good",
    )
    asset.save = lambda *a, **k: mock_db._save(asset)
    mock_db._save(asset)

    # Replacement candidate
    repl = SimpleNamespace(
        doctype="Service Asset",
        name="EE-ASSET-004",
        asset_name="Backup DJ Booth Rig",
        asset_type="dj_rig",
        condition_status="Available",
        status="available",
        home_location="Warehouse North",
    )
    repl.save = lambda *a, **k: mock_db._save(repl)
    mock_db._save(repl)

    # Future booking within 14 days
    future_bk = SimpleNamespace(
        doctype="Event Booking",
        name="EE-BK-2026-099",
        event_name="Fall Gala",
        customer="Acme Corp",
        event_date="2026-09-18",
        status="confirmed",
        assigned_assets=[SimpleNamespace(asset="EE-ASSET-003")],
    )
    mock_db._save(future_bk)

    res = quarantine_asset("EE-ASSET-003", reason="Amplifier smoking / blown speaker")
    assert res["status"] == "quarantined"
    assert len(res["affected_bookings"]) == 1
    assert res["affected_bookings"][0]["booking"] == "EE-BK-2026-099"
    assert len(res["suggested_replacements"]) >= 1
    assert res["suggested_replacements"][0]["name"] == "EE-ASSET-004"

    # Asset state
    q_asset = mock_db.get_doc("Service Asset", "EE-ASSET-003")
    assert q_asset.condition_status == "Quarantined"
    assert q_asset.status == "maintenance"
    assert q_asset.condition == "damaged"


def test_quarantine_release(mock_db):
    """Test 3.3: Release quarantine clears quarantine, records repair cost, and restores Available status."""
    asset = SimpleNamespace(
        doctype="Service Asset",
        name="EE-ASSET-005",
        asset_name="Photo Booth Pro",
        asset_type="booth",
        condition_status="Quarantined",
        status="maintenance",
        quarantine_reason="Broken camera mount",
        condition="damaged",
    )
    asset.save = lambda *a, **k: mock_db._save(asset)
    mock_db._save(asset)

    defect = SimpleNamespace(
        doctype="Equipment Defect Report",
        name="EDR-001",
        asset_ref="EE-ASSET-005",
        severity="Major",
        resolution_status="Open",
    )
    mock_db._save(defect)

    res = release_quarantine("EE-ASSET-005", repair_cost=150.0, technician_notes="Replaced bracket and tested")
    assert res["status"] == "released"

    cleared_asset = mock_db.get_doc("Service Asset", "EE-ASSET-005")
    assert cleared_asset.condition_status == "Available"
    assert cleared_asset.quarantine_reason is None
    assert cleared_asset.status == "available"

    # Defect report resolved
    assert mock_db.get_value("Equipment Defect Report", "EDR-001", "resolution_status") == "Resolved"


def test_safety_certificate_expiration_gating(mock_db):
    """Test 2.3 & 3.1: Expired safety certificate flags asset and blocks dispatch."""
    cert = SimpleNamespace(
        doctype="Safety Certificate",
        name="SC-2025-01",
        certificate_name="PA Amusement Ride Inspection 2025",
        issuing_body="PA Dept of Agriculture",
        certificate_number="PA-AR-9921",
        expiry_date="2026-01-01",  # Past date
    )
    mock_db._save(cert)

    cert_asset = SimpleNamespace(
        doctype="Safety Certificate Asset",
        name="SCA-001",
        parent="SC-2025-01",
        asset="EE-ASSET-006",
    )
    mock_db._save(cert_asset)

    st = get_asset_safety_certificate_status("EE-ASSET-006", on_date="2026-09-14")
    assert st["valid"] is False
    assert "expired on 2026-01-01" in st["reason"]


def test_report_damage_endpoint_auto_quarantines(mock_db):
    """Test 4.1 & 6.2: Field damage report with Major/Critical severity auto-quarantines asset."""
    asset = SimpleNamespace(
        doctype="Service Asset",
        name="EE-ASSET-007",
        asset_name="Water Slide Deluxe",
        asset_type="inflatable",
        condition_status="Available",
        status="available",
    )
    asset.save = lambda *a, **k: mock_db._save(asset)
    mock_db._save(asset)

    res = fleet_api.report_damage(
        asset_ref="EE-ASSET-007",
        defect_description="Tear along bottom seam, leaking air fast",
        severity="Critical",
        booking_ref="EE-BK-2026-555",
        reported_by="lead_crew@entx.app",
        photos=["tear_1.jpg", "tear_2.jpg"],
    )

    assert res["success"] is True
    assert res["quarantined"] is True
    assert res["defect_report"] is not None

    q_asset = mock_db.get_doc("Service Asset", "EE-ASSET-007")
    assert q_asset.condition_status == "Quarantined"
    assert "[Critical Defect]" in q_asset.quarantine_reason


def test_fleet_health_summary_api(mock_db):
    """Test 4.2: Summary returns accurate fleet readiness and counts."""
    # Add 1 available, 1 quarantined, 1 in repair
    mock_db._save(SimpleNamespace(doctype="Service Asset", name="A1", status="available", condition_status="Available"))
    mock_db._save(SimpleNamespace(doctype="Service Asset", name="A2", status="available", condition_status="Available"))
    mock_db._save(SimpleNamespace(doctype="Service Asset", name="A3", status="maintenance", condition_status="Quarantined"))
    mock_db._save(SimpleNamespace(doctype="Service Asset", name="A4", status="maintenance", condition_status="In Repair"))

    summary = fleet_api.get_fleet_health_summary()
    assert summary["total_assets"] == 4
    assert summary["available_count"] == 2
    assert summary["quarantined_count"] == 1
    assert summary["in_repair_count"] == 1
    assert summary["readiness_percentage"] == 50.0


def test_multi_tenant_isolation(monkeypatch):
    """Golden Rule 1: Verify tenant A fleet defects and maintenance rules never leak to tenant B."""
    db_tenant_a = _MockTenantDb("tenant_a")
    db_tenant_b = _MockTenantDb("tenant_b")

    # Tenant A has an inflatable with defect
    db_tenant_a._save(SimpleNamespace(
        doctype="Service Asset",
        name="TA-ASSET-001",
        asset_name="Tenant A Bouncer",
        status="maintenance",
        condition_status="Quarantined",
    ))
    db_tenant_a._save(SimpleNamespace(
        doctype="Equipment Defect Report",
        name="TA-EDR-001",
        asset_ref="TA-ASSET-001",
        defect_description="Tenant A leak",
    ))

    # Tenant B has completely clean fleet
    db_tenant_b._save(SimpleNamespace(
        doctype="Service Asset",
        name="TB-ASSET-001",
        asset_name="Tenant B Bouncer",
        status="available",
        condition_status="Available",
    ))

    # Test Tenant A view
    monkeypatch.setattr(frappe, "db", db_tenant_a)
    monkeypatch.setattr(frappe, "get_all", db_tenant_a.get_all)
    monkeypatch.setattr(frappe, "get_doc", db_tenant_a.get_doc)

    summary_a = fleet_api.get_fleet_health_summary()
    quarantined_a = fleet_api.list_quarantined_assets()
    assert summary_a["quarantined_count"] == 1
    assert len(quarantined_a) == 1
    assert quarantined_a[0]["name"] == "TA-ASSET-001"

    # Switch to Tenant B context
    monkeypatch.setattr(frappe, "db", db_tenant_b)
    monkeypatch.setattr(frappe, "get_all", db_tenant_b.get_all)
    monkeypatch.setattr(frappe, "get_doc", db_tenant_b.get_doc)

    summary_b = fleet_api.get_fleet_health_summary()
    quarantined_b = fleet_api.list_quarantined_assets()
    assert summary_b["quarantined_count"] == 0
    assert summary_b["readiness_percentage"] == 100.0
    assert len(quarantined_b) == 0
    assert not any(q["name"] == "TA-ASSET-001" for q in quarantined_b)
