"""Unit tests for weather risk cancellation engine: threshold triggers, rain date voucher generation, and telemetry parsing."""

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
    m.utils.add_days = lambda dt, n: "2027-09-21"
    m.get_roles = lambda *a, **k: ["EE Customer"]
    m.session = SimpleNamespace(user="client@test.com")
    m.generate_hash = lambda length=8: "A1B2C3D4"
    m.throw = lambda message, exc=None: (_ for _ in ()).throw((exc or Exception)(message))
    m.db = SimpleNamespace(
        table_exists=lambda *_: True,
        exists=lambda *a, **k: True,
        commit=lambda: None,
    )
    sys.modules["frappe"] = m
    sys.modules["frappe.utils"] = m.utils


_install_frappe_stub()

from entertainment_express.api import weather  # noqa: E402


class _FakeDoc:
    def __init__(self, **kwargs):
        for k, v in kwargs.items():
            setattr(self, k, v)

    def insert(self, ignore_permissions=False):
        return self

    def save(self, ignore_permissions=False):
        return self


def test_claim_rain_date_reschedule_voucher_generation(monkeypatch):
    booking_doc = _FakeDoc(
        name="BK-RAIN-01",
        customer="CUST-100",
        grand_total=750.0,
        status="confirmed",
    )

    inserted_vouchers = []

    def fake_get_doc(dt, name=None):
        if dt == "Event Booking":
            return booking_doc
        if isinstance(dt, dict) and dt.get("doctype") == "EE Rain Date Voucher":
            v = _FakeDoc(**dt)
            inserted_vouchers.append(v)
            return v
        return booking_doc

    fake_frappe = SimpleNamespace(
        get_doc=fake_get_doc,
        get_roles=lambda: ["EE Customer"],
        session=SimpleNamespace(user="client@test.com"),
        db=SimpleNamespace(
            table_exists=lambda dt: True,
            commit=lambda: None,
        ),
        generate_hash=lambda length=8: "RAIN8888",
        utils=SimpleNamespace(
            add_days=lambda dt, n: "2027-09-21",
            flt=lambda x, *a, **k: float(x or 0),
        ),
        whitelist=lambda *a, **k: (lambda f: f),
        PermissionError=Exception,
        throw=lambda msg, exc=None: (_ for _ in ()).throw((exc or Exception)(msg)),
    )

    monkeypatch.setattr(weather, "frappe", fake_frappe)
    monkeypatch.setattr(weather, "_deny_guest", lambda: None)

    res = weather.claim_rain_date_reschedule("BK-RAIN-01")
    assert res["status"] == "claimed"
    assert res["credit_amount"] == 750.0
    assert "RAIN-RAIN8888" in res["voucher_code"]
    assert booking_doc.status == "canceled"


def test_weather_threshold_evaluation():
    thresholds = {
        "wind_mph_max": 25.0,
        "precip_inch_hours": 0.25,
        "threshold_action": "block",
        "lightning_policy": "block",
    }
    assert weather.evaluate_status(wind_mph=15.0, precip_inch=0.05, lightning_risk=False, thresholds=thresholds) == "clear"
    assert weather.evaluate_status(wind_mph=21.0, precip_inch=0.05, lightning_risk=False, thresholds=thresholds) == "watch"
    assert weather.evaluate_status(wind_mph=28.0, precip_inch=0.05, lightning_risk=False, thresholds=thresholds) == "block"
