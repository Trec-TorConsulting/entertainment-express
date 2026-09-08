import json

import frappe

from entertainment_express.api.marketing import get_pricing
from entertainment_express.marketing.site_context import (
    apply_common_page_context,
    build_faq_jsonld,
    build_software_app_jsonld,
    get_marketing_settings,
)


FAQ_ITEMS = [
    {
        "question": "Is there a free plan?",
        "answer": "Yes! Our Starter plan is 100% free forever. It includes up to 3 active bookings, 1 staff account, and core booking tools so solo operators can launch with zero upfront software cost.",
    },
    {
        "question": "Do I need a credit card?",
        "answer": "No. You can begin immediately on the free Starter plan or start a 14-day free trial of Pro or Scale with zero credit card required.",
    },
    {
        "question": "Can I switch plans?",
        "answer": "Yes, you can upgrade or downgrade between plans at any time directly in your owner settings. Plan changes take effect immediately with prorated billing.",
    },
    {
        "question": "What happens after the trial?",
        "answer": "If you do not attach a payment method before your 14-day trial ends, your account automatically downgrades to our Free Starter plan. We never suspend your account or delete your data.",
    },
    {
        "question": "Can I cancel anytime?",
        "answer": "Yes, there are no lock-in contracts or termination fees. You can cancel your monthly or annual subscription with one click from your billing settings.",
    },
    {
        "question": "Do you offer annual discounts?",
        "answer": "Yes! Paying annually gives you two months free (up to 20% discount). Pro is $79/month billed annually ($948/year) and Scale is $199/month billed annually ($2,388/year).",
    },
    {
        "question": "What payment methods do you accept?",
        "answer": "We accept Visa, MasterCard, American Express, Discover, Apple Pay, Google Pay, and ACH bank transfers for annual subscriptions.",
    },
    {
        "question": "How does data migration work?",
        "answer": "We offer 1-click automated import presets for Inflatable Office, Goodshuffle Pro, DJ Event Planner, and standard CSV spreadsheets. On the Scale tier, our team provides white-glove concierge migration.",
    },
]

FEATURE_MATRIX = [
    {
        "category": "Core Usage Limits",
        "features": [
            {"label": "Staff Accounts", "key": "max_staff", "starter": "1 staff", "pro": "5 staff", "scale": "Unlimited"},
            {"label": "Active Bookings", "key": "active_bookings_limit", "starter": "3 active", "pro": "Unlimited", "scale": "Unlimited"},
            {"label": "File & Photo Storage", "key": "storage_gb", "starter": "500 MB", "pro": "15 GB", "scale": "100 GB"},
        ],
    },
    {
        "category": "Branding & Portal",
        "features": [
            {"label": "Client Portal & E-Signature", "key": "client_portal", "starter": "Yes", "pro": "Yes", "scale": "Yes"},
            {"label": "Custom Domain & SSL", "key": "custom_domain", "starter": "No", "pro": "Yes", "scale": "Yes"},
            {"label": "Full White-Labeling", "key": "white_label", "starter": "No", "pro": "Yes", "scale": "Yes"},
            {"label": "Entertainment Express Badge", "key": "show_ee_badge", "starter": "Shown in footer", "pro": "Removed", "scale": "Removed"},
        ],
    },
    {
        "category": "Automation & Tools",
        "features": [
            {"label": "Weather Risk & Rain-Dates", "key": "weather_risk", "starter": "No", "pro": "Yes", "scale": "Yes"},
            {"label": "SMS Client & Crew Reminders", "key": "sms_enabled", "starter": "No", "pro": "Yes", "scale": "Yes"},
            {"label": "Serato & Rekordbox DJ Export", "key": "playlist_export", "starter": "No", "pro": "Yes", "scale": "Yes"},
            {"label": "AI Event Operations Copilot", "key": "ai_assistant", "starter": "No", "pro": "No", "scale": "Yes"},
            {"label": "Partner Overflow Exchange", "key": "overflow_exchange", "starter": "No", "pro": "No", "scale": "Yes"},
            {"label": "Concierge Onboarding & Migration", "key": "concierge_migration", "starter": "Self-serve", "pro": "Self-serve", "scale": "Dedicated Agent"},
        ],
    },
]


def get_context(context):
    settings = get_marketing_settings()
    breadcrumbs = [
        {"label": "Home", "url": "/"},
        {"label": "Pricing", "url": "/pricing"},
    ]

    apply_common_page_context(
        context,
        settings,
        "Pricing & Plans | Entertainment Express",
        "Transparent pricing with a 100% free Starter tier and 14-day reverse trial. Starter ($0), Pro ($99/mo), and Scale ($249/mo).",
        "/pricing",
        breadcrumbs=breadcrumbs,
    )

    base_domain = context.base_domain or "entx.app"
    site_url = f"https://www.{base_domain}"

    # Load plans from control-plane API or fallback
    pricing_error = None
    payload = {"billing": "monthly", "plans": []}
    try:
        payload = get_pricing("monthly")
    except Exception:
        pricing_error = "Pricing is temporarily unavailable. Please refresh or contact support."

    plans = payload.get("plans", [])
    context.pricing_error = pricing_error
    if not plans:
        plans = [
            {
                "name": "Starter",
                "code": "starter",
                "price_monthly": 0,
                "price_annual": 0,
                "trial_days": 0,
                "summary": "Essential booking tools for solo operators and new entertainment startups.",
                "cta_label": "Start Free",
                "cta_target": "/start-trial?plan=starter",
                "highlights": ["1 staff account", "Up to 3 active bookings", "Client portal & contracts", "Online deposits (Stripe)", "500 MB storage"],
            },
            {
                "name": "Pro",
                "code": "pro",
                "price_monthly": 99,
                "price_annual": 79,
                "trial_days": 14,
                "is_popular": True,
                "summary": "Unlimited bookings, crew dispatch, custom domain, and weather automation for growing teams.",
                "cta_label": "Start Free 14-Day Trial",
                "cta_target": "/start-trial?plan=pro",
                "highlights": ["Up to 5 staff accounts", "Unlimited active bookings", "Weather risk automation", "White-label + custom domain", "Serato/Rekordbox export", "15 GB storage"],
            },
            {
                "name": "Scale",
                "code": "scale",
                "price_monthly": 249,
                "price_annual": 199,
                "trial_days": 14,
                "summary": "AI Copilot, unlimited staff, partner overflow exchange, and dedicated concierge onboarding.",
                "cta_label": "Start Free 14-Day Trial",
                "cta_target": "/start-trial?plan=scale",
                "highlights": ["Unlimited staff & crew", "Unlimited active bookings", "AI Event Copilot", "Partner Overflow Exchange", "Concierge migration", "100 GB storage"],
            },
        ]

    context.plans = plans
    context.faq_items = FAQ_ITEMS
    context.feature_matrix = FEATURE_MATRIX

    # Build schema offers
    offers = []
    for plan in plans:
        offers.append({
            "@type": "Offer",
            "name": plan.get("name"),
            "price": plan.get("price_monthly", 0),
            "priceCurrency": plan.get("currency") or "USD",
            "url": f"{site_url}{plan.get('cta_target', '/start-trial')}",
        })

    # SoftwareApplication JSON-LD with offers
    context.page_json_ld = build_software_app_jsonld(
        name="Entertainment Express",
        description=context.meta_description,
        url=f"{site_url}/pricing",
        category="BusinessApplication",
        offers=offers,
    )

    # FAQPage JSON-LD
    context.faq_json_ld = build_faq_jsonld(FAQ_ITEMS)
    context.no_cache = 1
