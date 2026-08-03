from entertainment_express.marketing.site_context import apply_common_page_context, get_marketing_settings


def get_context(context):
    settings = get_marketing_settings()
    apply_common_page_context(
        context,
        settings,
        "About Entertainment Express",
        "Entertainment Express helps mobile entertainment companies run sales, operations, and field delivery from one platform.",
        "/about",
    )
