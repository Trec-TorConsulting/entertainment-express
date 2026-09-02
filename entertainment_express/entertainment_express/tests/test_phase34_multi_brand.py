"""Phase 34 — multi-brand catalog isolation."""

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
        sys.modules["frappe"] = m
        sys.modules["frappe.model"] = ModuleType("frappe.model")
        sys.modules["frappe.model.document"] = ModuleType("frappe.model.document")
        sys.modules["frappe.model.document"].Document = type("Document", (), {})
    utils = ModuleType("frappe.utils")
    utils.cint = lambda x, *a, **k: int(float(x or 0))
    utils.flt = lambda x, *a, **k: float(x or 0)
    utils.fmt_money = lambda x, *a, **k: str(x)
    m.utils = utils
    sys.modules["frappe.utils"] = utils


_install_frappe_stub()

from entertainment_express.api import brand as br  # noqa: E402
from entertainment_express.setup.custom_fields import CUSTOM_FIELDS  # noqa: E402


class _Perm(Exception):
    pass


class _Fake:
    PermissionError = _Perm

    def __init__(self, roles):
        self._roles = roles
        self.PermissionError = _Perm
        self.db = SimpleNamespace(
            table_exists=lambda *_: True,
            get_value=lambda *a, **k: None,
            exists=lambda *a, **k: False,
            get_single_value=lambda *a, **k: "",
            set_value=lambda *a, **k: None,
        )

    def get_roles(self, user=None):
        return self._roles

    def throw(self, message, exc=None):
        raise (exc or Exception)(message)

    def get_all(self, *a, **k):
        return []


def test_brand_field_on_item_and_booking():
    assert "ee_brand" in {f["fieldname"] for f in CUSTOM_FIELDS["Item"]}
    assert "ee_brand" in {f["fieldname"] for f in CUSTOM_FIELDS["Event Booking"]}


def test_guest_cannot_save_brand(monkeypatch):
    fake = _Fake(["EE Event Guest"])
    monkeypatch.setattr(br, "frappe", fake)
    with pytest.raises(_Perm):
        br.save_brand({"brand_name": "X", "slug": "x"})
    with pytest.raises(_Perm):
        br.list_brands()


def test_catalog_filters_non_default(monkeypatch):
    fake = _Fake(["Guest"])
    monkeypatch.setattr(br, "frappe", fake)
    brand_doc = SimpleNamespace(name="BR-B", is_default=0, brand_name="B", slug="b", logo="", primary_color="", email_from="", path_prefix="")
    fake.db.exists = lambda *a, **k: True
    fake.get_doc = lambda *a, **k: brand_doc
    captured = {}

    def get_all(dt, filters=None, **k):
        captured["filters"] = filters
        return [{"name": "ITEM-B", "ee_brand": "BR-B"}]

    fake.get_all = get_all
    rows = br.catalog_for_brand(brand="BR-B")
    assert captured["filters"].get("ee_brand") == "BR-B"
    assert rows[0]["name"] == "ITEM-B"


def test_no_cross_tenant_connect():
    src = inspect.getsource(br)
    assert "frappe.connect" not in src
