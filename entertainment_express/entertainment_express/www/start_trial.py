import frappe

from entertainment_express.marketing.site_context import apply_common_page_context, get_marketing_settings


def get_context(context):
    settings = get_marketing_settings()
    apply_common_page_context(
        context,
        settings,
        "Start Free Trial | Entertainment Express",
        "Start your trial and launch your branded entertainment operations workspace.",
        "/start-trial",
    )
    context.plan = (frappe.form_dict.get("plan") or "starter").strip().lower()
    context.no_sitemap = 1
