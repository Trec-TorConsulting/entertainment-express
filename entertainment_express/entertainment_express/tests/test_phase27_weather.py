"""Phase 27 — weather / outdoor risk: isolation, unknown provider, rain-date conflict."""

from __future__ import annotations

import sys
from pathlib import Path
from types import ModuleType, SimpleNamespace
from unittest.mock import MagicMock

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
    m.utils.add_to_date = lambda *a, **k: None
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

from entertainment_express.api import weather as weather_api  # noqa: E402
from entertainment_express.setup.custom_fields import CUSTOM_FIELDS  # noqa: E402
from entertainment_express.weather import provider as weather_provider  # noqa: E402


class _Perm(Exception):
    pass


class _Fake:
    PermissionError = _Perm
    ValidationError = Exception

    def __init__(self, roles, user="u@test.local"):
        self._roles = roles
        self.session = SimpleNamespace(user=user)
        self.PermissionError = _Perm
        self.ValidationError = Exception
        self.db = SimpleNamespace(
            get_value=lambda *a, **k: None,
            exists=lambda *a, **k: False,
            table_exists=lambda *_: True,
            set_value=lambda *a, **k: None,
            commit=lambda: None,
        )
        self.utils = SimpleNamespace(get_url=lambda: "https://example.test")
        self.defaults = SimpleNamespace(get_global_default=lambda *_: "Demo Co")
        self.logger = lambda: SimpleNamespace(error=lambda *_: None)

    def get_roles(self, user=None):
        return self._roles

    def throw(self, message, exc=None):
        raise (exc or Exception)(message)

    def get_all(self, *a, **k):
        return []

    def parse_json(self, value):
        return value if isinstance(value, dict) else {}


def test_item_weather_fields_defined():
    names = {f["fieldname"] for f in CUSTOM_FIELDS["Item"]}
    assert {"ee_weather_sensitive", "ee_wind_mph_max", "ee_precip_inch_hours"} <= names


def test_evaluate_status_watch_warning_block():
    thresholds = {
        "wind_mph_max": 25,
        "precip_inch_hours": 0.25,
        "threshold_action": "warn",
        "lightning_policy": "warn",
    }
    assert weather_api.evaluate_status(10, 0, False, thresholds) == "clear"
    assert weather_api.evaluate_status(20, 0, False, thresholds) == "watch"
    assert weather_api.evaluate_status(26, 0, False, thresholds) == "warning"
    thresholds["threshold_action"] = "block"
    assert weather_api.evaluate_status(26, 0, False, thresholds) == "block"
    thresholds["lightning_policy"] = "block"
    assert weather_api.evaluate_status(0, 0, True, thresholds) == "block"


def test_unknown_provider_raises():
    with pytest.raises(weather_provider.WeatherProviderError):
        weather_provider.fetch_forecast(
            40.0, -75.0, "2026-09-10T12:00", "2026-09-10T16:00", provider="nope"
        )


def test_guest_denied_accept_and_offer(monkeypatch):
    fake = _Fake(["EE Event Guest"])
    monkeypatch.setattr(weather_api, "frappe", fake)
    with pytest.raises(_Perm):
        weather_api.accept_rain_date(offer="OFFER-1")
    with pytest.raises(_Perm):
        weather_api.offer_rain_date(booking="BK-1", candidate_start="2026-09-12 12:00:00")
    with pytest.raises(_Perm):
        weather_api.get_policy()
    with pytest.raises(_Perm):
        weather_api.booking_weather("BK-1")


def test_no_tenant_or_site_switch_in_weather_api():
    import inspect

    src = inspect.getsource(weather_api)
    assert "frappe.connect" not in src
    assert "frappe.init" not in src
    for name, fn in inspect.getmembers(weather_api, inspect.isfunction):
        if name.startswith("_"):
            continue
        sig = str(inspect.signature(fn))
        assert "tenant" not in sig
        assert "site" not in sig


def test_offer_rain_date_rejects_conflict(monkeypatch):
    fake = _Fake(["EE Tenant Admin"])
    booking = SimpleNamespace(
        name="BK-1",
        status="confirmed",
        customer="CUST-1",
        contact=None,
        event_name="Bounce Party",
        event_date="2026-09-10",
        start_time="12:00:00",
        end_time="16:00:00",
        assigned_assets=[SimpleNamespace(asset="ASSET-1")],
    )
    fake.get_doc = lambda *a, **k: booking
    monkeypatch.setattr(weather_api, "frappe", fake)

    monkeypatch.setattr(
        "entertainment_express.booking.availability.check",
        lambda *a, **k: {"available": False, "reason": "conflict", "conflicts": ["BK-OTHER"]},
    )

    with pytest.raises(Exception):
        weather_api.offer_rain_date(booking="BK-1", candidate_start="2026-09-12 12:00:00")


def test_refresh_one_booking_unknown_on_provider_failure(monkeypatch):
    fake = _Fake(["EE Tenant Admin"])
    booking = SimpleNamespace(
        name="BK-1",
        weather_sensitive=1,
        weather_status="",
        venue_geo="40.0,-75.0",
        venue=None,
        event_date="2026-09-10",
        start_time="12:00:00",
        end_time="16:00:00",
        customer="CUST-1",
        contact=None,
        event_name="Party",
        assigned_assets=[],
        service_items=[],
        db_set=MagicMock(),
    )
    policy = SimpleNamespace(
        enabled=1,
        provider="open_meteo",
        wind_mph_max=25,
        precip_inch_hours=0.25,
        threshold_action="warn",
        lightning_policy="warn",
        auto_offer_rain_date=0,
    )
    inserted = []

    def get_doc_side(*a, **k):
        if a and isinstance(a[0], dict):
            payload = a[0]
            return SimpleNamespace(**payload, insert=lambda **kw: inserted.append(payload))
        return booking

    fake.get_doc = get_doc_side
    fake.get_single = lambda *a, **k: policy
    monkeypatch.setattr(weather_api, "frappe", fake)
    monkeypatch.setattr(weather_api, "booking_is_weather_sensitive", lambda *_: True)
    monkeypatch.setattr(
        "entertainment_express.weather.provider.fetch_forecast",
        lambda *a, **k: (_ for _ in ()).throw(weather_provider.WeatherProviderError("down")),
    )

    result = weather_api.refresh_one_booking("BK-1", policy=policy)
    assert result["status"] == "unknown"
    booking.db_set.assert_called()
    assert booking.db_set.call_args[0][0] == "weather_status"
    assert booking.db_set.call_args[0][1] == "unknown"


def test_modules_txt_includes_weather():
    modules = Path(__file__).resolve().parents[1] / "modules.txt"
    assert "Weather" in modules.read_text()
