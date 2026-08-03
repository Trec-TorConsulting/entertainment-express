import json

import frappe

from entertainment_express.api.marketing import get_pricing
from entertainment_express.marketing.site_context import apply_common_page_context, get_marketing_settings


def get_context(context):
    settings = get_marketing_settings()
    apply_common_page_context(
        context,
        settings,
        "Pricing | Entertainment Express",
        "Simple plans for growing entertainment companies with transparent feature limits.",
        "/pricing",
    )

    payload = {"billing": "monthly", "plans": []}
    context.pricing_error = ""
    try:
        payload = get_pricing("monthly")
    except Exception:
        frappe.log_error(frappe.get_traceback(), "Marketing pricing fallback")
        context.pricing_error = "Pricing is temporarily unavailable. Please request a demo."

    context.pricing = payload
    context.plans = payload.get("plans", [])
    offers = []
    for plan in context.plans:
        offers.append(
            {
                "@type": "Offer",
                "name": plan.get("name"),
                "price": plan.get("price_monthly"),
                "priceCurrency": plan.get("currency") or "USD",
                "url": plan.get("cta_target") or "/start-trial",
            }
        )
    context.page_json_ld = json.dumps(
        {
            "@context": "https://schema.org",
            "@type": "Product",
            "name": "Entertainment Express",
            "description": "Operations software for mobile entertainment companies.",
            "offers": offers,
        }
    )
