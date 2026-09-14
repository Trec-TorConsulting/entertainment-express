"""
Unit tests and multi-tenant isolation verification for Job-Level Costing & Margin Intelligence.
"""

import sys
from types import ModuleType, SimpleNamespace
import pytest

# Ensure a mock 'frappe' module is available if running outside a full Frappe environment
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
    mock_utils.fmt_money = lambda v, currency="USD": f"${float(v or 0):,.2f}"
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
    )
    mock_frappe.get_meta = lambda dt: SimpleNamespace(has_field=lambda f: True)
    sys.modules["frappe"] = mock_frappe
    sys.modules["frappe.utils"] = mock_utils
    sys.modules["frappe.model"] = mock_frappe.model
    sys.modules["frappe.model.document"] = mock_doc_module

from entertainment_express.job_costing import provisioning, cost_engine
from entertainment_express.api import job_costing
from entertainment_express.billing_payments.doctype.event_cost_sheet.event_cost_sheet import EventCostSheet


class _MockTenantDb:
    def __init__(self, tenant_id="tenant_a"):
        self.tenant_id = tenant_id
        self.docs = {}  # (doctype, name) -> doc
        self.single_values = {
            ("EE Portal Settings", "default_target_margin_percent"): 40.0,
            ("EE Portal Settings", "low_margin_warning_threshold"): 25.0,
            ("Global Defaults", "default_company"): f"Company {tenant_id}",
        }

    def table_exists(self, table_name):
        return True

    def exists(self, doctype, name):
        if isinstance(name, dict):
            for (dt, _), doc in self.docs.items():
                if dt == doctype:
                    match = all(getattr(doc, k, None) == v for k, v in name.items())
                    if match:
                        return True
            return False
        return (doctype, name) in self.docs

    def get_value(self, doctype, filters, fieldname="name", order_by=None):
        if isinstance(filters, str):
            doc = self.docs.get((doctype, filters))
            return getattr(doc, fieldname, None) if doc else None
        if isinstance(filters, dict):
            for (dt, _), doc in self.docs.items():
                if dt == doctype:
                    match = all(getattr(doc, k, None) == v for k, v in filters.items())
                    if match:
                        return getattr(doc, fieldname, None)
        return None

    def get_single_value(self, doctype, fieldname):
        return self.single_values.get((doctype, fieldname))

    def get_all(self, doctype, filters=None, fields=None, limit=None, order_by=None, pluck=None):
        results = []
        for (dt, name), doc in self.docs.items():
            if dt == doctype:
                if filters:
                    matches = True
                    for k, v in filters.items():
                        doc_val = getattr(doc, k, None)
                        if isinstance(v, list) and len(v) == 2:
                            op, op_val = v
                            if op == "in" and doc_val not in op_val:
                                matches = False
                            elif op == "not in" and doc_val in op_val:
                                matches = False
                            elif op == ">=" and doc_val < op_val:
                                matches = False
                            elif op == "<=" and doc_val > op_val:
                                matches = False
                            elif op == "=" and doc_val != op_val:
                                matches = False
                        elif doc_val != v:
                            matches = False
                    if not matches:
                        continue
                if pluck:
                    results.append(getattr(doc, pluck, None))
                else:
                    item = {"name": name}
                    if fields:
                        for f in fields:
                            item[f] = getattr(doc, f, None)
                    results.append(item)
        if limit:
            results = results[:limit]
        return results

    def set_value(self, doctype, name, fieldname, value=None, update_modified=True):
        doc = self.docs.get((doctype, name))
        if doc:
            if isinstance(fieldname, dict):
                for k, v in fieldname.items():
                    setattr(doc, k, v)
            else:
                setattr(doc, fieldname, value)


class _MockFrappeEnv:
    def __init__(self, tenant_id="tenant_a", roles=None):
        self.tenant_id = tenant_id
        self.roles = roles or ["EE Tenant Admin"]
        self.db = _MockTenantDb(tenant_id)
        self.defaults = SimpleNamespace(get_user_default=lambda *_: f"Company {tenant_id}")
        self.PermissionError = type("PermissionError", (Exception,), {})
        self.DoesNotExistError = type("DoesNotExistError", (Exception,), {})
        self.ValidationError = type("ValidationError", (ValueError,), {})
        self.utils = sys.modules["frappe.utils"]

    def get_roles(self):
        return list(self.roles)

    def throw(self, msg, exc=None):
        exc_class = exc or Exception
        raise exc_class(msg)

    def whitelist(self, *a, **k):
        return lambda fn: fn

    def log_error(self, *a, **k):
        pass

    def get_meta(self, dt):
        return SimpleNamespace(has_field=lambda f: True)

    def get_doc(self, doctype, name=None):
        if isinstance(doctype, dict):
            dt = doctype.get("doctype")
            doc = SimpleNamespace(**doctype)
            doc.name = doctype.get("name") or f"{dt}-{len(self.db.docs)+1}"
            doc.is_new = lambda: False
            doc.insert = lambda *a, **k: self._insert(dt, doc)
            doc.save = lambda *a, **k: self._save(dt, doc)
            return doc
        doc = self.db.docs.get((doctype, name))
        if not doc:
            raise self.DoesNotExistError(f"{doctype} {name} not found")
        return doc

    def new_doc(self, doctype):
        doc = SimpleNamespace(doctype=doctype, name=f"{doctype}-{len(self.db.docs)+1}")
        doc.is_new = lambda: True
        doc.insert = lambda *a, **k: self._insert(doctype, doc)
        doc.save = lambda *a, **k: self._save(doctype, doc)
        doc.calculate_totals = lambda: None
        return doc

    def _insert(self, doctype, doc):
        self.db.docs[(doctype, doc.name)] = doc
        return doc

    def _save(self, doctype, doc):
        self.db.docs[(doctype, doc.name)] = doc
        return doc


@pytest.fixture
def env():
    e = _MockFrappeEnv("site_alpha")
    return e


# -----------------------------------------------------------------------------
# 1. Cost Center & Project Provisioning Tests
# -----------------------------------------------------------------------------

def test_provisioning_creates_cost_center_and_project(env, monkeypatch):
    monkeypatch.setattr(provisioning, "frappe", env)

    booking = SimpleNamespace(
        name="BK-2026-0001",
        doctype="Event Booking",
        status="confirmed",
        event_name="Metro Gala 2026",
        customer="CUST-001",
        grand_total=5000.0,
        currency="USD",
        target_margin_percent=40.0,
        cost_center=None,
        project=None,
        cost_sheet=None,
        is_new=lambda: False,
    )
    env.db.docs[("Event Booking", "BK-2026-0001")] = booking

    res = provisioning.ensure_event_cost_center_and_project(booking)
    assert res is not None
    assert booking.cost_center is not None
    assert booking.project is not None
    assert booking.cost_sheet is not None

    # Check that documents were stored in mock DB
    assert env.db.exists("Cost Center", booking.cost_center)
    assert env.db.exists("Project", booking.project)
    assert env.db.exists("Event Cost Sheet", booking.cost_sheet)


def test_provisioning_skips_inquiry_or_canceled(env, monkeypatch):
    monkeypatch.setattr(provisioning, "frappe", env)

    booking = SimpleNamespace(
        name="BK-2026-INQUIRY",
        doctype="Event Booking",
        status="inquiry",
        event_name="Casual Inquiry",
        cost_center=None,
        project=None,
        cost_sheet=None,
        is_new=lambda: False,
    )
    res = provisioning.ensure_event_cost_center_and_project(booking)
    assert res is None
    assert booking.cost_center is None


# -----------------------------------------------------------------------------
# 2. Cost Rollup Math & Margin Calculation Tests
# -----------------------------------------------------------------------------

def test_cost_sheet_rollup_math(env, monkeypatch):
    monkeypatch.setattr(cost_engine, "frappe", env)

    booking = SimpleNamespace(
        name="BK-ROLLUP-01",
        doctype="Event Booking",
        status="confirmed",
        event_name="Summer Fest",
        customer="CUST-002",
        grand_total=5000.0,
        currency="USD",
        target_margin_percent=40.0,
        cost_center="CC-BK-ROLLUP-01",
        project="PRJ-BK-ROLLUP-01",
        cost_sheet=None,
        start_time="14:00:00",
        end_time="18:00:00",
        assigned_assets=[
            SimpleNamespace(name="AST-1", asset="ITEM-SOUND-SYS"),
            SimpleNamespace(name="AST-2", asset="ITEM-LIGHT-BAR"),
        ],
        deposit_status="paid",
        deposit_amount=2500.0,
        is_new=lambda: False,
    )
    env.db.docs[("Event Booking", "BK-ROLLUP-01")] = booking

    # Seed Sales Invoice: $5,000.00
    env.db.docs[("Sales Invoice", "SINV-001")] = SimpleNamespace(
        name="SINV-001",
        ee_booking="BK-ROLLUP-01",
        docstatus=1,
        grand_total=5000.0,
        posting_date="2026-09-14",
    )

    # Seed Timesheets: 2 crew members, 8 hours total @ $30/hr = $240.00
    env.db.docs[("Timesheet Detail", "TSD-001")] = SimpleNamespace(
        name="TSD-001",
        ee_booking="BK-ROLLUP-01",
        hours=4.0,
        billing_rate=30.0,
        cost_rate=30.0,
        cost_amount=120.0,
    )
    env.db.docs[("Timesheet Detail", "TSD-002")] = SimpleNamespace(
        name="TSD-002",
        ee_booking="BK-ROLLUP-01",
        hours=4.0,
        billing_rate=30.0,
        cost_rate=30.0,
        cost_amount=120.0,
    )

    # Seed Subcontractor Purchase Invoice: $600.00
    env.db.docs[("Purchase Invoice", "PINV-001")] = SimpleNamespace(
        name="PINV-001",
        ee_booking="BK-ROLLUP-01",
        docstatus=1,
        grand_total=600.0,
        supplier="PhotoBooth Co",
        posting_date="2026-09-14",
    )

    # Seed Consumable Stock Entry: $100.00
    env.db.docs[("Stock Entry Detail", "SED-001")] = SimpleNamespace(
        name="SED-001",
        cost_center="CC-BK-ROLLUP-01",
        item_code="FOG-FLUID-GAL",
        qty=2,
        valuation_rate=50.0,
        amount=100.0,
    )

    result = cost_engine.recompute_event_cost_sheet("BK-ROLLUP-01")

    # Assertions
    assert result["gross_revenue"] == 5000.0
    assert result["labor_cost"] == 240.0
    assert result["subcontractor_cost"] == 600.0
    assert result["consumable_cost"] == 100.0
    assert result["equipment_wear_cost"] == 30.0  # 2 assets * $15 wear default
    # Gateway fee: 2.9% + $0.30 on $2,500 deposit = $72.80
    assert result["gateway_fees"] == 72.80

    expected_cogs = round(240.0 + 600.0 + 100.0 + 30.0 + 72.80, 2)
    assert result["total_cogs"] == expected_cogs
    expected_profit = round(5000.0 - expected_cogs, 2)
    assert result["net_profit"] == expected_profit

    expected_margin = round((expected_profit / 5000.0) * 100.0, 2)
    assert result["margin_percent"] == expected_margin
    assert result["margin_status"] == "healthy"  # ~79% > 40% target
    assert len(result["ledger_lines"]) >= 5


def test_zero_division_safeguard(env, monkeypatch):
    """Ensure zero revenue does not trigger ZeroDivisionError."""
    monkeypatch.setattr(cost_engine, "frappe", env)

    booking = SimpleNamespace(
        name="BK-ZERO-REV",
        doctype="Event Booking",
        status="confirmed",
        event_name="Zero Revenue Event",
        grand_total=0.0,
        cost_center=None,
        project=None,
        cost_sheet=None,
        assigned_assets=[],
        is_new=lambda: False,
    )
    env.db.docs[("Event Booking", "BK-ZERO-REV")] = booking

    res = cost_engine.recompute_event_cost_sheet("BK-ZERO-REV")
    assert res["gross_revenue"] == 0.0
    assert res["margin_percent"] == 0.0
    assert res["margin_status"] == "critical"


def test_margin_status_threshold_transitions():
    """Verify healthy, warning, and critical transitions."""
    sheet = EventCostSheet()
    sheet.gross_revenue = 1000.0
    sheet.target_margin_percent = 40.0

    # 1. Healthy: 50% margin
    sheet.labor_cost = 500.0
    sheet.subcontractor_cost = 0
    sheet.consumable_cost = 0
    sheet.equipment_wear_cost = 0
    sheet.gateway_fees = 0
    sheet.calculate_totals()
    assert sheet.margin_percent == 50.0
    assert sheet.margin_status == "healthy"

    # 2. Warning: 30% margin (between 25% low threshold and 40% target)
    sheet.labor_cost = 700.0
    sheet.calculate_totals()
    assert sheet.margin_percent == 30.0
    assert sheet.margin_status == "warning"

    # 3. Critical: 15% margin (< 25% low threshold)
    sheet.labor_cost = 850.0
    sheet.calculate_totals()
    assert sheet.margin_percent == 15.0
    assert sheet.margin_status == "critical"


# -----------------------------------------------------------------------------
# 3. API Endpoints Tests
# -----------------------------------------------------------------------------

def test_api_get_event_pl(env, monkeypatch):
    monkeypatch.setattr(job_costing, "frappe", env)
    monkeypatch.setattr(cost_engine, "frappe", env)
    monkeypatch.setattr(provisioning, "frappe", env)

    booking = SimpleNamespace(
        name="BK-API-01",
        doctype="Event Booking",
        status="confirmed",
        event_name="Annual Gala",
        customer="CUST-001",
        grand_total=3000.0,
        currency="USD",
        target_margin_percent=40.0,
        cost_center=None,
        project=None,
        cost_sheet=None,
        assigned_assets=[],
        is_new=lambda: False,
    )
    env.db.docs[("Event Booking", "BK-API-01")] = booking

    res = job_costing.get_event_pl("BK-API-01")
    assert res["booking_name"] == "BK-API-01"
    assert res["gross_revenue"] == 3000.0
    assert res["target_margin_percent"] == 40.0
    assert "ledger_lines" in res


def test_api_set_margin_target_permissions(env, monkeypatch):
    monkeypatch.setattr(job_costing, "frappe", env)

    booking = SimpleNamespace(
        name="BK-TARGET-01",
        doctype="Event Booking",
        status="confirmed",
        target_margin_percent=40.0,
        is_new=lambda: False,
    )
    env.db.docs[("Event Booking", "BK-TARGET-01")] = booking

    # As Tenant Admin: succeeds
    env.roles = ["EE Tenant Admin"]
    res = job_costing.set_event_margin_target("BK-TARGET-01", 55.0)
    assert res["target_margin_percent"] == 55.0

    # As EE Crew without admin role: throws PermissionError
    env.roles = ["EE Crew"]
    with pytest.raises(env.PermissionError):
        job_costing.set_event_margin_target("BK-TARGET-01", 60.0)


# -----------------------------------------------------------------------------
# 4. Multi-Tenant Database Isolation Tests
# -----------------------------------------------------------------------------

def test_job_costing_multi_tenant_isolation(monkeypatch):
    """
    Verify that tenant site A's cost sheets, projects, and margin summaries
    cannot be accessed or leaked to tenant site B.
    """
    env_a = _MockFrappeEnv(tenant_id="alpha.entx.app")
    env_b = _MockFrappeEnv(tenant_id="beta.entx.app")

    # Seed Booking and Cost Sheet in Tenant A
    booking_a = SimpleNamespace(
        name="BK-ALPHA-100",
        doctype="Event Booking",
        status="confirmed",
        event_name="Alpha Private Event",
        customer="CUST-ALPHA",
        grand_total=10000.0,
        target_margin_percent=45.0,
        cost_center="CC-ALPHA",
        project="PRJ-ALPHA",
        cost_sheet="ECS-BK-ALPHA-100",
        is_new=lambda: False,
    )
    sheet_a = SimpleNamespace(
        name="ECS-BK-ALPHA-100",
        doctype="Event Cost Sheet",
        event_booking="BK-ALPHA-100",
        gross_revenue=10000.0,
        total_cogs=4000.0,
        net_profit=6000.0,
        margin_percent=60.0,
        target_margin_percent=45.0,
        margin_status="healthy",
        details_json="[]",
        last_recomputed_at="2026-09-14 12:00:00",
        is_new=lambda: False,
    )
    env_a.db.docs[("Event Booking", "BK-ALPHA-100")] = booking_a
    env_a.db.docs[("Event Cost Sheet", "ECS-BK-ALPHA-100")] = sheet_a

    # Verify Tenant A sees its data
    monkeypatch.setattr(job_costing, "frappe", env_a)
    summary_a = job_costing.list_events_margin_summary()
    assert summary_a["summary"]["total_events"] == 1
    assert summary_a["events"][0]["booking_name"] == "BK-ALPHA-100"

    # Verify Tenant B queries see ZERO events and cannot get Tenant A's P&L
    monkeypatch.setattr(job_costing, "frappe", env_b)
    summary_b = job_costing.list_events_margin_summary()
    assert summary_b["summary"]["total_events"] == 0
    assert len(summary_b["events"]) == 0

    # Attempting to fetch Tenant A's booking in Tenant B must raise DoesNotExistError
    with pytest.raises(env_b.DoesNotExistError):
        job_costing.get_event_pl("BK-ALPHA-100")
