"""Phase 36 — competitor migration presets."""

from __future__ import annotations

import inspect
import sys
from pathlib import Path
from types import ModuleType, SimpleNamespace

import pytest


def _install_frappe_stub() -> None:
    m = sys.modules.get("frappe")
    if m is None or not hasattr(m, "whitelist"):
        m = ModuleType("frappe")
        m.whitelist = lambda *a, **k: (lambda f: f)
        m.PermissionError = type("PermissionError", (Exception,), {})
        m.throw = lambda message, exc=None: (_ for _ in ()).throw((exc or Exception)(message))
        m.get_roles = lambda *a, **k: []
        m.session = SimpleNamespace(user="Administrator")
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
    m.utils = utils
    sys.modules["frappe.utils"] = utils


_install_frappe_stub()

from entertainment_express.api import migration as mig  # noqa: E402
from entertainment_express.api.migration_presets import PRESETS, load_json_presets  # noqa: E402


class _Perm(Exception):
    pass


class _Fake:
    PermissionError = _Perm

    def __init__(self, roles):
        self._roles = roles
        self.PermissionError = _Perm

    def get_roles(self, user=None):
        return self._roles

    def throw(self, message, exc=None):
        raise (exc or Exception)(message)


def test_competitor_presets_present():
    for key in ("io", "ers", "bcn", "goodshuffle", "djep", "dji"):
        assert key in PRESETS
        assert "customers" in PRESETS[key] or "bookings" in PRESETS[key]


def test_json_presets_on_disk():
    root = Path(__file__).resolve().parents[1] / "data_migration" / "presets"
    for key in ("io", "ers", "bcn", "goodshuffle", "djep", "dji"):
        assert (root / f"{key}.json").is_file()
    merged = load_json_presets()
    assert "io" in merged


def test_guest_denied_list(monkeypatch):
    fake = _Fake(["EE Event Guest"])
    monkeypatch.setattr(mig, "frappe", fake)
    with pytest.raises(_Perm):
        mig.list_presets()


def test_dry_run_default_in_start_import():
    src = inspect.getsource(mig.start_import)
    assert "dry_run" in src
    assert "frappe.connect" not in inspect.getsource(mig)
