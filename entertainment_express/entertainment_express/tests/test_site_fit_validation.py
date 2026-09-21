"""Tests for site fit validation: gate clearance, surface sandbags, vehicle balance, driver site packets."""

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
    m.DoesNotExistError = type("DoesNotExistError", (Exception,), {})
    m.utils = ModuleType("frappe.utils")
    m.utils.cint = lambda x, *a, **k: int(float(x or 0))
    m.utils.flt = lambda x, *a, **k: float(x or 0)
    m.get_roles = lambda *a, **k: ["System Manager", "EE Dispatcher", "EE Crew"]
    m.throw = lambda message, exc=None: (_ for _ in ()).throw((exc or Exception)(message))
    m.db = SimpleNamespace(
        exists=lambda *a, **k: True,
        commit=lambda: None,
    )
    sys.modules["frappe"] = m
    sys.modules["frappe.utils"] = m.utils


_install_frappe_stub()

from entertainment_express.api import site_fit  # noqa: E402


class _FakeDoc:
    def __init__(self, **kwargs):
        for k, v in kwargs.items():
            setattr(self, k, v)

    def insert(self, ignore_permissions=False):
        return self


def test_site_fit_validation_gate_clearance_block(monkeypatch):
    """Verify gate width clearance blocker when equipment is wider than gate."""
    booking = _FakeDoc(
        name="BK-TEST-GATE",
        site_gate_width=32,
        site_surface="Grass",
        site_power="Dedicated 20A Within 50ft",
        venue=None,
        service_items=[_FakeDoc(item="WIDE_BOUNCE")],
    )

    item = _FakeDoc(
        item_code="WIDE_BOUNCE",
        item_name="Mega Bounce 24",
        ee_packed_width_in=42.0,
        ee_amperage_draw=15.0,
    )

    fake_frappe = SimpleNamespace(
        get_roles=lambda: ["EE Dispatcher"],
        exists=lambda dt, val=None: True,
        get_doc=lambda dt, name=None: booking if dt == "Event Booking" else item,
        throw=lambda msg, exc=None: (_ for _ in ()).throw((exc or Exception)(msg)),
        DoesNotExistError=Exception,
        PermissionError=Exception,
        _=(lambda x: x),
    )

    monkeypatch.setattr(site_fit, "frappe", fake_frappe)

    res = site_fit.validate_site_fit("BK-TEST-GATE")
    assert res["compatible"] is False
    assert len(res["issues"]) == 1
    assert res["issues"][0]["type"] == "gate"
    assert res["issues"][0]["severity"] == "blocker"


def test_site_fit_asphalt_sandbags_required(monkeypatch):
    """Verify sandbag warning when surface is asphalt or concrete."""
    booking = _FakeDoc(
        name="BK-TEST-ASPHALT",
        site_gate_width=48,
        site_surface="Asphalt",
        site_power="Dedicated 20A Within 50ft",
        venue=None,
        service_items=[_FakeDoc(item="SLIDE_01")],
    )

    item = _FakeDoc(
        item_code="SLIDE_01",
        item_name="Dual Water Slide",
        ee_packed_width_in=36.0,
        ee_requires_asset=1,
    )

    fake_frappe = SimpleNamespace(
        get_roles=lambda: ["EE Dispatcher"],
        exists=lambda dt, val=None: True,
        get_doc=lambda dt, name=None: booking if dt == "Event Booking" else item,
        throw=lambda msg, exc=None: (_ for _ in ()).throw((exc or Exception)(msg)),
        DoesNotExistError=Exception,
        PermissionError=Exception,
        _=(lambda x: x),
    )

    monkeypatch.setattr(site_fit, "frappe", fake_frappe)

    res = site_fit.validate_site_fit("BK-TEST-ASPHALT")
    assert res["sandbags_required"] == 4
    assert any(i["type"] == "surface" for i in res["issues"])


def test_vehicle_load_balance_overloaded(monkeypatch):
    """Verify payload weight and cargo volume overload calculation."""
    vehicle = _FakeDoc(name="VAN-MINI", max_payload_lbs=1000.0, cargo_volume_cuft=100.0)
    booking = _FakeDoc(
        service_items=[
            _FakeDoc(item="HEAVY_EQUIP", qty=2)
        ]
    )
    item = _FakeDoc(
        ee_packed_weight_lbs=600.0,
        ee_packed_length_in=48.0,
        ee_packed_width_in=48.0,
        ee_packed_height_in=48.0,
    )

    fake_frappe = SimpleNamespace(
        get_roles=lambda: ["EE Dispatcher"],
        exists=lambda dt, val=None: True,
        get_doc=lambda dt, name=None: vehicle if dt == "Vehicle" else (booking if dt == "Event Booking" else item),
        db=SimpleNamespace(commit=lambda: None),
        throw=lambda msg, exc=None: (_ for _ in ()).throw((exc or Exception)(msg)),
    )

    monkeypatch.setattr(site_fit, "frappe", fake_frappe)

    res = site_fit.check_vehicle_load_balance("VAN-MINI", ["BK-1"])
    assert res["is_overloaded"] is True
    assert res["total_weight_lbs"] == 1200.0
    assert res["weight_pct"] == 120.0
