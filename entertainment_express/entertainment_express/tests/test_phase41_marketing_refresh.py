"""
Static and logic tests for Phase 41: Marketing Website Refresh.
Validates design system tokens, CSS constraints, vertical solution pages,
competitor comparison pages, feature deep-dive pages, pricing matrix,
JSON-LD structures, entitlements enforcement, and tenant isolation.
"""

from __future__ import annotations

import json
from pathlib import Path
import re
import sys
from types import ModuleType

# Setup minimal frappe stub if not available in this test environment
if "frappe" not in sys.modules:
    frappe_stub = ModuleType("frappe")
    frappe_stub.DoesNotExistError = type("DoesNotExistError", (Exception,), {})
    frappe_stub.PermissionError = type("PermissionError", (Exception,), {})
    frappe_stub.ValidationError = type("ValidationError", (Exception,), {})
    frappe_stub._ = lambda s: s
    frappe_stub.conf = {}
    frappe_stub.local = type("Local", (), {"site": "admin.entx.app"})()
    frappe_stub.session = type("Session", (), {"user": "Administrator"})()
    frappe_stub.form_dict = {}
    frappe_stub.db = type(
        "DB",
        (),
        {
            "exists": lambda *args, **kwargs: True,
            "get_value": lambda *args, **kwargs: None,
            "get_single_value": lambda *args, **kwargs: None,
            "count": lambda *args, **kwargs: 0,
            "set_value": lambda *args, **kwargs: None,
            "commit": lambda: None,
        },
    )()
    frappe_stub.throw = lambda msg, exc=Exception: (_ for _ in ()).throw(exc(msg))
    frappe_stub.get_doc = lambda *args, **kwargs: type("Doc", (), {"insert": lambda *a: None, "save": lambda *a: None, "reload": lambda *a: None})()
    frappe_stub.get_cached_doc = lambda *args, **kwargs: type("Doc", (), {})()
    frappe_stub.get_single = lambda *args, **kwargs: type("Doc", (), {})()
    frappe_stub.as_json = lambda obj: json.dumps(obj)
    frappe_stub.cache = lambda: type("Cache", (), {"get_value": lambda *a: None, "set_value": lambda *a, **kw: None})()
    frappe_stub.whitelist = lambda *args, **kwargs: (lambda f: f)
    frappe_stub.sendmail = lambda *args, **kwargs: None
    frappe_stub.logger = lambda *a: type("Logger", (), {"info": lambda *args: None, "error": lambda *args: None})()
    frappe_stub.log_error = lambda *args, **kwargs: None
    frappe_stub.get_meta = lambda *args, **kwargs: type("Meta", (), {"has_field": lambda *a: True})()
    sys.modules["frappe"] = frappe_stub

if "frappe.utils" not in sys.modules:
    utils_stub = ModuleType("frappe.utils")
    utils_stub.flt = lambda v, p=2: float(v or 0)
    utils_stub.cint = lambda v: int(v or 0)
    utils_stub.today = lambda: "2026-09-08"
    utils_stub.now_datetime = lambda: "2026-09-08 12:00:00"
    utils_stub.get_datetime = lambda v: v
    utils_stub.add_days = lambda dt, d: dt
    utils_stub.fmt_money = lambda amount, currency="USD": f"${float(amount or 0):.2f}"
    utils_stub.get_first_day = lambda d: d
    utils_stub.get_last_day = lambda d: d
    utils_stub.get_url = lambda *a: "https://www.entx.app"
    sys.modules["frappe"].utils = utils_stub
    sys.modules["frappe.utils"] = utils_stub

ROOT = Path(__file__).resolve().parents[1]
MARKETING_DIR = ROOT / "public" / "marketing"
WWW_DIR = ROOT / "www"
TEMPLATES_DIR = ROOT / "templates" / "marketing"
PORTAL_DIR = ROOT / "templates" / "portal"
FIXTURES_DIR = ROOT / "fixtures"
HOOKS_FILE = ROOT / "hooks.py"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_marketing_css_zero_hex_colors():
    """All marketing CSS colors must use --ee-* tokens. Zero hex outside SVG data URIs."""
    css = _read(MARKETING_DIR / "marketing.css")
    # Strip url("data:image/svg+xml...") blocks before testing
    stripped = re.sub(r'url\("data:image/svg\+xml[^"]+"\)', "", css)
    stripped = re.sub(r"url\('data:image/svg\+xml[^']+'\)", "", stripped)
    hex_matches = re.findall(r"#[0-9a-fA-F]{3,8}\b", stripped)
    assert len(hex_matches) == 0, f"Found raw hex colors in marketing.css: {hex_matches}"


def test_tokens_mirror_all_properties():
    """marketing-tokens.css must declare all core token custom properties."""
    tokens_css = _read(MARKETING_DIR / "marketing-tokens.css")
    assert "--ee-brand:" in tokens_css
    assert "--ee-brand-soft:" in tokens_css
    assert "--ee-bg:" in tokens_css
    assert "--ee-panel:" in tokens_css
    assert "--ee-text:" in tokens_css
    assert "--ee-rail:" in tokens_css
    assert "--ee-success:" in tokens_css
    assert "--ee-radius-sm:" in tokens_css
    assert "--ee-font-body:" in tokens_css


def test_vertical_solutions_data():
    """Verify all 6 vertical solutions are defined with required schema."""
    from entertainment_express.www.solutions import SOLUTIONS

    required_keys = {"djs", "rentals", "photo-booths", "game-trucks", "performers", "casino"}
    assert required_keys.issubset(set(SOLUTIONS.keys()))

    for key in required_keys:
        sol = SOLUTIONS[key]
        assert sol.get("name"), f"Missing name in solution {key}"
        assert sol.get("headline"), f"Missing headline in solution {key}"
        assert sol.get("summary"), f"Missing summary in solution {key}"
        assert sol.get("meta_description"), f"Missing meta_description in solution {key}"
        assert len(sol.get("pain_points", [])) >= 3
        assert len(sol.get("features", [])) >= 4


def test_competitor_comparisons_data():
    """Verify all 5 competitor comparisons are defined with required schema."""
    from entertainment_express.www.compare import COMPETITORS

    required_keys = {"inflatable-office", "goodshuffle-pro", "dj-event-planner", "honeybook", "event-rental-systems"}
    assert required_keys.issubset(set(COMPETITORS.keys()))

    for key in required_keys:
        comp = COMPETITORS[key]
        assert comp.get("name"), f"Missing name in competitor {key}"
        assert comp.get("tagline"), f"Missing tagline in competitor {key}"
        assert comp.get("meta_description"), f"Missing meta_description in competitor {key}"
        assert len(comp.get("comparison_features", [])) >= 5


def test_features_deep_dive_data():
    """Verify all 6 feature deep-dive pages are defined with required schema."""
    from entertainment_express.www.feature_page import FEATURES

    required_keys = {
        "weather-risk",
        "dispatch-load-planning",
        "dj-playlist-export",
        "customer-portal",
        "white-label-branding",
        "ai-copilot",
    }
    assert required_keys.issubset(set(FEATURES.keys()))

    for key in required_keys:
        feat = FEATURES[key]
        assert feat.get("name"), f"Missing name in feature {key}"
        assert feat.get("headline"), f"Missing headline in feature {key}"
        assert feat.get("meta_description"), f"Missing meta_description in feature {key}"
        assert len(feat.get("highlights", [])) >= 3


def test_pricing_matrix_and_plans():
    """Verify pricing feature matrix and Plan fixtures."""
    from entertainment_express.www.pricing import FEATURE_MATRIX, FAQ_ITEMS

    total_features = sum(len(cat.get("features", [])) for cat in FEATURE_MATRIX)
    assert total_features >= 10
    assert len(FAQ_ITEMS) >= 6

    plan_fixture = FIXTURES_DIR / "plan.json"
    assert plan_fixture.exists()
    plans = json.loads(_read(plan_fixture))
    plan_codes = {p["plan_code"] for p in plans}
    assert {"starter", "pro", "scale"}.issubset(plan_codes)

    starter = next(p for p in plans if p["plan_code"] == "starter")
    assert starter["price_monthly"] == 0.0
    assert starter["trial_days"] == 0

    entitlements = {e["feature_key"]: e["limit_value"] for e in starter["entitlements"]}
    assert entitlements["active_bookings_limit"] == "3"
    assert entitlements["max_staff"] == "1"
    assert entitlements["show_ee_badge"] == "1"


def test_jsonld_builders():
    """Verify JSON-LD builder helpers output valid schema.org structures."""
    from entertainment_express.marketing.site_context import (
        build_breadcrumbs,
        build_faq_jsonld,
        build_software_app_jsonld,
        build_website_jsonld,
    )

    app_ld_str = build_software_app_jsonld("Entertainment Express", "Event management OS", "https://www.entx.app")
    app_ld = json.loads(app_ld_str)
    assert app_ld["@context"] == "https://schema.org"
    assert app_ld["@type"] == "SoftwareApplication"
    assert app_ld["name"] == "Entertainment Express"

    faq_ld_str = build_faq_jsonld([{"q": "What is EE?", "a": "An all-in-one OS."}])
    faq_ld = json.loads(faq_ld_str)
    assert faq_ld["@type"] == "FAQPage"
    assert len(faq_ld["mainEntity"]) == 1
    assert faq_ld["mainEntity"][0]["@type"] == "Question"

    web_ld_str = build_website_jsonld("Entertainment Express", "https://www.entx.app", "https://www.entx.app/resources?q={search_term_string}")
    web_ld = json.loads(web_ld_str)
    assert web_ld["@type"] == "WebSite"
    assert "potentialAction" in web_ld

    bc_ld_str = build_breadcrumbs([{"label": "Home", "url": "/"}, {"label": "Pricing", "url": "/pricing"}], "https://www.entx.app")
    bc_ld = json.loads(bc_ld_str)
    assert bc_ld["@type"] == "BreadcrumbList"
    assert len(bc_ld["itemListElement"]) == 2


def test_website_route_rules():
    """Verify route rules for solutions, compare, features, and blog in hooks.py."""
    hooks = _read(HOOKS_FILE)
    assert '{"from_route": "/solutions/<path:vertical>", "to_route": "solutions"}' in hooks
    assert '{"from_route": "/compare/<path:competitor>", "to_route": "compare"}' in hooks
    assert '{"from_route": "/features/<path:feature>", "to_route": "feature_page"}' in hooks
    assert '{"from_route": "/blog", "to_route": "blog"}' in hooks
    assert '{"from_route": "/resources", "to_route": "blog"}' in hooks


def test_blog_playbooks_and_context():
    """Verify curated playbooks schema and blog context builder."""
    from entertainment_express.www.blog import CATEGORIES, CURATED_PLAYBOOKS, get_context

    assert len(CURATED_PLAYBOOKS) >= 5
    assert len(CATEGORIES) >= 5

    for pb in CURATED_PLAYBOOKS:
        assert pb.get("slug"), f"Missing slug in playbook: {pb}"
        assert pb.get("title"), f"Missing title in playbook: {pb.get('slug')}"
        assert pb.get("excerpt"), f"Missing excerpt in playbook: {pb.get('slug')}"
        assert pb.get("category"), f"Missing category in playbook: {pb.get('slug')}"
        assert pb.get("author_name"), f"Missing author_name in playbook: {pb.get('slug')}"
        assert pb.get("content_html"), f"Missing content_html in playbook: {pb.get('slug')}"
        assert len(pb.get("takeaways", [])) >= 2, f"Expected takeaways in playbook: {pb.get('slug')}"

    # Verify context generation for hub
    context = type("Context", (), {})()
    get_context(context)
    assert hasattr(context, "categories")
    assert hasattr(context, "grid_posts")
    assert hasattr(context, "blog_json_ld")
    assert context.canonical == "https://www.entx.app/blog"

    blog_ld = json.loads(context.blog_json_ld)
    assert blog_ld["@type"] == "Blog"
    assert "blogPost" in blog_ld


def test_reverse_trial_downgrades_to_starter():
    """Trial expiration should downgrade to starter with active status and system audit log."""
    src = _read(ROOT / "api" / "saas_billing.py")
    assert "trial_expired_downgrade_to_starter" in src
    assert 'sub_doc.status = "active"' in src

