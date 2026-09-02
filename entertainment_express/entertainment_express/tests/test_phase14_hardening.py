"""Phase 14 — Hardening: lockout, 2FA flag, audit, domains, isolation."""

from __future__ import annotations

import inspect
from pathlib import Path
from types import SimpleNamespace

import pytest

from entertainment_express.api import hardening, health, rate_limit
from entertainment_express.security import audit, auth_hardening


class _Perm(Exception):
    pass


class _Fake:
    PermissionError = _Perm

    def __init__(self, roles, user="owner@test.local", site="e2esmoke.entx.app", conf=None):
        self._roles = roles
        self.session = SimpleNamespace(user=user)
        self.local = SimpleNamespace(
            site=site,
            request=SimpleNamespace(path="/api/method/login", method="POST"),
            response=SimpleNamespace(http_status_code=200, headers={}),
            form_dict={"usr": user},
        )
        self.PermissionError = _Perm
        self.conf = conf or {}
        self._cache = {}
        self.db = SimpleNamespace(
            get_value=lambda *a, **k: None,
            exists=lambda dt, name=None, *a, **k: dt == "DocType",
            table_exists=lambda *_: True,
            get_all=lambda *a, **k: [],
            commit=lambda: None,
            sql=lambda *a, **k: [[1]],
        )

    def cache(self):
        fake = self

        class C:
            def get_value(self, key):
                return fake._cache.get(key)

            def set_value(self, key, value, expires_in_sec=None):
                fake._cache[key] = value

        return C()

    def get_roles(self, user=None):
        return self._roles

    def throw(self, message, exc=None):
        raise (exc or Exception)(message)

    def get_all(self, *a, **k):
        return []

    def get_doc(self, *a, **k):
        return SimpleNamespace(insert=lambda **kw: None, save=lambda **kw: None)

    def get_request_header(self, name, default=""):
        return default

    def whitelist(self, *a, **k):
        return lambda f: f


def _patch(monkeypatch, fake):
    monkeypatch.setattr(hardening, "frappe", fake)
    monkeypatch.setattr(hardening, "require_roles", lambda *a, **k: None)
    monkeypatch.setattr(audit, "frappe", fake)
    monkeypatch.setattr(auth_hardening, "frappe", fake)
    monkeypatch.setattr(health, "frappe", fake)
    monkeypatch.setattr(rate_limit, "frappe", fake)


def test_guest_denied_hardening_apis(monkeypatch):
    fake = _Fake(["EE Event Guest"], user="Guest")
    _patch(monkeypatch, fake)
    with pytest.raises(_Perm):
        hardening.security_status()
    with pytest.raises(_Perm):
        hardening.set_require_2fa(1)
    with pytest.raises(_Perm):
        hardening.request_custom_domain("events.example.com")
    with pytest.raises(_Perm):
        hardening.list_audit()


def test_crew_cannot_toggle_2fa(monkeypatch):
    fake = _Fake(["EE Crew"], user="crew@test.local")
    monkeypatch.setattr(hardening, "frappe", fake)
    with pytest.raises(_Perm):
        hardening.set_require_2fa(1)


def test_no_tenant_or_site_switch_args():
    for fn in (
        hardening.security_status,
        hardening.set_require_2fa,
        hardening.list_audit,
        hardening.request_custom_domain,
        hardening.verify_custom_domain,
        hardening.save_sso,
        hardening.backup_status,
        health.ready,
        auth_hardening.check_login_lockout,
        auth_hardening.enforce_privileged_2fa,
        audit.write,
    ):
        names = inspect.signature(fn).parameters
        assert "tenant" not in names or fn is hardening.record_tenant_domain
        if fn is not hardening.record_tenant_domain:
            assert "site" not in names


def test_record_tenant_domain_tenant_arg_is_doctype_name():
    src = inspect.getsource(hardening.record_tenant_domain)
    assert "frappe.init" not in src
    assert "frappe.connect" not in src
    assert "Tenant" in src


def test_rate_limit_key_includes_site(monkeypatch):
    fake = _Fake(["EE Tenant Admin"], site="e2esmoke.entx.app")
    monkeypatch.setattr(rate_limit, "frappe", fake)
    key = rate_limit.rate_limit_key("owner@test.local")
    assert "e2esmoke.entx.app" in key
    fake.local.site = "other.entx.app"
    other = rate_limit.rate_limit_key("owner@test.local")
    assert "other.entx.app" in other
    assert key != other


def test_lockout_after_threshold(monkeypatch):
    fake = _Fake(["EE Tenant Admin"], user="owner@test.local")
    monkeypatch.setattr(auth_hardening, "frappe", fake)
    for _ in range(auth_hardening.LOCK_LIMIT):
        auth_hardening.check_login_lockout()
    with pytest.raises(_Perm):
        auth_hardening.check_login_lockout()


def test_2fa_skipped_when_flag_off(monkeypatch):
    fake = _Fake(["EE Tenant Admin"], conf={"ee_require_2fa": 0})
    monkeypatch.setattr(auth_hardening, "frappe", fake)
    fake.local.request = SimpleNamespace(path="/owner", method="GET")
    auth_hardening.enforce_privileged_2fa()


def test_2fa_blocks_privileged_without_totp(monkeypatch):
    fake = _Fake(["EE Tenant Admin"], conf={"ee_require_2fa": 1})
    fake.local.request = SimpleNamespace(path="/owner", method="GET")
    monkeypatch.setattr(auth_hardening, "frappe", fake)
    monkeypatch.setattr(auth_hardening, "_user_has_2fa", lambda u: False)
    with pytest.raises(_Perm):
        auth_hardening.enforce_privileged_2fa()


def test_audit_scrubs_secrets():
    cleaned = audit._scrub({"token": "secret-value", "ok": "fine", "Authorization": "Bearer x"})
    assert cleaned["token"] == "[redacted]"
    assert cleaned["Authorization"] == "[redacted]"
    assert cleaned["ok"] == "fine"


def test_audit_append_only():
    from entertainment_express.entertainment_express_core.doctype.ee_audit_log.ee_audit_log import EEAuditLog

    src = inspect.getsource(EEAuditLog.before_save)
    assert "append-only" in src


def test_save_sso_does_not_echo_secret(monkeypatch):
    fake = _Fake(["EE Tenant Admin"])
    _patch(monkeypatch, fake)
    monkeypatch.setattr(hardening, "_deny_crew_write", lambda: None)
    out = hardening.save_sso("https://idp.example", "cid", "super-secret", 1)
    assert "super-secret" not in str(out)
    assert "client_secret" not in out


def test_domain_verify_helper_no_cross_site():
    src = inspect.getsource(hardening.hostname_resolves_here) + inspect.getsource(hardening.verify_custom_domain)
    assert "frappe.init" not in src
    assert "frappe.connect" not in src


def test_ready_this_site_only():
    src = inspect.getsource(health.ready)
    assert "frappe.init" not in src
    assert "frappe.connect" not in src
    assert "SELECT 1" in src


def test_no_cross_site_connect_in_hardening():
    files = [
        Path(hardening.__file__),
        Path(auth_hardening.__file__),
        Path(audit.__file__),
        Path(health.__file__),
        Path(rate_limit.__file__),
    ]
    src = "\n".join(p.read_text(encoding="utf-8") for p in files)
    assert "frappe.connect" not in src
    assert "frappe.init" not in src


def test_ee_integrations_module_does_not_steal_frappe_name():
    root = Path(__file__).resolve().parents[1]
    modules = [line.strip() for line in (root / "modules.txt").read_text(encoding="utf-8").splitlines()]
    assert "Integrations" not in modules
    assert "EE Integrations" in modules
    assert (root / "ee_integrations" / "doctype" / "integration_config" / "integration_config.json").is_file()
