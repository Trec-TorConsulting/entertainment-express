"""Tests for signup approval, Stripe handoff, and tenant URL helpers."""

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
