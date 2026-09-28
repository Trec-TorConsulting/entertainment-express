"""Tests for signup approval, Stripe handoff, and tenant URL helpers."""

import sys
from types import ModuleType, SimpleNamespace

if "frappe" not in sys.modules or not hasattr(sys.modules["frappe"], "whitelist"):
    m = ModuleType("frappe")
    m.whitelist = lambda *a, **k: (lambda f: f)
    m.PermissionError = type("PermissionError", (Exception,), {})
    m.ValidationError = type("ValidationError", (ValueError,), {})
    m.DoesNotExistError = type("DoesNotExistError", (KeyError,), {})
    m.throw = lambda msg, exc=None: (_ for _ in ()).throw((exc or Exception)(msg))
    m.get_roles = lambda *a, **k: ["EE Tenant Admin"]
    m.session = SimpleNamespace(user="Guest")
    m.local = SimpleNamespace(site="entx.app")
    m.conf = {}
    m.db = SimpleNamespace(
        get_value=lambda *a, **kw: None,
        exists=lambda *a, **kw: False,
        commit=lambda: None,
        table_exists=lambda *a, **kw: True,
    )
    m.logger = lambda *a, **kw: SimpleNamespace(warning=lambda *a, **kw: None, info=lambda *a, **kw: None)
    m.log_error = lambda *a, **kw: None
    m.get_traceback = lambda: ""
    m.get_doc = lambda *a, **kw: None
    sys.modules["frappe"] = m
    sys.modules["frappe.model"] = ModuleType("frappe.model")
    sys.modules["frappe.model.document"] = ModuleType("frappe.model.document")
    sys.modules["frappe.model.document"].Document = type("Document", (), {})
    utils = ModuleType("frappe.utils")
    utils.flt = lambda v, p=2: float(v or 0)
    utils.cint = lambda v: int(v or 0)
    utils.get_datetime = lambda v: v
    utils.now_datetime = lambda: "2026-09-28 10:00:00"
    utils.add_days = lambda d, n: "2026-10-28 10:00:00"
    utils.today = lambda: "2026-09-28"
    utils.fmt_money = lambda v, currency="USD": f"${float(v or 0):.2f}"
    sys.modules["frappe.utils"] = utils

from entertainment_express.api import signup_onboarding, saas_billing
from entertainment_express.control_plane import tenant_urls


def test_tenant_base_domain_defaults_to_entx(monkeypatch):
    monkeypatch.setattr(tenant_urls.frappe, "conf", {})
    assert tenant_urls.tenant_base_domain() == "entx.app"


def test_tenant_site_url_uses_configured_domain(monkeypatch):
    monkeypatch.setattr(tenant_urls.frappe, "conf", {"ee_tenant_domain": "entx.app"})
    assert tenant_urls.tenant_site_url("acme") == "https://acme.entx.app"


def test_signup_handoff_manual_when_stripe_missing(monkeypatch):
    monkeypatch.setattr(signup_onboarding, "_stripe_configured", lambda: False)
    out = signup_onboarding.signup_handoff("APP-1", "acme")
    assert out["manual_review"] is True
    assert out["site_url"] == "https://acme.entx.app"
    assert out["checkout_url"] is None


def test_handle_signup_checkout_completed_approves_application(monkeypatch):
    approved = {}

    class App:
        name = "APP-1"
        status = "new"
        tenant = "TEN-1"
        requested_slug = "acme"

        def reload(self):
            self.status = "approved"

    monkeypatch.setattr(
        signup_onboarding.frappe,
        "get_doc",
        lambda doctype, name: App(),
    )
    monkeypatch.setattr(
        signup_onboarding.frappe.db,
        "exists",
        lambda doctype, name: doctype == "Signup Application" and name == "APP-1",
    )
    monkeypatch.setattr(
        signup_onboarding,
        "approve_signup_application",
        lambda name: approved.setdefault("name", name) or {"tenant": "TEN-1"},
    )

    meta = signup_onboarding.handle_signup_checkout_completed(
        {"metadata": {"signup_application": "APP-1"}}
    )
    assert approved["name"] == "APP-1"
    assert meta["tenant"] == "TEN-1"
    assert meta["tenant_slug"] == "acme"


def test_apply_stripe_event_triggers_signup_provision(monkeypatch):
    called = {}

    def _handle(session):
        called["handled"] = True
        return {"tenant": "TEN-1", "tenant_slug": "acme", "signup_application": "APP-1"}

    monkeypatch.setattr(signup_onboarding, "handle_signup_checkout_completed", _handle)
    monkeypatch.setattr(saas_billing, "_upsert_subscription", lambda obj: called.setdefault("upsert", obj))

    saas_billing.apply_stripe_event(
        "checkout.session.completed",
        {"metadata": {"signup_application": "APP-1"}},
    )
    assert called["handled"] is True
    assert called["upsert"]["metadata"]["tenant"] == "TEN-1"


def test_create_signup_checkout_graceful_on_stripe_auth_error(monkeypatch):
    monkeypatch.setattr(signup_onboarding, "_stripe_configured", lambda: True)

    class MockApp:
        name = "APP-1"
        status = "new"
        plan = "starter"
        contact_email = "test@example.com"
        requested_slug = "soundefxdjs"
        company_name = "SoundEFXDjs"

    class MockPlan:
        name = "starter"
        plan_code = "starter"
        plan_name = "Starter"
        currency = "USD"
        price_monthly = 99
        trial_days = 14

        def get(self, k):
            return None

    monkeypatch.setattr(
        signup_onboarding.frappe,
        "get_doc",
        lambda dt, name=None: MockApp() if dt == "Signup Application" else MockPlan(),
    )
    monkeypatch.setattr(signup_onboarding.frappe.db, "exists", lambda dt, name: True)

    class BadStripe:
        class checkout:
            class Session:
                @staticmethod
                def create(**kwargs):
                    raise Exception("Expired API Key provided: sk_live_expired")

    monkeypatch.setattr(
        "entertainment_express.api.saas_billing._stripe",
        lambda: BadStripe(),
    )

    out = signup_onboarding.create_signup_checkout("APP-1")
    assert out["checkout_url"] is None


def test_ensure_subscription_guest_inserts_with_ignore_permissions(monkeypatch):
    from entertainment_express.api import saas_billing

    inserted = {}

    class MockSub:
        name = "SUB-0001"
        status = "trialing"

        def insert(self, ignore_permissions=False):
            inserted["ignore_permissions"] = ignore_permissions
            if not ignore_permissions:
                raise Exception("User Guest does not have doctype access via role permission for document Subscription")
            return self

    class MockTenant:
        plan = "starter"

    class MockPlan:
        trial_days = 14
        name = "starter"
        price_monthly = 99

    monkeypatch.setattr(saas_billing.frappe, "get_doc", lambda dt, name=None: (
        MockSub() if isinstance(dt, dict) and dt.get("doctype") == "Subscription"
        else MockTenant() if dt == "Tenant"
        else MockPlan()
    ))
    monkeypatch.setattr(saas_billing.frappe.db, "get_value", lambda *a, **kw: None)
    monkeypatch.setattr(saas_billing.frappe.db, "commit", lambda: None)
    monkeypatch.setattr(saas_billing, "push_plan_to_site", lambda t: None)

    res = saas_billing.ensure_subscription("test-dj")
    assert res["subscription"] == "SUB-0001"
    assert inserted.get("ignore_permissions") is True


