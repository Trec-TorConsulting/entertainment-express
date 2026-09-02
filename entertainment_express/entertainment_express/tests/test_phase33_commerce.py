"""Phase 33 — commerce gift card / store credit guards."""

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
    utils.getdate = lambda x: x
    utils.nowdate = lambda: "2026-09-02"
    utils.now_datetime = lambda: "2026-09-02 12:00:00"
    m.utils = utils
    sys.modules["frappe.utils"] = utils


_install_frappe_stub()

from entertainment_express.api import commerce as com  # noqa: E402
from entertainment_express.setup.custom_fields import CUSTOM_FIELDS  # noqa: E402


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
        )
        self.defaults = SimpleNamespace(get_global_default=lambda *_: "USD")
        self.logger = lambda: SimpleNamespace(error=lambda *_: None)

    def get_roles(self, user=None):
        return self._roles

    def throw(self, message, exc=None):
        raise (exc or Exception)(message)

    def get_all(self, *a, **k):
        return []


def test_terms_and_po_fields_defined():
    cust = {f["fieldname"] for f in CUSTOM_FIELDS["Customer"]}
    assert "ee_payment_terms" in cust
    quote = {f["fieldname"] for f in CUSTOM_FIELDS["Quotation"]}
    assert "po_number" in quote
    inv = {f["fieldname"] for f in CUSTOM_FIELDS["Sales Invoice"]}
    assert "ee_late_fee_applied" in inv


def test_guest_403_redeem(monkeypatch):
    fake = _Fake(["EE Event Guest"])
    monkeypatch.setattr(com, "frappe", fake)
    with pytest.raises(_Perm):
        com.redeem_gift_card("ABCD1234")
    with pytest.raises(_Perm):
        com.issue_gift_card(50)
    with pytest.raises(_Perm):
        com.apply_store_credit("CUST-1", 10)


def test_double_redeem_blocked(monkeypatch):
    fake = _Fake(["EE Tenant Admin"])
    monkeypatch.setattr(com, "frappe", fake)
    card = SimpleNamespace(status="redeemed", balance=0, expires_on=None, code="X", name="GC1", save=lambda **k: None)
    fake.db.get_value = lambda *a, **k: "GC1"
    fake.get_doc = lambda *a, **k: card
    with pytest.raises(Exception):
        com.redeem_gift_card("X")


def test_no_tenant_args():
    src = inspect.getsource(com)
    assert "frappe.connect" not in src
    assert "tenant=" not in src
