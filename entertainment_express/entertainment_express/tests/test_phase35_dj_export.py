"""Phase 35 — DJ software export (metadata only)."""

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
    m.utils = utils
    sys.modules["frappe.utils"] = utils


_install_frappe_stub()

from entertainment_express.api import music_export as mx  # noqa: E402


class _Perm(Exception):
    pass


class _Fake:
    PermissionError = _Perm

    def __init__(self, roles):
        self._roles = roles
        self.session = SimpleNamespace(user="u@test.local")
        self.PermissionError = _Perm
        self.db = SimpleNamespace(
            exists=lambda *a, **k: True,
            get_value=lambda *a, **k: None,
        )

    def get_roles(self, user=None):
        return self._roles

    def throw(self, message, exc=None):
        raise (exc or Exception)(message)

    def get_all(self, *a, **k):
        return [
            {"song": "Artist - Title", "category": "must_play", "moment": "", "free_text": "", "notes": "", "status": "open", "name": "1"},
        ]

    def get_doc(self, *a, **k):
        return SimpleNamespace(insert=lambda **kw: None)


def test_guest_403(monkeypatch):
    fake = _Fake(["EE Event Guest"])
    monkeypatch.setattr(mx, "frappe", fake)
    with pytest.raises(_Perm):
        mx.export_playlist("BK-1", "serato_csv")


def test_format_smoke():
    rows = [{"song": "DJ - Track", "category": "must_play", "moment": "first dance", "free_text": "", "notes": "bpm 120"}]
    csv = mx.export_serato_csv(rows)
    assert "Track" in csv and "DJ" in csv
    xml = mx.export_rekordbox_xml(rows)
    assert "DJ_PLAYLISTS" in xml and "Track" in xml
    m3u = mx.export_m3u(rows)
    assert m3u.startswith("#EXTM3U")
    assert "http://" not in m3u and ".mp3" not in m3u


def test_no_audio_leakage():
    src = inspect.getsource(mx)
    assert "audio" not in src.lower() or "content_type" in src
    assert ".mp3" not in src
    assert "frappe.connect" not in src
