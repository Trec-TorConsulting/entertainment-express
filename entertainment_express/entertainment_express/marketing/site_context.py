import json

import frappe


def get_marketing_settings():
    """Load Marketing Settings with safe defaults for public pages."""
    defaults = {
        "base_domain": "entx.app",
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
        "coming_soon_mode": 1,
        "coming_soon_headline": "The Operating System for Entertainment Professionals",
        "coming_soon_subhead": "Bookings, crew scheduling, contracts, dispatch, and client management built specifically for mobile entertainment. Launching soon.",
        "coming_soon_launch_date": "",
        "beta_access_passcode": "EE-BETA-2026",
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


def build_breadcrumbs(items: list[dict], site_url: str = "") -> str:
    """Builds a JSON-LD BreadcrumbList from a list of dicts with 'label' and 'url'."""
    elements = []
    for idx, item in enumerate(items, start=1):
        url = item.get("url", "")
        if site_url and url.startswith("/"):
            url = f"{site_url.rstrip('/')}{url}"
        elements.append({
            "@type": "ListItem",
            "position": idx,
            "name": item.get("label", ""),
            "item": url,
        })
    payload = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": elements,
    }
    return json.dumps(payload, indent=2)


def build_software_app_jsonld(name: str, description: str, url: str, category: str = "BusinessApplication", offers: list[dict] = None) -> str:
    """Builds a JSON-LD SoftwareApplication schema."""
    payload = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": name,
        "description": description,
        "url": url,
        "applicationCategory": category or "BusinessApplication",
        "operatingSystem": "Web",
    }
    if offers:
        payload["offers"] = offers
    return json.dumps(payload, indent=2)


def build_faq_jsonld(questions: list[dict]) -> str:
    """Builds a JSON-LD FAQPage schema from [{question, answer}, ...]."""
    main_entities = []
    for q in questions:
        main_entities.append({
            "@type": "Question",
            "name": q.get("question", ""),
            "acceptedAnswer": {
                "@type": "Answer",
                "text": q.get("answer", ""),
            },
        })
    payload = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": main_entities,
    }
    return json.dumps(payload, indent=2)


def build_website_jsonld(name: str, url: str, search_url: str) -> str:
    """Builds a JSON-LD WebSite schema with SearchAction."""
    payload = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": name,
        "url": url,
        "potentialAction": {
            "@type": "SearchAction",
            "target": search_url,
            "query-input": "required name=search_term_string",
        },
    }
    return json.dumps(payload, indent=2)


def get_sitemap_routes() -> list[str]:
    """Returns all public marketing routes including dynamic dict-driven landing pages."""
    base_routes = [
        "/",
        "/pricing",
        "/features",
        "/about",
        "/contact",
        "/blog",
        "/demo",
        "/start-trial",
        "/legal/terms",
        "/legal/privacy",
        "/legal/cookies",
    ]
    solution_routes = [
        "/solutions/djs",
        "/solutions/rentals",
        "/solutions/photo-booths",
        "/solutions/game-trucks",
        "/solutions/casino",
        "/solutions/performers",
    ]
    compare_routes = [
        "/compare/inflatable-office",
        "/compare/goodshuffle-pro",
        "/compare/dj-event-planner",
        "/compare/honeybook",
        "/compare/event-rental-systems",
    ]
    feature_routes = [
        "/features/weather-risk",
        "/features/dispatch-load-planning",
        "/features/dj-playlist-export",
        "/features/customer-portal",
        "/features/white-label-branding",
        "/features/ai-copilot",
    ]
    return base_routes + solution_routes + compare_routes + feature_routes


def apply_common_page_context(context, settings, title, description, route, breadcrumbs: list[dict] = None):
    context.title = title
    context.seo_title = title
    context.meta_description = description
    base_domain = settings.get("base_domain") or "entx.app"
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

    context.breadcrumbs = breadcrumbs or []
    if breadcrumbs:
        context.breadcrumb_json_ld = build_breadcrumbs(breadcrumbs)
    else:
        context.breadcrumb_json_ld = None

    context.website_json_ld = None
