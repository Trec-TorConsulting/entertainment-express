"""Phase 12 — SaaS control plane: entitlements, billing state, isolation."""

from __future__ import annotations

import inspect
from types import SimpleNamespace

import pytest

from entertainment_express.api import saas_billing
from entertainment_express.control_plane import entitlements, metering
from entertainment_express.security import request_guards


class _Perm(Exception):
    pass


class _Fake:
    PermissionError = _Perm
    ValidationError = Exception

    def __init__(self, roles, user="owner@test.local", conf=None, site="e2esmoke.entx.app"):
        self._roles = roles
        self.session = SimpleNamespace(user=user)
        self.local = SimpleNamespace(site=site, request=None, response=SimpleNamespace())
        self.PermissionError = _Perm
        self.conf = conf or {
            "ee_entitlements": {"ai_assistant": 0, "max_bookings_per_month": 50, "enable_marketing": 0, "max_staff_users": 3},
            "ee_ai_assistant": 0,
            "ee_plan": "starter",
            "ee_plan_name": "Starter",
            "ee_price_display": "$49.00",
            "ee_subscription_status": "trialing",
            "ee_period_end": "2026-09-16",
            "ee_tenant_slug": "e2esmoke",
        }
        self._subs = {}
        self._tenants = {}
        self.db = SimpleNamespace(
            get_value=self._get_value,
            exists=lambda *a, **k: False,
            table_exists=lambda *_: True,
            count=lambda *a, **k: 0,
            set_value=self._set_value,
            get_default=lambda *_: "USD",
            get_all=lambda *a, **k: [],
        )
        self.utils = SimpleNamespace(get_url=lambda: "https://e2esmoke.entx.app", flt=lambda x: x)

    def get_roles(self, user=None):
        return self._roles

    def throw(self, message, exc=None):
        raise (exc or Exception)(message)

    def get_doc(self, *a, **k):
        return SimpleNamespace(insert=lambda **kw: None)

    def _get_value(self, *a, **k):
        return None

    def _set_value(self, *a, **k):
        return None

    def log_error(self, *a, **k):
        return None

    def whitelist(self, *a, **k):
        return lambda f: f


def test_guest_denied_plan_apis(monkeypatch):
    fake = _Fake(["EE Event Guest"], user="Guest")
    monkeypatch.setattr(saas_billing, "frappe", fake)
    with pytest.raises(_Perm):
        saas_billing.my_plan()
    with pytest.raises(_Perm):
        saas_billing.request_cancel()
    with pytest.raises(_Perm):
        saas_billing.create_subscription_checkout()


def test_crew_denied_plan_apis(monkeypatch):
    fake = _Fake(["EE Crew"], user="crew@test.local")
    monkeypatch.setattr(saas_billing, "frappe", fake)
    with pytest.raises(_Perm):
        saas_billing.my_plan()
    with pytest.raises(_Perm):
        saas_billing.request_cancel()


def test_owner_my_plan_from_site_config(monkeypatch):
    fake = _Fake(["EE Tenant Admin"])
    monkeypatch.setattr(saas_billing, "frappe", fake)
    monkeypatch.setattr(saas_billing, "require_roles", lambda *a: None)
    out = saas_billing.my_plan()
    assert out["plan"] == "Starter"
    assert out["status"] == "trialing"
    assert out["price"] == "$49.00"
    assert out["period_end"] == "2026-09-16"


def test_entitlement_from_site_config_ignores_site_name(monkeypatch):
    fake = _Fake(["EE Tenant Admin"])
    monkeypatch.setattr(entitlements, "frappe", fake)
    assert entitlements.has_entitlement("ai_assistant") == 0
    assert entitlements.has_entitlement("ai_assistant", site_name="other.app.example") == 0
    assert entitlements.has_entitlement("max_bookings_per_month") == 50
    with pytest.raises(_Perm):
        entitlements.require_entitlement("enable_marketing")
    entitlements.enforce_numeric_limit("max_bookings_per_month", 49, "full")
    with pytest.raises(_Perm):
        entitlements.enforce_numeric_limit("max_bookings_per_month", 50, "full")


def test_missing_entitlement_allows_existing_sites(monkeypatch):
    fake = _Fake(["EE Tenant Admin"], conf={})
    monkeypatch.setattr(entitlements, "frappe", fake)
    assert entitlements.has_entitlement("anything") is True


def test_webhook_ignored_on_tenant_site(monkeypatch):
    fake = _Fake(["EE Tenant Admin"], conf={})
    monkeypatch.setattr(saas_billing, "frappe", fake)
    monkeypatch.setattr(saas_billing, "is_control_plane", lambda: False)
    assert saas_billing.saas_stripe_webhook() == {"status": "ignored"}


def test_invoice_paid_sets_active_and_period(monkeypatch):
    stored = {}

    class DB:
        def exists(self, *a, **k):
            return False

        def get_value(self, dt, name, fields=None, as_dict=False):
            if dt == "Subscription":
                return "SUB-1"
            return None

        def set_value(self, dt, name, values):
            stored.update(values)

        def table_exists(self, *_):
            return True

    fake = _Fake(["SaaS Operator"], site="admin.entertainmentexpress.app", conf={"ee_control_plane": 1})
    fake.db = DB()
    monkeypatch.setattr(saas_billing, "frappe", fake)
    monkeypatch.setattr(saas_billing, "push_plan_to_site", lambda *a, **k: None)
    monkeypatch.setattr(saas_billing, "_tenant_from_obj", lambda obj: "acme")
    saas_billing._invoice_paid(
        {
            "id": "in_1",
            "amount_paid": 14900,
            "currency": "usd",
            "period_start": 1700000000,
            "period_end": 1702592000,
        }
    )
    assert stored["status"] == "active"
    assert "current_period_end" in stored


def test_invoice_failed_sets_past_due(monkeypatch):
    stored = {}

    class DB:
        def get_value(self, dt, name, fields=None, as_dict=False):
            if dt == "Subscription":
                return "SUB-1"
            if dt == "Tenant":
                return "pro"
            if dt == "Plan":
                return 7
            return None

        def set_value(self, dt, name, values):
            stored.update(values)

        def exists(self, *a, **k):
            return False

    fake = _Fake(["SaaS Operator"], site="admin.entertainmentexpress.app")
    fake.db = DB()
    monkeypatch.setattr(saas_billing, "frappe", fake)
    monkeypatch.setattr(saas_billing, "push_plan_to_site", lambda *a, **k: None)
    monkeypatch.setattr(saas_billing, "_tenant_from_obj", lambda obj: "acme")
    saas_billing._invoice_failed({"id": "in_fail"})
    assert stored["status"] == "past_due"
    assert stored.get("grace_until")


def test_subscription_canceled_flags(monkeypatch):
    stored = {}

    class DB:
        def get_value(self, *a, **k):
            return "SUB-1"

        def set_value(self, dt, name, values):
            stored.update(values)

    fake = _Fake(["SaaS Operator"])
    fake.db = DB()
    monkeypatch.setattr(saas_billing, "frappe", fake)
    monkeypatch.setattr(saas_billing, "push_plan_to_site", lambda *a, **k: None)
    monkeypatch.setattr(saas_billing, "_tenant_from_obj", lambda obj: "acme")
    saas_billing._subscription_canceled({"id": "sub_x"})
    assert stored["status"] == "canceled"
    assert stored["cancel_at_period_end"] == 1


def test_suspended_conf_blocks_api(monkeypatch):
    fake = _Fake(["EE Tenant Admin"], conf={"ee_suspended": 1})

    class Req:
        path = "/api/method/entertainment_express.api.booking.convert_to_booking"

    fake.local.request = Req()
    monkeypatch.setattr(request_guards, "frappe", fake)
    with pytest.raises(_Perm):
        request_guards.enforce_tenant_suspension()


def test_collect_local_metrics_has_no_tenant_arg():
    sig = inspect.signature(metering.collect_local_metrics)
    assert "tenant" not in sig.parameters
    assert "site" not in sig.parameters


def test_has_entitlement_site_name_is_ignored():
    src = inspect.getsource(entitlements.has_entitlement)
    assert "frappe.init" not in src
    assert "frappe.connect" not in src
