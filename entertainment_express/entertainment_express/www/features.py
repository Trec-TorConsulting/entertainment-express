from entertainment_express.marketing.site_context import (
    apply_common_page_context,
    build_software_app_jsonld,
    get_marketing_settings,
)
from entertainment_express.www.feature_page import FEATURES


def get_context(context):
    settings = get_marketing_settings()
    breadcrumbs = [
        {"label": "Home", "url": "/"},
        {"label": "Features", "url": "/features"},
    ]

    apply_common_page_context(
        context,
        settings,
        "Platform Features | Entertainment Express",
        "Explore weather risk automation, visual dispatch, DJ playlist export, client portals, white-label branding, and AI Copilot.",
        "/features",
        breadcrumbs=breadcrumbs,
    )

    base_domain = context.base_domain or "entx.app"
    site_url = f"https://www.{base_domain}"

    context.page_json_ld = build_software_app_jsonld(
        name="Entertainment Express Features Hub",
        description=context.meta_description,
        url=f"{site_url}/features",
        category="BusinessApplication",
    )

    context.features = FEATURES
    context.feature_keys = list(FEATURES.keys())
    context.no_cache = 1
