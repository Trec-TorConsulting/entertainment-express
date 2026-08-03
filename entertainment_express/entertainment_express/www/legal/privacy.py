from entertainment_express.marketing.site_context import apply_common_page_context, get_marketing_settings


def get_context(context):
    settings = get_marketing_settings()
    apply_common_page_context(
        context,
        settings,
        "Privacy Policy | Entertainment Express",
        "How Entertainment Express collects, uses, and protects your data.",
        "/legal/privacy",
    )
