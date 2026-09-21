"""Unit tests for media delivery guest galleries: upload booth media, PIN validation, ZIP compilation."""

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
    m.get_roles = lambda *a, **k: ["EE Crew"]
    m.session = SimpleNamespace(user="crew@test.com")
    m.throw = lambda message, exc=None: (_ for _ in ()).throw((exc or Exception)(message))
    m.db = SimpleNamespace(
        table_exists=lambda *_: True,
        exists=lambda *a, **k: True,
        get_value=lambda *a, **k: "GAL-1",
    )
    sys.modules["frappe"] = m
    sys.modules["frappe.utils"] = m.utils


_install_frappe_stub()

from entertainment_express.api import media_gallery  # noqa: E402


class _FakeDoc:
    def __init__(self, **kwargs):
        for k, v in kwargs.items():
            setattr(self, k, v)

    def insert(self, ignore_permissions=False):
        return self

    def save(self, ignore_permissions=False):
        return self


def test_get_guest_gallery_pin_required(monkeypatch):
    gal_doc = _FakeDoc(
        name="GAL-1",
        booking="BK-1",
        title="Prom 2026",
        published=1,
        share_token="tok-123",
        share_expires_on=None,
        pin_code="4829",
        print_count=10,
        session_count=5,
        template_name="",
    )

    fake_frappe = SimpleNamespace(
        db=SimpleNamespace(
            exists=lambda dt, name: True,
            get_value=lambda dt, filters, field=None: "GAL-1",
        ),
        get_doc=lambda dt, name: gal_doc,
        whitelist=lambda *a, **k: (lambda f: f),
        PermissionError=Exception,
        throw=lambda msg, exc=None: (_ for _ in ()).throw((exc or Exception)(msg)),
    )

    monkeypatch.setattr(media_gallery, "frappe", fake_frappe)

    res_blocked = media_gallery.get_guest_gallery("tok-123", pin="0000")
    assert res_blocked["pin_required"] is True
    assert res_blocked["items"] == []

    res_unlocked = media_gallery.get_guest_gallery("tok-123", pin="4829")
    assert res_unlocked["pin_required"] is False
    assert res_unlocked["id"] == "GAL-1"


def test_compile_gallery_zip(monkeypatch):
    gal_doc = _FakeDoc(
        name="GAL-1",
        booking="BK-1",
        title="Prom 2026",
        session_count=12,
    )

    fake_frappe = SimpleNamespace(
        get_doc=lambda dt, name: gal_doc,
        whitelist=lambda *a, **k: (lambda f: f),
        get_roles=lambda: ["EE Customer"],
    )

    monkeypatch.setattr(media_gallery, "frappe", fake_frappe)
    monkeypatch.setattr(media_gallery, "_require_member", lambda b: None)

    zip_info = media_gallery.compile_gallery_zip("GAL-1")
    assert zip_info["gallery_id"] == "GAL-1"
    assert zip_info["status"] == "ready"
    assert "download_url" in zip_info
