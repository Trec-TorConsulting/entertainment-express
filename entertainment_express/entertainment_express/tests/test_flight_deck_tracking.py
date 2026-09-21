"""Unit tests for operator trust vault flight deck: milestone transitions, geofence auto-cutoff, and privacy data purging."""

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
    m.get_roles = lambda *a, **k: ["EE Dispatcher"]
    m.session = SimpleNamespace(user="staff@test.com")
    m.throw = lambda message, exc=None: (_ for _ in ()).throw((exc or Exception)(message))
    m.db = SimpleNamespace(
        table_exists=lambda *_: True,
        exists=lambda *a, **k: True,
        set_value=lambda *a, **k: None,
    )
    sys.modules["frappe"] = m
    sys.modules["frappe.utils"] = m.utils


_install_frappe_stub()

from entertainment_express.api import tracking  # noqa: E402


class _FakeBooking:
    def __init__(self, name="BK-FLIGHT-01"):
        self.name = name
        self.event_name = "Austin Prom Gala 2026"
        self.ee_dispatch_status = "en_route"

    def db_set(self, field, value, update_modified=False):
        setattr(self, field, value)


def test_transition_event_milestone_and_privacy_purging(monkeypatch):
    booking = _FakeBooking("BK-FLIGHT-01")

    session_edits = []

    def fake_set_value(dt, name, values):
        session_edits.append((dt, name, values))

    fake_frappe = SimpleNamespace(
        get_doc=lambda dt, name: booking,
        get_roles=lambda: ["EE Dispatcher"],
        get_all=lambda dt, filters=None, pluck=None: ["SESH-100"],
        db=SimpleNamespace(
            table_exists=lambda dt: True,
            set_value=fake_set_value,
        ),
        whitelist=lambda *a, **k: (lambda f: f),
        throw=lambda msg, exc=None: (_ for _ in ()).throw((exc or Exception)(msg)),
    )

    monkeypatch.setattr(tracking, "frappe", fake_frappe)

    res = tracking.transition_event_milestone("BK-FLIGHT-01", "on_site")
    assert res["milestone"] == "on_site"
    assert res["privacy_scrubbed"] is True
    assert booking.ee_dispatch_status == "on_site"
    assert len(session_edits) == 1
    assert session_edits[0][2]["last_lat"] is None
    assert session_edits[0][2]["last_lng"] is None


def test_invalid_milestone_rejection(monkeypatch):
    fake_frappe = SimpleNamespace(
        throw=lambda msg, exc=None: (_ for _ in ()).throw((exc or Exception)(msg)),
    )
    monkeypatch.setattr(tracking, "frappe", fake_frappe)

    with pytest.raises(Exception):
        tracking.transition_event_milestone("BK-1", "invalid_milestone")
