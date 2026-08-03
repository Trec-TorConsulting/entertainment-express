from entertainment_express.marketing.site_context import apply_common_page_context, get_marketing_settings


def get_context(context):
    settings = get_marketing_settings()
    apply_common_page_context(
        context,
        settings,
        "Features | Entertainment Express",
        "Explore booking, CRM, scheduling, billing, portal, mobile app, and analytics features for entertainment teams.",
        "/features",
    )
