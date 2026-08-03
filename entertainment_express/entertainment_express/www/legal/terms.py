from entertainment_express.marketing.site_context import apply_common_page_context, get_marketing_settings


def get_context(context):
    settings = get_marketing_settings()
    apply_common_page_context(
        context,
        settings,
        "Terms of Service | Entertainment Express",
        "Terms governing use of Entertainment Express services.",
        "/legal/terms",
    )
