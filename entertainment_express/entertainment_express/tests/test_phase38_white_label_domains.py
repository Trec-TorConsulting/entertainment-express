"""Phase 38 — white-label + custom domains."""

from __future__ import annotations

import hashlib
import hmac
import inspect
import json
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
        m.logger = lambda: SimpleNamespace(warning=lambda *_: None, error=lambda *_: None)
        m.db = SimpleNamespace()
        m.conf = {}
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


_install_frappe_stub()

from entertainment_express.api import brand, control_plane_domains, hardening  # noqa: E402
from entertainment_express.white_label import urls as wl_urls  # noqa: E402


class _Perm(Exception):
    pass


class _Fake:
    PermissionError = _Perm

    def __init__(self, roles, user="owner@test.local", site="acme.app.example", conf=None):
        self._roles = roles
        self.session = SimpleNamespace(user=user)
        self.local = SimpleNamespace(site=site, request=SimpleNamespace(path="/", method="GET"), form_dict={})
        self.conf = conf if conf is not None else {}
        self._singles = {
            "brand_name": "Acme",
            "brand_color": "#0f766e",
            "brand_logo": "",
            "brand_favicon": "",
            "hide_product_chrome": 0,
            "email_from_name": "Acme Events",
            "primary_custom_domain": "",
        }
        self._tenant_domains = []
        self.db = SimpleNamespace(
            exists=self._exists,
            get_single_value=lambda dt, field: self._singles.get(field),
            set_single_value=lambda dt, field, value: self._singles.__setitem__(field, value),
            get_value=self._get_value,
            get_all=lambda *a, **k: list(self._tenant_domains),
            commit=lambda: None,
            set_value=lambda *a, **k: None,
            table_exists=lambda *_: True,
        )
        self.logger = lambda: SimpleNamespace(warning=lambda *a, **k: None)
        self.request = SimpleNamespace(get_data=lambda as_text=False: getattr(self, "_raw", b""))
        self.utils = SimpleNamespace(get_url=lambda: f"https://{site}")

    def _exists(self, dt, name=None, *a, **k):
        if dt == "DocType":
            return True
        if dt == "Tenant":
            return name in ("TENANT-ACME", "acme.app.example")
        if dt == "Tenant Domain":
            return True
        return False

    def _get_value(self, doctype, filters=None, fieldname="name", *a, **k):
        if doctype == "Tenant" and isinstance(filters, dict) and "site_name" in filters:
            if filters["site_name"] == "acme.app.example":
                return "TENANT-ACME"
            return None
        if doctype == "Tenant Domain" and isinstance(filters, dict):
            for row in self._tenant_domains:
                if row.get("hostname") == filters.get("hostname") and (
                    not filters.get("tenant") or row.get("tenant") == filters.get("tenant")
                ):
                    return row.get("name")
            return None
        return None

    def get_roles(self, user=None):
        return self._roles

    def throw(self, message, exc=None):
        raise (exc or Exception)(message)

    def get_doc(self, *a, **k):
        if a and isinstance(a[0], dict):
            data = a[0]

            def insert(ignore_permissions=False):
                name = f"DOM-{len(self._tenant_domains)+1}"
                self._tenant_domains.append({**data, "name": name})

            return SimpleNamespace(
                insert=insert,
                save=lambda **kw: None,
                name="",
                **{k: v for k, v in data.items() if k != "doctype"},
            )
        return SimpleNamespace(
            brand_name=self._singles.get("brand_name"),
            brand_color=self._singles.get("brand_color"),
            brand_logo=self._singles.get("brand_logo"),
            brand_favicon=self._singles.get("brand_favicon"),
            hide_product_chrome=self._singles.get("hide_product_chrome"),
            email_from_name=self._singles.get("email_from_name"),
            primary_custom_domain=self._singles.get("primary_custom_domain"),
            save=lambda ignore_permissions=False: None,
            insert=lambda ignore_permissions=False: None,
        )

    def get_cached_doc(self, *a, **k):
        return self.get_doc(*a, **k)

    def get_single(self, *a, **k):
        return self.get_doc(*a, **k)

    def get_request_header(self, name, default=""):
        return getattr(self, "_sig", default) or default


def _patch_hardening(monkeypatch, fake):
    monkeypatch.setattr(hardening, "frappe", fake)
    monkeypatch.setattr(hardening, "require_roles", lambda *a, **k: None)
    monkeypatch.setattr(hardening.audit, "write", lambda *a, **k: None)
    monkeypatch.setattr(wl_urls, "frappe", fake)


def test_guest_denied_domain_apis(monkeypatch):
    fake = _Fake(roles=["EE Event Guest"], user="Guest")
    _patch_hardening(monkeypatch, fake)
    with pytest.raises(Exception):
        hardening.request_custom_domain("events.example.com")
    with pytest.raises(Exception):
        hardening.list_custom_domains()
    with pytest.raises(Exception):
        hardening.set_primary_custom_domain("events.example.com")


def test_verify_adds_to_domains(monkeypatch):
    conf = {"ee_custom_domains": [], "domains": [], "host_name": "https://acme.app.example"}
    fake = _Fake(roles=["EE Tenant Admin"], conf=conf)
    _patch_hardening(monkeypatch, fake)
    monkeypatch.setattr(hardening, "hostname_resolves_here", lambda h, d: True)
    monkeypatch.setattr(hardening, "_notify_control_plane", lambda *a, **k: None)
    hardening.request_custom_domain("events.example.com")
    out = hardening.verify_custom_domain("events.example.com")
    assert out["verified"] == 1
    assert "events.example.com" in conf.get("domains", [])
    rows = conf["ee_custom_domains"]
    assert any(r.get("hostname") == "events.example.com" and r.get("verified") == 1 for r in rows)


def test_canonical_url_prefers_primary(monkeypatch):
    conf = {
        "ee_custom_domains": [
            {"hostname": "a.example.com", "verified": 1},
            {"hostname": "b.example.com", "verified": 1},
        ],
        "host_name": "https://acme.app.example",
    }
    fake = _Fake(roles=["EE Tenant Admin"], conf=conf)
    fake._singles["primary_custom_domain"] = "b.example.com"
    monkeypatch.setattr(wl_urls, "frappe", fake)
    assert wl_urls.get_public_base_url() == "https://b.example.com"
    assert wl_urls.absolute_url("/client") == "https://b.example.com/client"


def test_register_rejects_spoofed_site(monkeypatch):
    fake = _Fake(
        roles=["SaaS Operator"],
        site="admin.example",
        conf={"ee_control_plane": 1, "ee_domain_register_secret": "sec"},
    )
    body = {"site_name": "other.app.example", "hostname": "evil.example.com", "verified": 1, "tls_status": "pending"}
    raw = json.dumps(body, sort_keys=True, separators=(",", ":")).encode()
    fake._raw = raw
    fake._sig = hmac.new(b"sec", raw, hashlib.sha256).hexdigest()
    monkeypatch.setattr(control_plane_domains, "frappe", fake)
    monkeypatch.setattr(control_plane_domains, "require_roles", lambda *a, **k: None)
    with pytest.raises(Exception):
        control_plane_domains.register_tenant_domain()


def test_register_upserts_for_matching_site(monkeypatch):
    fake = _Fake(
        roles=["SaaS Operator"],
        site="admin.example",
        conf={"ee_control_plane": 1, "ee_domain_register_secret": "sec"},
    )
    body = {"site_name": "acme.app.example", "hostname": "events.acme.com", "verified": 1, "tls_status": "pending"}
    raw = json.dumps(body, sort_keys=True, separators=(",", ":")).encode()
    fake._raw = raw
    fake._sig = hmac.new(b"sec", raw, hashlib.sha256).hexdigest()
    monkeypatch.setattr(control_plane_domains, "frappe", fake)
    monkeypatch.setattr(control_plane_domains, "require_roles", lambda *a, **k: None)
    out = control_plane_domains.register_tenant_domain()
    assert out["ok"] is True
    assert out["hostname"] == "events.acme.com"
    assert fake._tenant_domains


def test_isolation_no_frappe_connect_in_notify():
    src = inspect.getsource(hardening._notify_control_plane) + inspect.getsource(hardening.verify_custom_domain)
    assert "frappe.connect(" not in src
    assert "frappe.init(" not in src
    assert "urlopen" in inspect.getsource(hardening._notify_control_plane)


def test_brand_host_requests_domain():
    src = inspect.getsource(brand.save_brand)
    assert "request_custom_domain" in src
    assert "custom_host" in src


def test_security_status_includes_dns_guidance(monkeypatch):
    fake = _Fake(roles=["EE Tenant Admin"], conf={"host_name": "https://acme.app.example"})
    _patch_hardening(monkeypatch, fake)
    status = hardening.security_status()
    assert status["cname_target"] == "acme.app.example"
    assert "CNAME" in status["dns_instructions"]
