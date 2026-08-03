from entertainment_express.marketing.site_context import apply_common_page_context, get_marketing_settings


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
