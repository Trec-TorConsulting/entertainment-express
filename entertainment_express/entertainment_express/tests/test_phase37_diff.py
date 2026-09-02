"""Phase 37 — category differentiators entitlements & overflow PII guard."""

from __future__ import annotations

import inspect
import sys
from types import ModuleType, SimpleNamespace

import pytest


def _install_frappe_stub() -> None:
    m = sys.modules.get("frappe")
    if m is None or not hasattr(m, "whitelist"):
        m = ModuleType("frappe")
        m.whitelist = lambda *a, **k: (lambda f: f)
        m.PermissionError = type("PermissionError", (Exception,), {})
        m.ValidationError = type("ValidationError", (Exception,), {})
        m.throw = lambda message, exc=None: (_ for _ in ()).throw((exc or Exception)(message))
        m.get_roles = lambda *a, **k: []
        m.parse_json = lambda v: v if isinstance(v, dict) else {}
        m.session = SimpleNamespace(user="Administrator")
        m.local = SimpleNamespace(site="a.example")
        m.logger = lambda: SimpleNamespace(error=lambda *_: None)
        m.db = SimpleNamespace()
        sys.modules["frappe"] = m
        sys.modules["frappe.model"] = ModuleType("frappe.model")
        sys.modules["frappe.model.document"] = ModuleType("frappe.model.document")
        sys.modules["frappe.model.document"].Document = type("Document", (), {})
    utils = ModuleType("frappe.utils")
    utils.cint = lambda x, *a, **k: int(float(x or 0))
    utils.flt = lambda x, *a, **k: float(x or 0)
    utils.fmt_money = lambda x, *a, **k: str(x)
    utils.nowdate = lambda: "2026-09-02"
    utils.now_datetime = lambda: "2026-09-02 12:00:00"
    utils.get_url = lambda: "https://a.example"
    m.utils = utils
    sys.modules["frappe.utils"] = utils


_install_frappe_stub()

from entertainment_express.api import differentiators as diff  # noqa: E402


class _Perm(Exception):
    pass


class _Fake:
    PermissionError = _Perm

    def __init__(self, roles, flags=None):
        self._roles = roles
        self._flags = flags or {}
        self.PermissionError = _Perm
        self.session = SimpleNamespace(user="u@test.local")
        self.local = SimpleNamespace(site="a.example")
        self.db = SimpleNamespace(
            get_single_value=lambda *a, **k: __import__("json").dumps(self._flags),
            get_value=lambda *a, **k: None,
            count=lambda *a, **k: 0,
            exists=lambda *a, **k: False,
        )
        self.utils = SimpleNamespace(get_url=lambda: "https://a.example")

    def get_roles(self, user=None):
        return self._roles

    def throw(self, message, exc=None):
        raise (exc or Exception)(message)

    def parse_json(self, value):
        if isinstance(value, dict):
            return value
        import json

        return json.loads(value or "{}")

    def get_doc(self, *a, **k):
        return SimpleNamespace(insert=lambda **kw: setattr(self, "_ins", 1) or None, name="X", save=lambda **kw: None)


def test_guest_denied_money_surfaces(monkeypatch):
    fake = _Fake(["EE Event Guest"])
    monkeypatch.setattr(diff, "frappe", fake)
    with pytest.raises(_Perm):
        diff.offer_overflow("BK-1")
    with pytest.raises(_Perm):
        diff.event_day_copilot("BK-1")
    with pytest.raises(_Perm):
        diff.compute_ops_score("2026-01-01", "2026-01-31")


def test_entitlement_403(monkeypatch):
    fake = _Fake(["EE Tenant Admin"], flags={"diff_overflow": False})
    monkeypatch.setattr(diff, "frappe", fake)
    with pytest.raises(_Perm):
        diff.list_overflow_offers()


def test_overflow_rejects_email_in_notes(monkeypatch):
    fake = _Fake(["EE Tenant Admin"], flags={"diff_overflow": True})
    monkeypatch.setattr(diff, "frappe", fake)
    with pytest.raises(Exception):
        diff.offer_overflow("BK-1", notes_public="Call jane@example.com")


def test_copilot_confirm_before_money(monkeypatch):
    fake = _Fake(["EE Tenant Admin"], flags={"diff_copilot": True})
    monkeypatch.setattr(diff, "frappe", fake)
    out = diff.event_day_copilot("BK-1")
    assert out["confirm_before_money"] is True
    assert any(s.get("money") for s in out["suggestions"])


def test_no_tenant_connect():
    src = inspect.getsource(diff)
    assert "frappe.connect" not in src
