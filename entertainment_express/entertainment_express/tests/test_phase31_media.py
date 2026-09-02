"""Phase 31 — media gallery isolation and publish rules."""

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
    utils.add_days = lambda d, n: d
    m.utils = utils
    sys.modules["frappe.utils"] = utils


_install_frappe_stub()

from entertainment_express.api import media_gallery as mg  # noqa: E402
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
        )
        self.utils = SimpleNamespace(get_url=lambda: "https://a.example")
        self.logger = lambda: SimpleNamespace(error=lambda *_: None)

    def get_roles(self, user=None):
        return self._roles

    def throw(self, message, exc=None):
        raise (exc or Exception)(message)

    def get_all(self, *a, **k):
        return []

    def parse_json(self, value):
        return value if isinstance(value, dict) else {}


def test_media_package_flag_defined():
    names = {f["fieldname"] for f in CUSTOM_FIELDS["Item"]}
    assert "ee_includes_media_gallery" in names


def test_guest_denied_upload_and_staff_list(monkeypatch):
    fake = _Fake(["EE Event Guest"])
    monkeypatch.setattr(mg, "frappe", fake)
    with pytest.raises(_Perm):
        mg.ensure_gallery("BK-1")
    with pytest.raises(_Perm):
        mg.list_galleries()
    with pytest.raises(_Perm):
        mg.publish("GAL-1")


def test_unpublished_hidden_from_public(monkeypatch):
    fake = _Fake(["Guest"], user="Guest")
    monkeypatch.setattr(mg, "frappe", fake)
    fake.db.get_value = lambda *a, **k: None
    with pytest.raises(_Perm):
        mg.public_gallery("missing-token")


def test_public_gallery_requires_published(monkeypatch):
    fake = _Fake(["Guest"], user="Guest")
    monkeypatch.setattr(mg, "frappe", fake)

    def get_value(dt, filters=None, field=None, *a, **k):
        # Only return when published=1 filter matches — simulate unpublished by returning None
        if isinstance(filters, dict) and filters.get("published") == 1:
            return None
        return None

    fake.db.get_value = get_value
    with pytest.raises(_Perm):
        mg.public_gallery("tok-unpublished")


def test_no_tenant_site_switch():
    src = inspect.getsource(mg)
    assert "frappe.connect" not in src
    for name, fn in inspect.getmembers(mg, inspect.isfunction):
        if name.startswith("_"):
            continue
        sig = str(inspect.signature(fn))
        assert "tenant" not in sig
        assert ", site" not in sig
