"""
Unit tests for Pre-Quote Margin Simulation Engine & Multi-Tenant Floor Guardrails.
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

from entertainment_express.job_costing import margin_simulator


class _MockSettingsDb:
    def __init__(self, target_margin=40.0, floor_margin=35.0, mileage_rate=1.50):
        self.single_values = {
            ("EE Portal Settings", "default_target_margin_percent"): target_margin,
            ("EE Portal Settings", "minimum_margin_floor_percent"): floor_margin,
            ("EE Portal Settings", "fleet_mileage_rate"): mileage_rate,
        }

    def table_exists(self, table_name):
        return True

    def get_single_value(self, doctype, fieldname):
        return self.single_values.get((doctype, fieldname))


# -----------------------------------------------------------------------------
# 1. Spec Scenario 1: Real-time simulation of draft proposal
# -----------------------------------------------------------------------------
def test_simulate_quote_margin_spec_scenario_1(monkeypatch):
    """
    GIVEN a draft quote with $3,000 gross total, 2 crew roles totaling $600 in projected labor,
          $150 vehicle transit, $100 equipment wear, and $90 payment gateway fee
    WHEN the owner or sales rep requests a margin simulation
    THEN the system returns projected COGS of $940, net profit of $2,060,
         projected margin of 68.67%, and health status 'healthy'
    """
    db = _MockSettingsDb(target_margin=40.0, floor_margin=35.0)
    monkeypatch.setattr(margin_simulator.frappe, "db", db)

    res = margin_simulator.simulate_quote_margin(
        grand_total=3000.0,
        crew_roles=[
            {"role": "Lead DJ", "hours": 6.0, "rate": 50.0, "count": 1},      # $300
            {"role": "Audio Tech", "hours": 6.0, "rate": 50.0, "count": 1},   # $300
        ],
        vehicle_transit_cost=150.0,
        equipment_wear_cost=100.0,
        gateway_fees=90.0,
    )

    assert res["gross_revenue"] == 3000.0
    assert res["projected_cogs"]["labor"] == 600.0
    assert res["projected_cogs"]["transit"] == 150.0
    assert res["projected_cogs"]["equipment_wear"] == 100.0
    assert res["projected_cogs"]["gateway_fees"] == 90.0
    assert res["projected_cogs"]["total"] == 940.0
    assert res["projected_total_cogs"] == 940.0
    assert res["projected_net_profit"] == 2060.0
    assert res["projected_margin_percent"] == 68.67
    assert res["status"] == "healthy"
    assert res["is_below_floor"] is False
    assert res["override_required"] is False
    assert res["recommended_price"] == 3000.0


# -----------------------------------------------------------------------------
# 2. Spec Scenario 2: Proposal discount falls below margin floor
# -----------------------------------------------------------------------------
def test_simulate_quote_margin_spec_scenario_2(monkeypatch):
    """
    GIVEN a tenant with minimum_margin_floor_percent set to 35.0%
    WHEN a proposal discount drops projected margin to 22.0%
    THEN the simulation returns status 'below_floor', calculates the required price
         to achieve 35% margin ($1,446.15), and flags override_required: true
    """
    db = _MockSettingsDb(target_margin=40.0, floor_margin=35.0)
    monkeypatch.setattr(margin_simulator.frappe, "db", db)

    # With COGS = $940 and target margin = 22.0%:
    # Gross revenue = 940 / (1 - 0.22) = 1205.13
    res = margin_simulator.simulate_quote_margin(
        grand_total=1205.13,
        labor_cost=600.0,
        vehicle_transit_cost=150.0,
        equipment_wear_cost=100.0,
        gateway_fees=90.0,
        minimum_margin_floor_percent=35.0,
    )

    assert res["projected_total_cogs"] == 940.0
    assert res["projected_margin_percent"] == 22.0
    assert res["status"] == "below_floor"
    assert res["is_below_floor"] is True
    assert res["override_required"] is True
    assert res["recommended_price"] == 1446.15


# -----------------------------------------------------------------------------
# 3. Warning Threshold (Between Floor 35% and Target 40%)
# -----------------------------------------------------------------------------
def test_simulate_quote_margin_warning_threshold(monkeypatch):
    """
    Verify that when projected margin is above floor but below target,
    status is 'warning' and recommended price calculates target margin price.
    """
    db = _MockSettingsDb(target_margin=40.0, floor_margin=35.0)
    monkeypatch.setattr(margin_simulator.frappe, "db", db)

    # COGS = 600, Revenue = 1000 => Margin = 40%
    # Revenue = 950 => Profit = 350 => Margin = 36.84% (between 35% and 40%)
    res = margin_simulator.simulate_quote_margin(
        grand_total=950.0,
        labor_cost=600.0,
        gateway_fees=0.0,
        target_margin_percent=40.0,
        minimum_margin_floor_percent=35.0,
    )

    assert res["projected_total_cogs"] == 600.0
    assert res["projected_margin_percent"] == 36.84
    assert res["status"] == "warning"
    assert res["is_below_floor"] is False
    assert res["override_required"] is False
    # Price for 40% margin = 600 / (1 - 0.40) = 1000.00
    assert res["recommended_price"] == 1000.0


# -----------------------------------------------------------------------------
# 4. Vehicle Transit Cost Estimation
# -----------------------------------------------------------------------------
def test_vehicle_transit_cost_estimation(monkeypatch):
    db = _MockSettingsDb(mileage_rate=1.50)
    monkeypatch.setattr(margin_simulator.frappe, "db", db)

    # 100 miles @ 1.50 = 150.0
    van_cost = margin_simulator.estimate_vehicle_transit_cost(distance_miles=100.0)
    assert van_cost == 150.0

    # Box truck: 1.35 multiplier => 100 * 1.50 * 1.35 = 202.50
    truck_cost = margin_simulator.estimate_vehicle_transit_cost(
        distance_miles=100.0, vehicle_type="box_truck"
    )
    assert truck_cost == 202.50


# -----------------------------------------------------------------------------
# 5. Multi-Tenant Floor Configuration Isolation
# -----------------------------------------------------------------------------
def test_margin_simulator_multi_tenant_isolation(monkeypatch):
    """
    Verify that tenant site A with a 35% floor and tenant site B with a 45% floor
    evaluate the exact same quote differently, respecting tenant isolation.
    """
    tenant_a_db = _MockSettingsDb(target_margin=40.0, floor_margin=35.0)
    tenant_b_db = _MockSettingsDb(target_margin=50.0, floor_margin=45.0)

    # In Tenant A: A quote with 38% margin is ACCEPTABLE (status warning, above floor)
    monkeypatch.setattr(margin_simulator.frappe, "db", tenant_a_db)
    res_a = margin_simulator.simulate_quote_margin(
        grand_total=1000.0,
        labor_cost=620.0,  # COGS = 620, Profit = 380, Margin = 38.0%
        gateway_fees=0.0,
    )
    assert res_a["is_below_floor"] is False
    assert res_a["override_required"] is False
    assert res_a["status"] == "warning"

    # In Tenant B: The exact same quote is BELOW FLOOR (45% required, actual is 38%)
    monkeypatch.setattr(margin_simulator.frappe, "db", tenant_b_db)
    res_b = margin_simulator.simulate_quote_margin(
        grand_total=1000.0,
        labor_cost=620.0,
        gateway_fees=0.0,
    )
    assert res_b["is_below_floor"] is True
    assert res_b["override_required"] is True
    assert res_b["status"] == "below_floor"
    # Price required in Tenant B: 620 / (1 - 0.45) = 1127.27
    assert res_b["recommended_price"] == 1127.27
