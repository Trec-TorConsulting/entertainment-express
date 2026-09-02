"""Phase 10 — canned KPIs, guest 403, no tenant args, fleet isolation."""

from __future__ import annotations

import inspect
from pathlib import Path
from types import SimpleNamespace

import pytest

from entertainment_express.api import control_analytics, portal_reports


class _Perm(Exception):
    pass


class _Fake:
    PermissionError = _Perm

    def __init__(self, roles, user="owner@test.local"):
        self._roles = roles
        self.session = SimpleNamespace(user=user)
        self.PermissionError = _Perm
        self.db = SimpleNamespace(
            get_value=lambda *a, **k: None,
            exists=lambda *a, **k: False,
            table_exists=lambda *_: True,
            count=lambda *a, **k: 0,
            get_default=lambda *_: "USD",
        )
        self.utils = SimpleNamespace(get_url=lambda: "https://acme.test")

    def get_roles(self, user=None):
        return self._roles

    def throw(self, message, exc=None):
        raise (exc or Exception)(message)

    def get_all(self, *a, **k):
        return []

    def get_doc(self, *a, **k):
        return SimpleNamespace()

    def get_meta(self, *a, **k):
        return SimpleNamespace(has_field=lambda *_: False)


def test_guest_denied_reports_and_schedules(monkeypatch):
    fake = _Fake(["EE Event Guest"], user="guest@test.local")
    monkeypatch.setattr(portal_reports, "frappe", fake)
    with pytest.raises(_Perm):
        portal_reports.owner_pack()
    with pytest.raises(_Perm):
        portal_reports.save_schedule("Weekly", "a@b.c")
    with pytest.raises(_Perm):
        portal_reports.employee_pack()


def test_crew_denied_owner_pack(monkeypatch):
    fake = _Fake(["EE Crew"], user="crew@test.local")
    monkeypatch.setattr(portal_reports, "frappe", fake)
    with pytest.raises(_Perm):
        portal_reports.owner_pack()


def test_no_tenant_or_site_args():
    for fn in (
        portal_reports.owner_pack,
        portal_reports.save_schedule,
        portal_reports.client_money_summary,
        control_analytics.fleet,
    ):
        names = inspect.signature(fn).parameters
        assert "tenant" not in names
        assert "site" not in names


def test_owner_pack_formats_money():
    src = inspect.getsource(portal_reports._owner_snapshot) + inspect.getsource(portal_reports._money)
    assert "flt(" in src
    assert "fmt_money" in src


def test_fleet_stays_on_this_site():
    src = inspect.getsource(control_analytics.fleet) + inspect.getsource(control_analytics._require_ops)
    assert "frappe.connect" not in src
    assert "frappe.init" not in src
    assert "get_site" not in src


def test_guest_denied_fleet(monkeypatch):
    fake = _Fake(["EE Event Guest"], user="guest@test.local")
    monkeypatch.setattr(control_analytics, "frappe", fake)
    with pytest.raises(_Perm):
        control_analytics.fleet()


def test_owner_reports_not_desk():
    app = Path(__file__).resolve().parents[3] / "frontend" / "owner-portal" / "src" / "App.tsx"
    chunk = app.read_text(encoding="utf-8").split("function ReportsWorkspace")[1].split("function PlacesWorkspace")[0]
    assert "/app" not in chunk
    assert "EE Report Schedule" not in chunk
    assert "Email me each Monday" in chunk
    assert "Sales Invoice" not in chunk
