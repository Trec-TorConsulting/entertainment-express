"""Unit tests for digital tip pool splitting and Stripe Connect transfer payload construction."""

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
    m.get_roles = lambda *a, **k: ["EE Finance"]
    m.session = SimpleNamespace(user="finance@test.com")
    m.generate_hash = lambda length=16: "HASH123456789012"
    m.throw = lambda message, exc=None: (_ for _ in ()).throw((exc or Exception)(message))
    m.db = SimpleNamespace(
        table_exists=lambda *_: True,
        exists=lambda *a, **k: True,
    )
    sys.modules["frappe"] = m
    sys.modules["frappe.utils"] = m.utils


_install_frappe_stub()

from entertainment_express.api import payroll  # noqa: E402
from entertainment_express.payroll import tip_splitter  # noqa: E402


def test_create_guest_tip_intent():
    res = payroll.create_guest_tip_intent(booking_id="BK-TIP-100", tip_amount=25.0, payment_method="apple_pay")
    assert res["booking_id"] == "BK-TIP-100"
    assert res["tip_amount"] == 25.0
    assert res["payment_method"] == "apple_pay"
    assert "pi_tip_" in res["payment_intent_id"]


def test_trigger_stripe_instant_payout(monkeypatch):
    monkeypatch.setattr(payroll, "_require_admin_or_finance", lambda: None)
    res = payroll.trigger_stripe_instant_payout(worker_id="EMP-101", amount=150.0)
    assert res["worker"] == "EMP-101"
    assert res["amount"] == 150.0
    assert res["status"] == "paid"
    assert res["payout_method"] == "stripe_instant"


def test_tip_split_math_equal_and_weighted():
    crew = [
        {"worker": "W1", "role": "Lead DJ", "is_lead": True, "hours": 6.0},
        {"worker": "W2", "role": "Assistant", "is_lead": False, "hours": 4.0},
    ]

    equal_res = tip_splitter.distribute_booking_tips("BK-100", tip_pool_amount=200.0, policy="equal", assigned_crew=crew)
    assert equal_res["allocations"][0]["allocated_amount"] == 100.0
    assert equal_res["allocations"][1]["allocated_amount"] == 100.0

    hrs_res = tip_splitter.distribute_booking_tips("BK-100", tip_pool_amount=200.0, policy="hours_weighted", assigned_crew=crew)
    # W1: 6/10 * 200 = 120, W2: 4/10 * 200 = 80
    assert hrs_res["allocations"][0]["allocated_amount"] == 120.0
    assert hrs_res["allocations"][1]["allocated_amount"] == 80.0
