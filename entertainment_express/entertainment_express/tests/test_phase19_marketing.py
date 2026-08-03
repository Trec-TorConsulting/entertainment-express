import inspect
from pathlib import Path

import frappe
import pytest

from entertainment_express import hooks
from entertainment_express.api import marketing
from entertainment_express.setup import install
from entertainment_express.www import start_trial


def test_start_trial_no_sitemap_flag():
    context = frappe._dict()
    start_trial.get_context(context)
    assert context.no_sitemap == 1


def test_marketing_website_redirects_present():
    redirects = {row["source"]: row["target"] for row in hooks.website_redirects}
    assert redirects["/learn"] == "/resources"
    assert redirects["/request-demo"] == "/demo"


def test_robots_file_contains_sitemap_and_disallows_app_paths():
    robots_path = Path(__file__).resolve().parents[1] / "www" / "robots.txt"
    with open(robots_path, "r", encoding="utf-8") as f:
        content = f.read()

    assert "Sitemap:" in content
    assert "Disallow: /app" in content
    assert "Disallow: /api" in content
    assert "Disallow: /private" in content


def test_submit_lead_honeypot_short_circuit(monkeypatch):
    called = {"rate_limit": False}

    def _fail_if_called(*args, **kwargs):
        called["rate_limit"] = True
        raise AssertionError("rate limiter should not run for honeypot requests")

    monkeypatch.setattr(marketing, "_check_rate_limit", _fail_if_called)
    out = marketing.submit_lead({"website": "bot-filled", "email": "bot@example.com"})
    assert out == {"ok": True}
    assert called["rate_limit"] is False


def test_submit_lead_invalid_email_raises():
    try:
        marketing.submit_lead({"lead_type": "demo", "email": "bad-email"})
        assert False, "Expected validation error"
    except Exception as exc:
        assert "valid email" in str(exc).lower()


def test_submit_lead_requires_captcha_when_enabled(monkeypatch):
    class Settings:
        captcha_provider = "turnstile"

    monkeypatch.setattr(marketing, "_get_marketing_settings", lambda: Settings())
    monkeypatch.setattr(marketing, "_check_rate_limit", lambda *args, **kwargs: None)
    try:
        marketing.submit_lead({"email": "person@example.com", "lead_type": "demo"})
        assert False, "Expected validation error"
    except Exception as exc:
        assert "captcha" in str(exc).lower()


def test_subscribe_newsletter_invalid_email_generic_success():
    out = marketing.subscribe_newsletter({"email": "", "source_page": "/resources"})
    assert out == {"ok": True}


def test_confirm_subscription_idempotent_missing_token():
    out = marketing.confirm_subscription(None)
    assert out == {"ok": True}


def test_confirm_subscription_rate_limited(monkeypatch):
    called = {"limited": False}

    def _limit(*args, **kwargs):
        called["limited"] = True

    monkeypatch.setattr(marketing, "_check_rate_limit", _limit)
    marketing.confirm_subscription(None)
    assert called["limited"] is True


def test_start_trial_and_submit_lead_enforce_rate_limit():
    submit_src = inspect.getsource(marketing.submit_lead)
    trial_src = inspect.getsource(marketing.start_trial)
    assert "_check_rate_limit" in submit_src
    assert "_check_rate_limit" in trial_src


def test_get_pricing_filters_non_active_plans(monkeypatch):
    class Row:
        def __init__(self, name, status):
            self.name = name
            self.status = status

    class Entitlement:
        feature_key = "bookings_limit"
        limit_value = "500"
        description = "Monthly booking cap"

    class PlanDoc:
        plan_code = "starter"
        plan_name = "Starter"
        currency = "USD"
        price_monthly = 99
        trial_days = 14
        entitlements = [Entitlement()]

    class Meta:
        @staticmethod
        def has_field(name):
            return False

    monkeypatch.setattr(marketing.frappe, "get_meta", lambda dt: Meta())
    monkeypatch.setattr(
        marketing.frappe,
        "get_all",
        lambda *args, **kwargs: [
            Row("PLAN-1", "Active"),
            Row("PLAN-2", "Archived"),
        ],
    )
    monkeypatch.setattr(marketing.frappe, "get_doc", lambda *args, **kwargs: PlanDoc())

    out = marketing.get_pricing("monthly")
    assert len(out["plans"]) == 1
    assert out["plans"][0]["code"] == "starter"


def test_start_trial_creates_signup_application(monkeypatch):
    recorded = {}

    class DummySignup:
        name = "EE-SIGNUP-TEST"

        def insert(self, ignore_permissions=False):
            return None

    class DB:
        @staticmethod
        def get_value(doctype, filters, fieldname):
            if doctype == "Plan":
                return "PLAN-STARTER"
            return None

    monkeypatch.setattr(marketing, "_get_client_ip", lambda: "127.0.0.1")
    monkeypatch.setattr(marketing, "_check_rate_limit", lambda *args, **kwargs: None)
    monkeypatch.setattr(marketing, "submit_lead", lambda payload: {"ok": True, "lead": "LEAD-TEST"})
    monkeypatch.setattr(marketing.frappe, "db", DB())

    def _get_doc(values):
        recorded.update(values)
        return DummySignup()

    monkeypatch.setattr(marketing.frappe, "get_doc", _get_doc)

    from entertainment_express.control_plane import provisioner

    monkeypatch.setattr(provisioner, "validate_slug", lambda slug: None)

    out = marketing.start_trial(
        {
            "company_name": "Test Co",
            "contact_email": "owner@testco.com",
            "requested_slug": "testco",
            "plan_code": "starter",
            "source_page": "/pricing",
            "utm_source": "google",
        }
    )

    assert out["ok"] is True
    assert out["application"] == "EE-SIGNUP-TEST"
    assert recorded["doctype"] == "Signup Application"
    assert recorded["requested_slug"] == "testco"
    assert recorded["plan"] == "PLAN-STARTER"


def test_start_trial_rejects_invalid_slug(monkeypatch):
    monkeypatch.setattr(marketing, "_get_client_ip", lambda: "127.0.0.1")
    monkeypatch.setattr(marketing, "_check_rate_limit", lambda *args, **kwargs: None)

    from entertainment_express.control_plane import provisioner

    def _bad_slug(slug):
        raise frappe.ValidationError("invalid slug")

    monkeypatch.setattr(provisioner, "validate_slug", _bad_slug)

    try:
        marketing.start_trial(
            {
                "company_name": "Test Co",
                "contact_email": "owner@testco.com",
                "requested_slug": "bad_slug",
                "plan_code": "starter",
            }
        )
        assert False, "Expected slug validation error"
    except Exception as exc:
        assert "slug" in str(exc).lower()


def test_marketing_module_never_crosses_tenant_sites():
    source = inspect.getsource(marketing)
    assert "frappe.init(" not in source
    assert "bench " not in source


def test_after_install_seeds_marketing_defaults_and_page():
    source = inspect.getsource(install.after_install)
    assert "seed_marketing_settings" in source
    assert "seed_marketing_pages" in source


def test_public_marketing_methods_allow_guest():
    source = inspect.getsource(marketing)
    for method_name in ["get_pricing", "submit_lead", "start_trial", "subscribe_newsletter", "confirm_subscription"]:
        marker = f"def {method_name}("
        idx = source.find(marker)
        assert idx != -1
        preamble = source[max(0, idx - 120):idx]
        assert "@frappe.whitelist(allow_guest=True)" in preamble


def test_get_pricing_uses_cache_when_present(monkeypatch):
    class Cache:
        @staticmethod
        def get_value(key):
            return '{"billing":"monthly","plans":[{"code":"cached"}]}'

        @staticmethod
        def set_value(*args, **kwargs):
            return None

    monkeypatch.setattr(marketing, "_check_rate_limit", lambda *args, **kwargs: None)
    monkeypatch.setattr(marketing.frappe, "cache", lambda: Cache())
    out = marketing.get_pricing("monthly")
    assert out["plans"][0]["code"] == "cached"


def test_guest_role_cannot_access_desk_only_features():
    current_user = frappe.session.user
    try:
        frappe.set_user("Guest")
        with pytest.raises((frappe.PermissionError, Exception)):
            frappe.only_for("System Manager")
    finally:
        frappe.set_user(current_user)
