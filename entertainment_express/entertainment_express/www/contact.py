from entertainment_express.marketing.site_context import apply_common_page_context, get_marketing_settings


def get_context(context):
    settings = get_marketing_settings()
    apply_common_page_context(
        context,
        settings,
        "Contact Sales | Entertainment Express",
        "Connect with our team to discuss fit, migration, and implementation planning.",
        "/contact",
    )
    context.form_id = "ee-contact-form"
    context.lead_type = "contact"
    context.source_page = "/contact"
    context.submit_label = "Contact sales"
