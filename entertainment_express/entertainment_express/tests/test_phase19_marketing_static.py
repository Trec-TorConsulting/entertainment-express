from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
API_FILE = ROOT / "api" / "marketing.py"
BASE_TEMPLATE = ROOT / "templates" / "marketing" / "base.html"
CSS_FILE = ROOT / "public" / "marketing" / "marketing.css"
ROBOTS_FILE = ROOT / "www" / "robots.txt"
HOOKS_FILE = ROOT / "hooks.py"
START_TRIAL_FILE = ROOT / "www" / "start_trial.py"
RUNTIME_TEST_FILE = ROOT / "tests" / "test_phase19_marketing.py"
CLIENT_INDEX_FILE = ROOT / "www" / "client" / "index.html"
CLIENT_SIGN_FILE = ROOT / "www" / "client" / "sign.html"
REQUEST_GUARDS_FILE = ROOT / "security" / "request_guards.py"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_public_methods_allow_guest_decorators_present():
    source = _read(API_FILE)
    for method in [
        "get_pricing",
        "submit_lead",
        "start_trial",
        "subscribe_newsletter",
        "confirm_subscription",
    ]:
        method_sig = f"def {method}("
        idx = source.find(method_sig)
        assert idx != -1
        preamble = source[max(0, idx - 160):idx]
        assert "@frappe.whitelist(allow_guest=True)" in preamble


def test_public_methods_enforce_rate_limits():
    source = _read(API_FILE)
    assert "ee:marketing:pricing:" in source
    assert "ee:marketing:lead:" in source
    assert "ee:marketing:trial:" in source
    assert "ee:marketing:newsletter:" in source
    assert "ee:marketing:newsletter-confirm:" in source


def test_isolation_contract_no_cross_site_calls():
    source = _read(API_FILE)
    assert "frappe.init(" not in source
    assert "bench " not in source
    assert "new-site" not in source


def test_accessibility_landmarks_and_skip_link_present():
    base = _read(BASE_TEMPLATE)
    assert "<main" in base
    assert "role=\"main\"" in base
    assert "ee-skip-link" in base
    assert "<header" in base or "header.html" in base
    assert "<footer" in base or "footer.html" in base


def test_accessibility_keyboard_focus_and_motion_reduction_present():
    css = _read(CSS_FILE)
    assert ":focus-visible" in css
    assert "prefers-reduced-motion" in css


def test_robots_has_sitemap_and_disallow_rules():
    robots = _read(ROBOTS_FILE)
    assert "Sitemap:" in robots
    assert "Disallow: /app" in robots
    assert "Disallow: /desk" in robots
    assert "Disallow: /api" in robots
    assert "Disallow: /private" in robots
    assert "Disallow: /client" in robots


def test_redirect_rules_present_for_legacy_marketing_routes():
    hooks = _read(HOOKS_FILE)
    assert '"source": "/learn"' in hooks
    assert '"target": "/resources"' in hooks
    assert '"source": "/request-demo"' in hooks
    assert '"target": "/demo"' in hooks
    assert '"source": "/sign"' in hooks
    assert '"target": "/client/sign"' in hooks


def test_start_trial_excluded_from_sitemap():
    source = _read(START_TRIAL_FILE)
    assert "context.no_sitemap = 1" in source


def test_lead_endpoint_honeypot_and_captcha_paths_exist():
    source = _read(API_FILE)
    assert "if (data.get(\"website\") or \"\").strip():" in source
    assert "_require_captcha_if_enabled(data)" in source


def test_pricing_fallback_message_defined():
    pricing_py = _read(ROOT / "www" / "pricing.py")
    pricing_html = _read(ROOT / "www" / "pricing.html")
    assert "pricing_error" in pricing_py
    assert "Pricing is temporarily unavailable" in pricing_py
    assert "pricing_error" in pricing_html


def test_task_12_1_lead_capture_logic_present():
    source = _read(API_FILE)
    assert "frappe.enqueue(\"entertainment_express.api.marketing._notify_sales_lead\"" in source
    assert "if (data.get(\"website\") or \"\").strip():" in source
    assert "_check_rate_limit(f\"ee:marketing:lead:" in source
    assert "lead = frappe.get_doc(lead_values)" in source


def test_task_12_2_newsletter_double_opt_in_logic_present():
    source = _read(API_FILE)
    assert "def subscribe_newsletter(" in source
    assert "def confirm_subscription(" in source
    assert "_send_newsletter_confirmation_email" in source
    assert "_upsert_newsletter_member(email, confirmed=True)" in source
    assert "if not email or \"@\" not in email:" in source
    assert "return {\"ok\": True}" in source


def test_task_12_3_pricing_sync_logic_present():
    source = _read(API_FILE)
    assert "def _is_active_plan_status" in source
    assert "if not _is_active_plan_status(row.status):" in source
    assert 'fields=["name", "plan_name", "plan_code", "price_monthly", "currency", "trial_days", "status"]' in source


def test_task_12_4_trial_handoff_logic_present():
    source = _read(API_FILE)
    assert "validate_slug(requested_slug)" in source
    assert '"doctype": "Signup Application"' in source
    assert "ee_origin_lead" in source
    assert "return {\"ok\": True, \"application\": signup.name, \"redirect\": \"/signup\"}" in source


def test_task_12_6_guest_desk_guard_test_exists():
    source = _read(RUNTIME_TEST_FILE)
    assert "def test_guest_role_cannot_access_desk_only_features" in source
    assert "frappe.only_for(\"System Manager\")" in source


def test_backend_boundary_hook_registered():
    hooks = _read(HOOKS_FILE)
    assert "before_request" in hooks
    assert "enforce_backend_boundary" in hooks
    assert "sanitize_backend_urls" in hooks


def test_client_portal_pages_exist_and_reference_contract_flow():
    index_page = _read(CLIENT_INDEX_FILE)
    sign_page = _read(CLIENT_SIGN_FILE)
    assert "Client Portal" in index_page
    assert "/client/sign" in index_page
    assert "entertainment_express.api.contract.view_contract" in sign_page
    assert "entertainment_express.api.contract.sign_contract" in sign_page


def test_backend_url_sanitizer_uses_clean_ee_route():
    guards = _read(REQUEST_GUARDS_FILE)
    assert "EE_BACKEND_HOME = \"/app/workspace/entertainment-express\"" in guards
    assert "BRANDED_BACKEND_PATH_PARTS" in guards
    assert "sanitize_backend_urls" in guards
