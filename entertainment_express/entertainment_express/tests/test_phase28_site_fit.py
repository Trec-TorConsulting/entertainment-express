"""Phase 28 — site fit, delivery windows, load weight: isolation + engine tests."""

from __future__ import annotations

import inspect
import sys
from types import ModuleType, SimpleNamespace

import pytest


def _install_frappe_stub() -> None:
    if "frappe" in sys.modules and hasattr(sys.modules["frappe"], "whitelist"):
        return
    m = ModuleType("frappe")
    m.whitelist = lambda *a, **k: (lambda f: f)
    m.PermissionError = type("PermissionError", (Exception,), {})
    m.ValidationError = type("ValidationError", (Exception,), {})
    m.utils = ModuleType("frappe.utils")
    m.utils.cint = lambda x, *a, **k: int(float(x or 0))
    m.utils.flt = lambda x, *a, **k: float(x or 0)
    m.utils.fmt_money = lambda x, *a, **k: str(x)
    m.utils.get_datetime = lambda x: x
    m.utils.now_datetime = lambda: None
    m.utils.getdate = lambda x: x
    m.utils.get_time = lambda x: x
    m.utils.get_url = lambda: "https://example.test"
    m.utils.nowdate = lambda: "2026-09-02"
    m.defaults = SimpleNamespace(get_global_default=lambda *_: "Demo Co")
    m.db = SimpleNamespace()
    m.session = SimpleNamespace(user="Administrator")
    m.logger = lambda: SimpleNamespace(error=lambda *_: None, warning=lambda *_: None)
    m.throw = lambda message, exc=None: (_ for _ in ()).throw((exc or Exception)(message))
    m.get_roles = lambda *a, **k: []
    m.parse_json = lambda v: v if isinstance(v, dict) else {}
    sys.modules["frappe"] = m
    sys.modules["frappe.utils"] = m.utils
    sys.modules["frappe.model"] = ModuleType("frappe.model")
    sys.modules["frappe.model.document"] = ModuleType("frappe.model.document")
    sys.modules["frappe.model.document"].Document = type("Document", (), {})


_install_frappe_stub()

from entertainment_express.api import load_plan, site_fit  # noqa: E402
from entertainment_express.setup.custom_fields import CUSTOM_FIELDS  # noqa: E402


class _Perm(Exception):
    pass


class _Fake:
    PermissionError = _Perm

    def __init__(self, roles, user="u@test.local"):
        self._roles = roles
        self.session = SimpleNamespace(user=user)
        self.PermissionError = _Perm
        self.db = SimpleNamespace(
            get_value=lambda *a, **k: None,
            exists=lambda *a, **k: False,
            table_exists=lambda *_: True,
            set_value=lambda *a, **k: None,
            commit=lambda: None,
        )

    def get_roles(self, user=None):
        return self._roles

    def throw(self, message, exc=None):
        raise (exc or Exception)(message)

    def get_all(self, *a, **k):
        return []

    def parse_json(self, value):
        return value if isinstance(value, dict) else {}

    def get_single(self, *a, **k):
        return SimpleNamespace(
            enabled=1,
            unfit_action="block",
            overweight_action="warn",
            require_client_site_answers=1,
        )


def test_item_fulfillment_and_site_fit_fields():
    names = {f["fieldname"] for f in CUSTOM_FIELDS["Item"]}
    assert "ee_fulfillment_mode" in names
    assert "ee_site_fit_requirements" in names


def test_guest_denied_site_fit_and_load(monkeypatch):
    fake = _Fake(["EE Event Guest"])
    monkeypatch.setattr(site_fit, "frappe", fake)
    monkeypatch.setattr(load_plan, "frappe", fake)
    with pytest.raises(_Perm):
        site_fit.get_config()
    with pytest.raises(_Perm):
        site_fit.evaluate("BK-1")
    with pytest.raises(_Perm):
        load_plan.evaluate("BK-1")
    with pytest.raises(_Perm):
        site_fit.save_site_answers("BK-1", {"sq_ft": 100})


def test_no_tenant_site_switch():
    for mod in (site_fit, load_plan):
        src = inspect.getsource(mod)
        assert "frappe.connect" not in src
        assert "frappe.init" not in src
        for name, fn in inspect.getmembers(mod, inspect.isfunction):
            if name.startswith("_"):
                continue
            sig = str(inspect.signature(fn))
            assert "tenant" not in sig
            assert "site" not in sig


def test_evaluate_site_fit_blocks_low_clearance(monkeypatch):
    fake = _Fake(["EE Tenant Admin"])
    monkeypatch.setattr(site_fit, "frappe", fake)
    monkeypatch.setattr(
        site_fit,
        "_config",
        lambda: {"enabled": 1, "unfit_action": "block", "overweight_action": "warn", "require_client_site_answers": 1},
    )
    monkeypatch.setattr(
        site_fit,
        "_item_requirements",
        lambda *_: [
            {
                "item": "BOUNCE",
                "min_sq_ft": 400,
                "surfaces": {"lawn"},
                "power_amps": 0,
                "clearance_ft": 14,
                "water_required": 0,
                "fulfillment_mode": "drop_off",
            }
        ],
    )
    booking = SimpleNamespace(
        service_items=[SimpleNamespace(item="BOUNCE")],
        site_sq_ft=500,
        site_surface="lawn",
        site_power_amps=20,
        site_clearance_ft=10,
        site_water_available=0,
        venue=None,
    )
    result = site_fit.evaluate_site_fit(booking=booking)
    assert result["status"] == "block"
    assert any(u["field"] == "clearance_ft" for u in result["unmet"])


def test_fulfillment_attended_requires_crew(monkeypatch):
    fake = _Fake(["EE Tenant Admin"])

    def get_value(dt, name, field=None, *a, **k):
        if field == "ee_fulfillment_mode":
            return "attended" if name == "DJ" else "drop_off"
        if field == "ee_requires_crew_role":
            return None
        return None

    fake.db.get_value = get_value
    monkeypatch.setattr(site_fit, "frappe", fake)
    booking = SimpleNamespace(service_items=[SimpleNamespace(item="DJ"), SimpleNamespace(item="BOUNCE")])
    assert site_fit.fulfillment_crew_required(booking)["requires_crew"] is True
    booking2 = SimpleNamespace(service_items=[SimpleNamespace(item="BOUNCE")])
    assert site_fit.fulfillment_crew_required(booking2)["requires_crew"] is False


def test_overweight_warn_by_default(monkeypatch):
    fake = _Fake(["EE Tenant Admin"])
    booking = SimpleNamespace(
        assigned_assets=[
            SimpleNamespace(asset="A1", asset_name="Castle", quantity_reserved=1),
            SimpleNamespace(asset="A2", asset_name="Slide", quantity_reserved=1),
        ]
    )
    fake.get_doc = lambda *a, **k: booking

    def get_value(dt, name, field=None, *a, **k):
        if dt == "Service Asset" and field == "shipping_weight_lb":
            return 800 if name == "A1" else 700
        if dt == "Service Asset" and field == "asset_name":
            return name
        if dt == "Vehicle Assignment":
            return "VEH-1"
        if dt == "Vehicle":
            if k.get("as_dict") or (isinstance(field, (list, tuple))):
                return SimpleNamespace(vehicle_name="Box", max_payload_lb=1000)
            return 1000
        return None

    fake.db.get_value = get_value
    fake.db.exists = lambda *a, **k: True
    monkeypatch.setattr(load_plan, "frappe", fake)
    monkeypatch.setattr(load_plan, "_overweight_action", lambda: "warn")
    result = load_plan.check_load("BK-1", vehicle="VEH-1")
    assert result["overweight"] is True
    assert result["status"] == "warn"
    assert result["total_weight_lb"] == 1500
