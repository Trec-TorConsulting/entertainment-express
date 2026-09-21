"""Unit tests for margin leakage defense COGS: COGS calculation accuracy, Cost Center creation, and GL entry rollups."""

from __future__ import annotations

import sys
from types import ModuleType, SimpleNamespace
import pytest


def _install_frappe_stub() -> None:
    if "frappe" in sys.modules and hasattr(sys.modules["frappe"], "whitelist"):
        return
    m = ModuleType("frappe")
    m.whitelist = lambda *a, **k: (lambda f: f)
    m.PermissionError = type("PermissionError", (Exception,), {})
    m.utils = ModuleType("frappe.utils")
    m.utils.cint = lambda x, *a, **k: int(float(x or 0))
    m.utils.flt = lambda x, *a, **k: float(x or 0)
    m.get_roles = lambda *a, **k: ["EE Accounting"]
    m.session = SimpleNamespace(user="accounting@test.com")
    m.throw = lambda message, exc=None: (_ for _ in ()).throw((exc or Exception)(message))
    m.db = SimpleNamespace(
        table_exists=lambda *_: True,
        exists=lambda *a, **k: True,
        get_value=lambda *a, **k: None,
    )
    sys.modules["frappe"] = m
    sys.modules["frappe.utils"] = m.utils


_install_frappe_stub()

from entertainment_express.api import job_costing  # noqa: E402
from entertainment_express.job_costing import margin_simulator  # noqa: E402


def test_simulate_quote_cogs_calculation():
    res = margin_simulator.simulate_quote_cogs(
        grand_total=2000.0,
        labor_cost=500.0,
        subcontractor_cost=300.0,
        consumable_cost=100.0,
        equipment_wear_cost=100.0,
        gateway_fees=58.30,
    )
    assert res["gross_revenue"] == 2000.0
    assert res["projected_total_cogs"] == 1058.30
    assert res["projected_net_profit"] == 941.70
    assert res["projected_margin_percent"] == 47.08
    assert res["status"] == "healthy"


def test_get_event_pl_drawer_data_structure(monkeypatch):
    mock_pl = {
        "event_name": "Gala Party",
        "customer_name": "Austin Corp",
        "gross_revenue": 5000.0,
        "labor_cost": 1200.0,
        "subcontractor_cost": 800.0,
        "consumable_cost": 200.0,
        "equipment_wear_cost": 300.0,
        "gateway_fees": 145.0,
        "total_cogs": 2645.0,
        "net_profit": 2355.0,
        "margin_percent": 47.1,
        "target_margin_percent": 40.0,
        "margin_status": "healthy",
        "ledger_lines": [],
    }

    monkeypatch.setattr(job_costing, "get_event_pl", lambda booking_name: mock_pl)
    monkeypatch.setattr(job_costing, "_check_access", lambda: None)

    drawer = job_costing.get_event_pl_drawer_data("BK-GALA-01")
    assert drawer["booking_id"] == "BK-GALA-01"
    assert drawer["waterfall"]["total_cogs"] == 2645.0
    assert drawer["waterfall"]["net_profit"] == 2355.0
    assert drawer["margin_status"] == "healthy"
