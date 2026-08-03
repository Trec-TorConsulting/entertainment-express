import json

import frappe


def get_marketing_settings():
    """Load Marketing Settings with safe defaults for public pages."""
    defaults = {
        "base_domain": "entertainmentexpress.app",
        "hero_headline": "Run your entertainment company on one platform.",
        "hero_subhead": "Bookings, crew scheduling, contracts, dispatch, and billing made simple.",
        "primary_cta_label": "Start free trial",
        "primary_cta_target": "/start-trial",
        "secondary_cta_label": "Request a demo",
        "secondary_cta_target": "/demo",
        "sales_notify_email": "",
        "analytics_provider": "none",
        "analytics_site_id": "",
        "consent_banner_enabled": 1,
        "consent_banner_text": "We use cookies to improve your experience. You can accept or reject non-essential cookies.",
        "captcha_provider": "none",
        "captcha_site_key": "",
        "section_feature_grid": 1,
        "section_pricing_teaser": 1,
        "section_testimonials": 1,
        "social_links": {},
    }

    if not frappe.db.exists("DocType", "Marketing Settings"):
        return defaults

    settings = frappe.get_single("Marketing Settings")
    values = defaults.copy()
    for key in defaults:
        if key == "social_links":
            continue
        value = getattr(settings, key, None)
        if value not in (None, ""):
            values[key] = value

    raw_social = getattr(settings, "social_links", "") or ""
    try:
        values["social_links"] = json.loads(raw_social) if raw_social else {}
    except Exception:
        values["social_links"] = {}

    return values


def apply_common_page_context(context, settings, title, description, route):
    context.title = title
    context.seo_title = title
    context.meta_description = description
    base_domain = settings.get("base_domain") or "entertainmentexpress.app"
    context.canonical = f"https://www.{base_domain}{route}"
    context.base_domain = base_domain
    context.analytics_provider = settings.get("analytics_provider", "none")
    context.analytics_site_id = settings.get("analytics_site_id", "")
    context.consent_banner_enabled = settings.get("consent_banner_enabled", 1)
    context.consent_banner_text = settings.get("consent_banner_text", "")
    context.og_title = title
    context.og_description = description
    context.og_image = "/assets/entertainment_express/marketing/img/og-default.svg"
    context.primary_cta_label = settings.get("primary_cta_label", "Start free trial")
    context.primary_cta_target = settings.get("primary_cta_target", "/start-trial")
    context.secondary_cta_label = settings.get("secondary_cta_label", "Request a demo")
    context.secondary_cta_target = settings.get("secondary_cta_target", "/demo")
    context.social_links = settings.get("social_links", {})
