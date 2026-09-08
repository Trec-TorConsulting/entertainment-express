import frappe

from entertainment_express.marketing.site_context import (
    apply_common_page_context,
    build_software_app_jsonld,
    build_website_jsonld,
    get_marketing_settings,
)


def get_context(context):
    settings = get_marketing_settings()
    apply_common_page_context(
        context,
        settings,
        "Entertainment Express | Operations Platform for Mobile Entertainment",
        "Convert more leads and run events end-to-end with booking, crew scheduling, contracts, dispatch, and billing in one platform.",
        "/",
    )
    context.hero_headline = settings.get("hero_headline")
    context.hero_subhead = settings.get("hero_subhead")
    context.section_feature_grid = settings.get("section_feature_grid", 1)
    context.section_pricing_teaser = settings.get("section_pricing_teaser", 1)
    context.section_testimonials = settings.get("section_testimonials", 1)

    base_domain = context.base_domain or "entx.app"
    site_url = f"https://www.{base_domain}"

    # SoftwareApplication schema
    context.page_json_ld = build_software_app_jsonld(
        name="Entertainment Express",
        description=context.meta_description,
        url=site_url,
        category="BusinessApplication",
    )

    # WebSite schema with SearchAction
    context.website_json_ld = build_website_jsonld(
        name="Entertainment Express",
        url=site_url,
        search_url=f"{site_url}/resources?q={{search_term_string}}",
    )

    # Pricing teaser data
    teaser_plans = []
    try:
        if frappe.db.exists("DocType", "Plan"):
            records = frappe.get_all(
                "Plan",
                filters={"status": "active"},
                fields=["name", "plan_name", "price_monthly", "price_annual"],
                order_by="price_monthly asc",
                limit=3,
            )
            for r in records:
                name = r.plan_name or r.name
                price_val = int(r.price_monthly) if r.price_monthly is not None else 0
                teaser_plans.append({
                    "name": name,
                    "price": f"${price_val}",
                    "target": f"/start-trial?plan={r.name.lower()}",
                })
    except Exception:
        teaser_plans = []

    if not teaser_plans:
        teaser_plans = [
            {"name": "Starter", "price": "$0", "target": "/start-trial?plan=starter"},
            {"name": "Pro", "price": "$99", "target": "/start-trial?plan=pro"},
            {"name": "Scale", "price": "$249", "target": "/start-trial?plan=scale"},
        ]

    context.teaser_plans = teaser_plans
