"""Phase 39 — full-site white-label + brand style matcher."""

from __future__ import annotations

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
        m.parse_json = lambda v: v if isinstance(v, dict) else ({} if not v else v)
        m.session = SimpleNamespace(user="Administrator")
        m.local = SimpleNamespace(site="a.example", response={}, request=SimpleNamespace(host="a.example", args={}))
        m.logger = lambda: SimpleNamespace(warning=lambda *_: None, error=lambda *_: None)
        m.db = SimpleNamespace()
        m.conf = {}
        m.cache = lambda: SimpleNamespace(_d={}, get_value=lambda k: None, set_value=lambda *a, **k: None)
        m.get_request_header = lambda *a, **k: ""
        m.request = SimpleNamespace(get_data=lambda as_text=False: b"")
        m.form_dict = {}
        sys.modules["frappe"] = m
        sys.modules["frappe.model"] = ModuleType("frappe.model")
        sys.modules["frappe.model.document"] = ModuleType("frappe.model.document")
        sys.modules["frappe.model.document"].Document = type("Document", (), {})
    utils = ModuleType("frappe.utils")
    utils.cint = lambda x, *a, **k: int(float(x or 0))
    utils.flt = lambda x, *a, **k: float(x or 0)
    utils.fmt_money = lambda x, *a, **k: str(x)
    utils.get_url = lambda *a, **k: "https://a.example"
    utils.nowdate = lambda: "2026-09-02"
    utils.now_datetime = lambda: "2026-09-02 00:00:00"
    utils.strip_html = lambda x: str(x)
    m.utils = utils
    sys.modules["frappe.utils"] = utils
    for name in (
        "frappe.installer",
        "entertainment_express.security",
        "entertainment_express.security.audit",
        "entertainment_express.security.access",
        "entertainment_express.integrations",
        "entertainment_express.integrations.credentials",
        "entertainment_express.control_plane",
        "entertainment_express.control_plane.lifecycle",
        "entertainment_express.control_plane.entitlements",
    ):
        if name not in sys.modules:
            sys.modules[name] = ModuleType(name)
    sys.modules["entertainment_express.security.access"].require_roles = lambda *a, **k: None
    sys.modules["entertainment_express.security.audit"].write = lambda *a, **k: None
    sys.modules["entertainment_express.integrations.credentials"].is_enabled = lambda *a, **k: False
    sys.modules["entertainment_express.control_plane.lifecycle"].automations_paused = lambda: False
    sys.modules["entertainment_express.control_plane.entitlements"].require_entitlement = lambda *a, **k: None
    sys.modules["entertainment_express.control_plane.entitlements"].is_control_plane = lambda: False


_install_frappe_stub()

from entertainment_express.api import brand_style, portal_owner  # noqa: E402
from entertainment_express.white_label import kit as wl_kit  # noqa: E402
from entertainment_express.www import branding  # noqa: E402


class _Perm(Exception):
    pass


class _Fake:
    PermissionError = _Perm
    ValidationError = type("ValidationError", (Exception,), {})

    def __init__(self, roles, user="owner@test.local", site="acme.app.example", conf=None):
        self._roles = roles
        self.session = SimpleNamespace(user=user)
        self.local = SimpleNamespace(
            site=site,
            request=SimpleNamespace(path="/", method="GET", host=site, args={}),
            form_dict={},
            response={},
        )
        self.conf = conf if conf is not None else {}
        self._singles = {
            "brand_name": "Acme",
            "brand_color": "#0f766e",
            "brand_color_secondary": "",
            "brand_color_accent": "",
            "brand_color_bg": "",
            "brand_color_text": "",
            "font_heading": "system",
            "font_body": "system",
            "brand_logo": "/files/logo.png",
            "logo_dark": "",
            "brand_favicon": "",
            "og_image": "",
            "footer_text": "Acme Events",
            "white_label_mode": "full",
            "hide_product_chrome": 1,
            "email_from_name": "Acme Events",
            "primary_custom_domain": "",
        }
        self._cache = {}
        self.db = SimpleNamespace(
            exists=lambda *a, **k: True,
            get_single_value=lambda dt, field: self._singles.get(field),
            set_single_value=lambda dt, field, value: self._singles.__setitem__(field, value),
            get_value=lambda *a, **k: None,
            get_all=lambda *a, **k: [],
            commit=lambda: None,
            set_value=lambda *a, **k: None,
            table_exists=lambda *_: True,
            get_default=lambda *_: "Acme Co",
        )
        self.logger = lambda: SimpleNamespace(warning=lambda *a, **k: None)
        self.utils = SimpleNamespace(get_url=lambda: f"https://{site}", cint=lambda x: int(float(x or 0)))
        self.cache = lambda: SimpleNamespace(
            get_value=lambda k: self._cache.get(k),
            set_value=lambda k, v, expires_in_sec=None: self._cache.__setitem__(k, v),
        )

    def get_roles(self, user=None):
        return self._roles

    def throw(self, message, exc=None):
        raise (exc or Exception)(message)

    def parse_json(self, v):
        return v if isinstance(v, dict) else {}

    def get_doc(self, *a, **k):
        if a and isinstance(a[0], dict):
            data = a[0]
            return SimpleNamespace(
                insert=lambda ignore_permissions=False: None,
                save=lambda **kw: None,
                name="EE Portal Settings",
                **{k: v for k, v in data.items() if k != "doctype"},
            )
        return self.get_single()

    def get_cached_doc(self, *a, **k):
        return self.get_single()

    def get_single(self, *a, **k):
        ns = SimpleNamespace(**self._singles)
        def save(ignore_permissions=False):
            for k in self._singles:
                if hasattr(ns, k):
                    self._singles[k] = getattr(ns, k)
        ns.save = save
        return ns


def _patch(monkeypatch, fake):
    monkeypatch.setattr(brand_style, "frappe", fake)
    monkeypatch.setattr(portal_owner, "frappe", fake)
    monkeypatch.setattr(wl_kit, "skip_tenant_kit", lambda: False)
    import frappe as fr

    for name, value in (
        ("get_cached_doc", fake.get_cached_doc),
        ("get_single", fake.get_single),
        ("get_doc", fake.get_doc),
        ("get_roles", fake.get_roles),
        ("session", fake.session),
        ("local", fake.local),
        ("conf", fake.conf),
        ("cache", fake.cache),
        ("db", fake.db),
        ("throw", fake.throw),
        ("parse_json", fake.parse_json),
        ("PermissionError", fake.PermissionError),
        ("ValidationError", fake.ValidationError),
    ):
        monkeypatch.setattr(fr, name, value, raising=False)


def test_ssrf_private_url_denied(monkeypatch):
    fake = _Fake(roles=["EE Tenant Admin"])
    _patch(monkeypatch, fake)
    with pytest.raises(Exception):
        brand_style.validate_public_https_url("https://127.0.0.1/")
    with pytest.raises(Exception):
        brand_style.validate_public_https_url("http://example.com/")
    with pytest.raises(Exception):
        brand_style.match_style(website_url="https://localhost/admin")


def test_guest_cannot_match(monkeypatch):
    fake = _Fake(roles=["EE Event Guest", "Guest"], user="Guest")
    _patch(monkeypatch, fake)
    with pytest.raises(Exception):
        brand_style.match_style(website_url="https://example.com")


def test_apply_writes_settings(monkeypatch):
    fake = _Fake(roles=["EE Tenant Admin"])
    _patch(monkeypatch, fake)
    monkeypatch.setattr(portal_owner, "_require_owner", lambda: None)
    monkeypatch.setattr(portal_owner, "_audit", lambda *a, **k: None)
    out = brand_style.apply_brand_suggestion(
        {
            "colors": {"primary": "#112233", "secondary": "#445566", "accent": "#778899"},
            "fonts": {"heading": "georgia", "body": "lato"},
            "logo_url": "/files/new.png",
            "favicon_url": "/files/fav.ico",
            "white_label_mode": "full",
        }
    )
    assert out["ok"] is True
    assert fake._singles["brand_color"] == "#112233"
    assert fake._singles["brand_color_secondary"] == "#445566"
    assert fake._singles["font_heading"] == "georgia"
    assert fake._singles["white_label_mode"] == "full"
    assert fake._singles["hide_product_chrome"] == 1


def test_full_mode_hides_ee_on_public_context(monkeypatch):
    fake = _Fake(roles=["Guest"])
    _patch(monkeypatch, fake)
    monkeypatch.setattr(wl_kit, "effective_kit", lambda: dict(fake._singles))
    monkeypatch.setattr(wl_kit, "skip_tenant_kit", lambda: False)
    ctx = {}
    branding.update_website_context(ctx)
    assert ctx["brand_html"] == "Acme"
    assert ctx["footer_text"] == "Acme Events"
    assert ctx["white_label_mode"] == "full"
    assert "Entertainment Express" not in (ctx.get("brand_html") or "")
    assert "--ee-brand" in (ctx.get("head_html") or "")
    assert "ee-white-label.css" in (ctx.get("head_html") or "")


def test_control_plane_skips_tenant_kit(monkeypatch):
    fake = _Fake(roles=["Guest"], site="www.entx.app")
    fake.conf = {"ee_control_plane": 1}
    _patch(monkeypatch, fake)
    monkeypatch.setattr(wl_kit, "skip_tenant_kit", lambda: True)
    ctx = {"head_html": ""}
    branding.update_website_context(ctx)
    assert "ee-white-label.css" not in (ctx.get("head_html") or "")
    assert ctx.get("brand_html") is None


def test_email_wrapper_uses_kit():
    html = wl_kit.wrap_email_html(
        "<p>Hello</p>",
        {
            "white_label_mode": "full",
            "brand_name": "Acme",
            "brand_logo": "/files/logo.png",
            "footer_text": "Acme Events",
            "brand_color": "#0f766e",
        },
    )
    assert "Acme" in html
    assert "/files/logo.png" in html
    assert "Acme Events" in html
    assert "Entertainment Express" not in html


def test_brand_host_overrides_company_kit(monkeypatch):
    kit = {
        "brand_name": "Company",
        "brand_color": "#111111",
        "brand_logo": "/files/co.png",
        "email_from_name": "Company",
        "primary_custom_domain": "book.company.com",
    }

    class Local:
        request = SimpleNamespace(host="brand.events.com")

    import frappe as fr

    monkeypatch.setattr(fr, "local", Local(), raising=False)
    monkeypatch.setattr(
        "entertainment_express.white_label.urls.default_site_host",
        lambda: "acme.app.example",
    )
    monkeypatch.setattr(
        "entertainment_express.api.brand.resolve_brand",
        lambda host=None, path=None: {
            "name": "BRAND-1",
            "brand_name": "Brand Host",
            "logo": "/files/brand.png",
            "primary_color": "#abcdef",
            "email_from": "Brand Host",
        },
    )
    monkeypatch.setattr(
        fr,
        "db",
        SimpleNamespace(get_value=lambda *a, **k: "brand.events.com"),
        raising=False,
    )
    out = wl_kit.apply_brand_host_overrides(dict(kit))
    assert out["brand_name"] == "Brand Host"
    assert out["brand_color"] == "#abcdef"
    # Primary domain keeps company kit
    fr.local.request = SimpleNamespace(host="book.company.com")
    out2 = wl_kit.apply_brand_host_overrides(dict(kit))
    assert out2["brand_name"] == "Company"


def test_css_variables_emit_extended_tokens():
    css = wl_kit.css_variables(
        {
            "brand_color": "#111111",
            "brand_color_secondary": "#222222",
            "brand_color_accent": "#333333",
            "brand_color_bg": "#fafafa",
            "brand_color_text": "#101010",
            "font_heading": "georgia",
            "font_body": "lato",
        }
    )
    assert "--ee-brand:#111111" in css
    assert "--ee-brand-2:#222222" in css
    assert "--ee-accent:#333333" in css
    assert "--ee-bg:#fafafa" in css
    assert "--ee-font-display:" in css
