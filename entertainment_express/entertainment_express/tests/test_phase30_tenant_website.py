"""Phase 30 — tenant website pages + embed isolation/rate-limit/XSS."""

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
        m.DoesNotExistError = type("DoesNotExistError", (Exception,), {})
        m.throw = lambda message, exc=None: (_ for _ in ()).throw((exc or Exception)(message))
        m.get_roles = lambda *a, **k: []
        m.parse_json = lambda v: v if isinstance(v, dict) else {}
        m.session = SimpleNamespace(user="Administrator")
        m.local = SimpleNamespace(site="tenant-a.example", response={}, request=None)
        m.logger = lambda: SimpleNamespace(error=lambda *_: None)
        m.db = SimpleNamespace()
        m.cache = lambda: SimpleNamespace(_d={}, get_value=lambda k: 0, set_value=lambda *a, **k: None)
        m.defaults = SimpleNamespace(get_global_default=lambda *_: "USD")
        sys.modules["frappe"] = m
        sys.modules["frappe.model"] = ModuleType("frappe.model")
        sys.modules["frappe.model.document"] = ModuleType("frappe.model.document")
        sys.modules["frappe.model.document"].Document = type("Document", (), {})

    utils = ModuleType("frappe.utils")
    utils.cint = lambda x, *a, **k: int(float(x or 0))
    utils.flt = lambda x, *a, **k: float(x or 0)
    utils.fmt_money = lambda x, *a, **k: str(x)
    utils.getdate = lambda x=None: x or "2026-09-02"
    utils.nowdate = lambda: "2026-09-02"
    utils.now_datetime = lambda: "2026-09-02 12:00:00"
    utils.get_url = lambda: "https://tenant-a.example"
    utils.add_days = lambda d, n: d
    m.utils = utils
    sys.modules["frappe.utils"] = utils


_install_frappe_stub()

from entertainment_express.api import embed  # noqa: E402
from entertainment_express.website_sanitize import sanitize_html  # noqa: E402


class _Perm(Exception):
    pass


class _Fake:
    PermissionError = _Perm
    ValidationError = Exception

    def __init__(self, roles, user="owner@test.local", site="tenant-a.example", embed_key="key-a"):
        self._roles = roles
        self._embed_key = embed_key
        self.session = SimpleNamespace(user=user)
        self.PermissionError = _Perm
        self.ValidationError = Exception
        self.local = SimpleNamespace(site=site, response={})
        self.utils = SimpleNamespace(get_url=lambda: f"https://{site}")
        self._cache = {}

        def get_cached_value(dt, name, field=None, *a, **k):
            if field == "public_embed_key":
                return self._embed_key
            return None

        def get_single_value(dt, field):
            if field == "public_embed_key":
                return self._embed_key
            return None

        self.db = SimpleNamespace(
            get_value=lambda *a, **k: None,
            exists=lambda *a, **k: False,
            table_exists=lambda *_: True,
            get_single_value=get_single_value,
            count=lambda *a, **k: 2,
            get_default=lambda *_: "USD",
        )
        self.get_cached_value = get_cached_value
        self.cache = lambda: SimpleNamespace(
            get_value=lambda k: self._cache.get(k, 0),
            set_value=lambda k, v, expires_in_sec=None: self._cache.__setitem__(k, v),
        )

    def get_roles(self, user=None):
        return self._roles

    def throw(self, message, exc=None):
        raise (exc or Exception)(message)

    def get_all(self, *a, **k):
        return []

    def get_single(self, *a, **k):
        return SimpleNamespace(
            brand_name="Demo Co",
            brand_color="#0f766e",
            brand_logo="",
            review_url="https://reviews.example",
            public_embed_key=self._embed_key,
            save=lambda **kw: None,
        )

    def parse_json(self, value):
        return value if isinstance(value, dict) else {}


def test_sanitize_strips_script_and_js_urls():
    dirty = '<p>Hi</p><script>alert(1)</script><a href="javascript:alert(1)">x</a><img src="https://ok.example/a.png">'
    clean = sanitize_html(dirty)
    assert "<script" not in clean.lower()
    assert "javascript:" not in clean.lower()
    assert "Hi" in clean
    assert "https://ok.example/a.png" in clean


def test_wrong_embed_key_rejected(monkeypatch):
    fake = _Fake(["Guest"], embed_key="key-a")
    monkeypatch.setattr(embed, "frappe", fake)
    monkeypatch.setattr(embed, "_rate_limit", lambda *_: None)
    with pytest.raises(_Perm):
        embed.bootstrap(key="key-from-tenant-b")


def test_valid_key_bootstraps(monkeypatch):
    fake = _Fake(["Guest"], embed_key="key-a")
    monkeypatch.setattr(embed, "frappe", fake)
    monkeypatch.setattr(embed, "_rate_limit", lambda *_: None)
    out = embed.bootstrap(key="key-a")
    assert out["ok"] is True
    assert out["brand"]["name"] == "Demo Co"


def test_rate_limit_trips(monkeypatch):
    fake = _Fake(["Guest"], embed_key="key-a")
    monkeypatch.setattr(embed, "frappe", fake)

    calls = {"n": 0}

    def limited(identity=None, limit=60):
        calls["n"] += 1
        if calls["n"] > 2:
            raise _Perm("Rate limit exceeded")

    monkeypatch.setattr(embed, "_rate_limit", limited)
    # First two ok via direct rate helper path — call bootstrap with patched assert
    monkeypatch.setattr(embed, "_assert_embed_key", lambda key: "key-a")
    embed.bootstrap(key="key-a")
    embed.bootstrap(key="key-a")
    with pytest.raises(_Perm):
        embed.bootstrap(key="key-a")


def test_guest_denied_page_crud(monkeypatch):
    fake = _Fake(["EE Event Guest"])
    monkeypatch.setattr(embed, "frappe", fake)
    with pytest.raises(_Perm):
        embed.list_pages()
    with pytest.raises(_Perm):
        embed.save_page({"title": "About", "route": "about", "body": "<p>x</p>"})


def test_no_tenant_args_on_public_api():
    for name in ("bootstrap", "catalog", "availability", "wishlist", "book_link", "reviews"):
        fn = getattr(embed, name)
        sig = str(inspect.signature(fn))
        assert "tenant" not in sig
        assert "site" not in sig
