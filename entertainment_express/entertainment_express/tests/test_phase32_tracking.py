"""Phase 32 — live ETA tracking rules."""

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
        m.local = SimpleNamespace(site="a.example", response={})
        m.logger = lambda: SimpleNamespace(error=lambda *_: None)
        m.db = SimpleNamespace()
        m.defaults = SimpleNamespace(get_global_default=lambda *_: "USD")
        sys.modules["frappe"] = m
        sys.modules["frappe.model"] = ModuleType("frappe.model")
        sys.modules["frappe.model.document"] = ModuleType("frappe.model.document")
        sys.modules["frappe.model.document"].Document = type("Document", (), {})
    utils = ModuleType("frappe.utils")
    utils.cint = lambda x, *a, **k: int(float(x or 0))
    utils.flt = lambda x, *a, **k: float(x or 0)
    utils.fmt_money = lambda x, *a, **k: str(x)
    utils.get_datetime = lambda x: x
    utils.now_datetime = lambda: "2026-09-02 12:00:00"
    utils.get_url = lambda: "https://a.example"
    m.utils = utils
    sys.modules["frappe.utils"] = utils


_install_frappe_stub()

from entertainment_express.api import tracking as tr  # noqa: E402


class _Perm(Exception):
    pass


class _Val(Exception):
    pass


class _Fake:
    PermissionError = _Perm
    ValidationError = _Val

    def __init__(self, roles, user="u@test.local"):
        self._roles = roles
        self.session = SimpleNamespace(user=user)
        self.PermissionError = _Perm
        self.ValidationError = _Val
        self.db = SimpleNamespace(
            get_value=lambda *a, **k: None,
            exists=lambda *a, **k: False,
            table_exists=lambda *_: True,
            set_value=lambda *a, **k: None,
            commit=lambda: None,
        )
        self.utils = SimpleNamespace(get_url=lambda: "https://a.example")
        self.logger = lambda: SimpleNamespace(error=lambda *_: None)

    def get_roles(self, user=None):
        return self._roles

    def throw(self, message, exc=None):
        raise (exc or Exception)(message)

    def get_doc(self, *a, **k):
        raise Exception("no doc")


def test_guest_denied_client_tracking(monkeypatch):
    fake = _Fake(["EE Event Guest"])
    monkeypatch.setattr(tr, "frappe", fake)
    with pytest.raises(_Perm):
        tr.client_tracking("BK-1")


def test_ping_rejected_when_ended(monkeypatch):
    fake = _Fake(["EE Crew"])
    monkeypatch.setattr(tr, "frappe", fake)
    ended = SimpleNamespace(status="ended", booking="BK-1", name="S1")
    fake.get_doc = lambda *a, **k: ended
    with pytest.raises(_Val):
        tr.ping(session="S1", latitude=1, longitude=2)


def test_public_token_missing(monkeypatch):
    fake = _Fake(["Guest"], user="Guest")
    monkeypatch.setattr(tr, "frappe", fake)
    with pytest.raises(_Perm):
        tr.public_tracking("")
    with pytest.raises(_Perm):
        tr.public_tracking("bad-token")


def test_no_tenant_site_switch():
    src = inspect.getsource(tr)
    assert "frappe.connect" not in src
    assert "tenant=" not in src
