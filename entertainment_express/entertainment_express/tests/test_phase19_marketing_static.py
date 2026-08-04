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
CLIENT_DIR = ROOT / "www" / "client"
PORTAL_BASE_FILE = ROOT / "templates" / "portal" / "base.html"
REQUEST_GUARDS_FILE = ROOT / "security" / "request_guards.py"
BOOTSTRAP_FILE = ROOT / "control_plane" / "bootstrap.py"
PROVISIONER_FILE = ROOT / "control_plane" / "provisioner.py"
SIGNUP_JS_FILE = ROOT / "control_plane" / "doctype" / "signup_application" / "signup_application.js"
ONBOARDING_FILE = ROOT / "setup" / "onboarding.py"
ROLE_FIXTURE_FILE = ROOT / "fixtures" / "role.json"
WORKSPACE_HIDE_PATCH_FILE = ROOT / "patches" / "v0_0_1" / "hide_unused_erpnext_workspaces.py"


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
    portal_base = _read(PORTAL_BASE_FILE)
    assert "Client Portal" in index_page
    assert "/client/sign" in index_page
    assert "entertainment_express.api.contract.view_contract" in sign_page
    assert "entertainment_express.api.contract.sign_contract" in sign_page
    assert "entertainment_express/templates/portal/base.html" in index_page
    assert "entertainment_express/templates/portal/base.html" in sign_page
    assert "Client Portal" in portal_base
    assert "templates/web.html" not in portal_base


def test_backend_url_sanitizer_uses_clean_ee_route():
    guards = _read(REQUEST_GUARDS_FILE)
    assert "EE_BACKEND_HOME = \"/app/workspace/entertainment-express\"" in guards
    assert "EE_CLIENT_PORTAL = \"/client\"" in guards


def test_client_portal_is_gated_behind_login():
    """The /client customer portal must not be public: every page has a
    controller that redirects guests to login via require_client_login()."""
    guards = _read(REQUEST_GUARDS_FILE)
    assert "def require_client_login()" in guards
    assert "EE_LOGIN = \"/login\"" in guards
    assert "redirect-to=" in guards
    for html in CLIENT_DIR.glob("*.html"):
        controller = html.with_suffix(".py")
        assert controller.exists(), f"missing login gate controller for {html.name}"
        assert "require_client_login()" in _read(controller)
    assert "BRANDED_BACKEND_PATH_PARTS" in guards
    assert "sanitize_backend_urls" in guards


def test_app_route_redirect_targets_client_portal():
    hooks = _read(HOOKS_FILE)
    assert "sanitize_backend_urls" in hooks
    assert "enforce_backend_boundary" in hooks


def test_login_route_resolves_to_client_portal_page():
    hooks = _read(HOOKS_FILE)
    assert '{"from_route": "/login", "to_route": "client"}' not in hooks
    assert "website_path_resolver" not in hooks


def test_role_home_page_not_hijacking_public_root():
    """role_home_page mapped logged-in staff to a /app route, which hijacks the
    public site root (/) and 404s "View Website". Staff are System Users and are
    sent to /app by Frappe login regardless, so the hook must be absent."""
    hooks = _read(HOOKS_FILE)
    assert "role_home_page = {" not in hooks


def test_third_party_onboarding_is_hidden():
    """ERPNext desk onboarding ("journey with ERPNext") must be hidden on tenant
    desks via an after_migrate hook."""
    hooks = _read(HOOKS_FILE)
    onboarding = _read(ONBOARDING_FILE)
    assert "after_migrate" in hooks
    assert "hide_third_party_onboarding" in hooks
    assert "def hide_third_party_onboarding()" in onboarding
    assert "Module Onboarding" in onboarding
    assert "is_complete" in onboarding


def test_signup_application_has_approve_button():
    """The Signup Application form must expose a one-click approve that calls the
    control-plane approve_signup, shown only while the application is new."""
    js = _read(SIGNUP_JS_FILE)
    assert "add_custom_button" in js
    assert "entertainment_express.api.public.approve_signup" in js
    assert 'frm.doc.status !== "new"' in js


def test_public_home_and_portal_landing_split():
    """Guests must land on the public marketing home; only logged-in customers
    are routed to the login-gated /client portal."""
    hooks = _read(HOOKS_FILE)
    guards = _read(REQUEST_GUARDS_FILE)
    # The static hook that forced every visitor (incl. guests) to /client is gone.
    assert 'website_user_home_page = "/client"' not in hooks
    assert "get_website_user_home_page" in hooks
    assert 'home_page = "index"' in hooks
    assert "def get_website_user_home_page(" in guards


def test_client_portal_flow_order_sign_pay_plan():
    page = _read(CLIENT_INDEX_FILE)
    sign_idx = page.find('/client/sign')
    pay_idx = page.find('/client/pay')
    music_idx = page.find('/client/music')
    assert sign_idx != -1 and pay_idx != -1 and music_idx != -1
    assert sign_idx < pay_idx < music_idx


def test_portal_nav_order_sign_pay_plan():
    portal_base = _read(PORTAL_BASE_FILE)
    sign_idx = portal_base.find('/client/sign')
    pay_idx = portal_base.find('/client/pay')
    music_idx = portal_base.find('/client/music')
    assert sign_idx != -1 and pay_idx != -1 and music_idx != -1
    assert sign_idx < pay_idx < music_idx


def test_backend_boundary_roles_match_ee_employee_roles():
    guards = _read(REQUEST_GUARDS_FILE)
    assert '"EE Accounting"' in guards
    assert '"EE Office"' in guards
    assert '"EE Entertainer"' in guards
    assert '"EE Finance"' not in guards


def test_role_fixtures_include_office_and_entertainer():
    roles = _read(ROLE_FIXTURE_FILE)
    assert '"name": "EE Office"' in roles
    assert '"name": "EE Entertainer"' in roles
    assert '"desk_access": 1' in roles


def test_tenant_bootstrap_enforces_focus_desk_mode():
    source = _read(BOOTSTRAP_FILE)
    assert "_ensure_focus_desk_mode()" in source
    assert "frappe.defaults.set_global_default(\"ee_focus_desk\", 1)" in source
    assert "hide_unused_erpnext_workspaces" in source
    assert "execute(force=True)" in source


def test_provisioner_runs_bootstrap_as_subprocess_not_in_process():
    """Regression: in-process bootstrap.run() called frappe.destroy() and unbound
    the provisioning job, leaving it stuck in 'running'. Bootstrap must run via a
    `bench execute` subprocess against the tenant site instead."""
    provisioner = _read(PROVISIONER_FILE)
    bootstrap = _read(BOOTSTRAP_FILE)
    assert "bootstrap.run(site_name" not in provisioner
    assert "bootstrap.run_bootstrap" in provisioner
    assert "\"execute\"" in provisioner
    assert "def run_bootstrap(" in bootstrap


def test_bootstrap_seeds_erpnext_baseline_before_company():
    """Regression: automated provisioning skips the ERPNext setup wizard, so a
    fresh tenant has no Item Groups/UOMs/Warehouse Types and Company creation fails
    (Warehouse Type 'Transit'). Bootstrap must seed the ERPNext baseline first and
    give starter Items a stock_uom."""
    src = _read(BOOTSTRAP_FILE)
    assert "_ensure_erpnext_baseline()" in src
    assert "install_fixtures" in src
    assert "Warehouse Type" in src
    assert "stock_uom" in src
    # baseline must run before the company step
    assert src.index("_ensure_erpnext_baseline()") < src.index("_ensure_company(ctx)")


def test_workspace_hiding_uses_allowlist_model():
    source = _read(WORKSPACE_HIDE_PATCH_FILE)
    assert "ALLOWED_STANDARD_WORKSPACES" in source
    assert "ALLOWED_MODULES" in source
    assert "has_field(\"is_standard\")" in source
    assert '"public"' in source
    assert "frappe.db.set_value(\"Workspace\"" in source
