"""Phase 40 — Portal Premium Experience bootstrap and feature flag tests."""

from __future__ import annotations

import sys
from types import ModuleType, SimpleNamespace
import pytest


def _install_frappe_stub():
    m = sys.modules.get("frappe")
    if m is None or not hasattr(m, "whitelist"):
        m = ModuleType("frappe")
        m.whitelist = lambda *a, **k: (lambda f: f)
        m.PermissionError = type("PermissionError", (Exception,), {})
        m.ValidationError = type("ValidationError", (Exception,), {})
        m.throw = lambda message, exc=None: (_ for _ in ()).throw((exc or Exception)(message))
        m.get_roles = lambda *a, **k: ["EE Tenant Admin"]
        m.parse_json = lambda v: v if isinstance(v, dict) else {}
        m.session = SimpleNamespace(user="test@example.com")
        m.local = SimpleNamespace(site="test.entx.app", session=SimpleNamespace(data={"csrf_token": "token123"}))
        m.logger = lambda: SimpleNamespace(warning=lambda *_: None, error=lambda *_: None)
        m.db = SimpleNamespace()
        m.conf = {}
        m.sessions = SimpleNamespace(get_csrf_token=lambda: "token123")
        sys.modules["frappe"] = m
    return m


def test_portal_bootstrap_reflects_premium_ui_flag(monkeypatch):
    frappe = _install_frappe_stub()

    settings_store = {"premium_ui_enabled": 0}

    def fake_get_cached_doc(doctype, name=None):
        if doctype == "EE Portal Settings":
            return SimpleNamespace(
                brand_name="Test Entertainment",
                brand_logo=None,
                brand_color="#0f766e",
                brand_favicon=None,
                hide_product_chrome=0,
                white_label_mode="portals",
                premium_ui_enabled=settings_store.get("premium_ui_enabled", 0),
            )
        raise ValueError(f"Unknown doctype {doctype}")

    def fake_get_single_value(doctype, field):
        if doctype == "EE Portal Settings":
            return settings_store.get(field, 0)
        return None

    monkeypatch.setattr(frappe, "get_cached_doc", fake_get_cached_doc, raising=False)
    monkeypatch.setattr(frappe, "get_roles", lambda user: ["EE Tenant Admin"], raising=False)
    monkeypatch.setattr(frappe.db, "get_single_value", fake_get_single_value, raising=False)
    monkeypatch.setattr(frappe.db, "count", lambda *a, **k: 0, raising=False)
    monkeypatch.setattr(frappe.db, "get_value", lambda *a, **k: {"full_name": "Test User", "email": "test@example.com"}, raising=False)
    monkeypatch.setattr(frappe.db, "get_default", lambda k: "Test Company", raising=False)

    from entertainment_express.www.portal_spa import portal_bootstrap

    # Initial state: premium_ui_enabled is 0
    boot_default = portal_bootstrap()
    assert boot_default["premium_ui_enabled"] == 0

    # Toggle to 1
    settings_store["premium_ui_enabled"] = 1
    boot_enabled = portal_bootstrap()
    assert boot_enabled["premium_ui_enabled"] == 1

    # Toggle back to 0
    settings_store["premium_ui_enabled"] = 0
    boot_disabled = portal_bootstrap()
    assert boot_disabled["premium_ui_enabled"] == 0
