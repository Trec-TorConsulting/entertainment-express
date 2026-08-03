from entertainment_express.marketing.site_context import apply_common_page_context, get_marketing_settings


def get_context(context):
    settings = get_marketing_settings()
    apply_common_page_context(
        context,
        settings,
        "Request a Demo | Entertainment Express",
        "Book a walkthrough tailored to your entertainment business workflows.",
        "/demo",
    )
    context.form_id = "ee-demo-form"
    context.lead_type = "demo"
    context.source_page = "/demo"
    context.submit_label = "Request demo"
