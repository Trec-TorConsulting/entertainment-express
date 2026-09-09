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
            {"label": "Smart Operations Assistant", "key": "ai_assistant", "starter": "No", "pro": "No", "scale": "Yes"},
            {"label": "Partner Overflow Exchange", "key": "overflow_exchange", "starter": "No", "pro": "No", "scale": "Yes"},
            {"label": "Concierge Onboarding & Migration", "key": "concierge_migration", "starter": "Self-serve", "pro": "Self-serve", "scale": "Dedicated Agent"},
        ],
    },
]


PLAN_DETAILS = {
    "starter": {
        "display_name": "Starter",
        "tagline": "The Solo Hustler & Weekend Warrior",
        "ideal_for": "Solo DJs, performers & new rental startups (1–4 gigs/mo)",
        "icon": "🎧",
        "badge_text": "Free Forever",
        "badge_variant": "starter",
        "summary": "Everything you need to send professional quotes, e-sign contracts, and collect online deposits without monthly software overhead.",
        "cta_label": "Start Free in 60 Seconds",
        "cta_subtext": "No credit card required • Zero risk",
        "monthly_subtext": "Free forever • Upgrade whenever you're ready",
        "annual_subtext": "Free forever • Always $0",
        "savings_chip": None,
        "operator_takeaway": "Best for solo operators who want a rock-solid booking portal before spending a single dollar on software.",
        "key_benefits": [
            {"title": "1 Owner Account", "desc": "Full administrative control of your calendar & leads"},
            {"title": "3 Active Rolling Bookings", "desc": "Keep upcoming weekend contracts active"},
            {"title": "Self-Service Client Portal", "desc": "Clients sign contracts & pay deposits online 24/7"},
            {"title": "Direct Stripe Payments", "desc": "Card & ACH deposits straight to your bank account"},
            {"title": "Digital Contracts & Waivers", "desc": "Legally protect your gear with signature audit logs"},
            {"title": "Mobile Run Sheets", "desc": "Check load lists & gig details right on your phone"},
        ],
    },
    "pro": {
        "display_name": "Pro",
        "tagline": "The High-Performance Operating System",
        "ideal_for": "Growing crews, multi-rig DJs & 2–5 rental trucks",
        "icon": "⚡",
        "badge_text": "👑 Most Popular — 74% of Operators",
        "badge_variant": "pro",
        "is_popular": True,
        "summary": "The complete operations engine for busy weekend crews who cannot afford double bookings, missed gear, or rain cancellations.",
        "cta_label": "Start 14-Day Free Pro Trial",
        "cta_subtext": "Instant access • No credit card needed • Reverse-trial safe",
        "monthly_subtext": "Billed monthly • Cancel or pause anytime",
        "annual_subtext": "Billed annually ($948/yr) • 2 months free",
        "savings_chip": "Save $240/yr (2 Months Free)",
        "operator_takeaway": "Pays for itself with just 1 saved weekend booking or rain-date reschedule per season.",
        "operator_quote": {
            "quote": "We booked 18 weddings our first month on Pro. The automated contracts and Stripe deposits paid for the entire year in 48 hours.",
            "author": "Dave M.",
            "company": "Apex Sound & Lighting",
        },
        "key_benefits": [
            {"title": "Up to 5 Crew & Staff Accounts", "desc": "Dedicated logins for lead DJs, drivers & setup techs"},
            {"title": "Unlimited Bookings & Calendar", "desc": "Say yes to every Saturday gig without hitting limits"},
            {"title": "Drag & Drop Crew Dispatch", "desc": "Visual truck load planning with conflict alerts"},
            {"title": "Smart Weather & Rain-Date Alerts", "desc": "Automated radar warnings & rain reschedule links"},
            {"title": "White-Label & Custom Domain", "desc": "Your logo, your custom URL (e.g. portal.yourbrand.com)"},
            {"title": "Serato & Rekordbox DJ Export", "desc": "1-click playlist sync from client song requests"},
            {"title": "Automated SMS Reminders", "desc": "Zero client no-shows and automatic balance payment chasing"},
            {"title": "15 GB Cloud Storage", "desc": "Event photos, signed waivers, insurance COIs, and riders"},
        ],
    },
    "scale": {
        "display_name": "Scale",
        "tagline": "High-Volume Fleet & Multi-City Logistics",
        "ideal_for": "Multi-truck operations, AV production & franchises",
        "icon": "🚀",
        "badge_text": "Enterprise Production",
        "badge_variant": "scale",
        "summary": "Enterprise-grade logistics with AI dispatch optimization, partner overflow exchange, and dedicated concierge onboarding.",
        "cta_label": "Start 14-Day Free Scale Trial",
        "cta_subtext": "Full enterprise access • White-glove concierge migration",
        "monthly_subtext": "Billed monthly • Priority support included",
        "annual_subtext": "Billed annually ($2,388/yr) • 2 months free",
        "savings_chip": "Save $600/yr (2 Months Free)",
        "operator_takeaway": "Replaces 4 disconnected software subscriptions and an administrative assistant.",
        "operator_quote": {
            "quote": "We run 6 delivery trucks every weekend. Entertainment Express replaced our spreadsheets and cut dispatch chaos to zero.",
            "author": "Marcus & Elena V.",
            "company": "Blue Sky Inflatables & Games",
        },
        "key_benefits": [
            {"title": "Unlimited Staff, Crew & Trucks", "desc": "Never pay per-seat penalties as your team expands"},
            {"title": "Smart Operations Assistant", "desc": "Smart email drafting, venue rule summaries & schedule buffering"},
            {"title": "Partner Overflow Exchange", "desc": "Pass overflow gigs to vetted peer partners & earn booking fees"},
            {"title": "White-Glove Concierge Migration", "desc": "Our team imports your data from Goodshuffle, IO, or DJEP"},
            {"title": "100 GB Cloud Storage", "desc": "High-resolution media, inspection checklists, and archival data"},
            {"title": "Dedicated Priority Ops Agent", "desc": "Direct phone & Slack bridge with our engineering team"},
        ],
    },
}


def _enrich_plan(plan):
    code = (plan.get("code") or plan.get("plan_code") or plan.get("name", "")).strip().lower()
    details = PLAN_DETAILS.get(code) or {}

    monthly = int(plan.get("price_monthly", 0))
    annual_raw = plan.get("price_annual")
    annual_total = int(annual_raw) if annual_raw is not None else int(monthly * 12)
    # When annual price is stored as yearly total (e.g. 948), annual_mo is monthly rate (79)
    if annual_total > 0 and annual_total > monthly:
        annual_mo = int(annual_total / 12)
    elif annual_total > 0 and annual_total <= monthly:
        annual_mo = annual_total
        annual_total = annual_mo * 12
    else:
        annual_mo = 0
        annual_total = 0

    p = dict(plan)
    p["code"] = code
    p["display_name"] = details.get("display_name") or plan.get("name") or code.capitalize()
    p["tagline"] = details.get("tagline", "")
    p["ideal_for"] = details.get("ideal_for", "")
    p["icon"] = details.get("icon", "✨")
    p["badge_text"] = details.get("badge_text", "")
    p["badge_variant"] = details.get("badge_variant", "")
    p["is_popular"] = details.get("is_popular", False) or plan.get("is_popular", False) or (code == "pro")
    p["summary"] = details.get("summary") or plan.get("summary") or "Core entertainment event management tools."
    p["cta_label"] = details.get("cta_label") or plan.get("cta_label") or "Start Free Trial"
    p["cta_subtext"] = details.get("cta_subtext", "")
    p["cta_target"] = plan.get("cta_target") or f"/start-trial?plan={code}"
    p["price_monthly"] = monthly
    p["price_annual"] = annual_mo
    p["price_annual_total"] = annual_total
    p["monthly_subtext"] = details.get("monthly_subtext", "Billed monthly")
    p["annual_subtext"] = details.get("annual_subtext", "Billed annually")
    p["savings_chip"] = details.get("savings_chip")
    p["operator_takeaway"] = details.get("operator_takeaway", "")
    p["operator_quote"] = details.get("operator_quote")
    p["key_benefits"] = details.get("key_benefits", [])
    p["highlights"] = [f"{b['title']}: {b['desc']}" for b in p["key_benefits"]]
    return p


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

    raw_plans = payload.get("plans", [])
    context.pricing_error = pricing_error
    if not raw_plans:
        raw_plans = [
            {"name": "Starter", "code": "starter", "price_monthly": 0, "price_annual": 0, "trial_days": 0},
            {"name": "Pro", "code": "pro", "price_monthly": 99, "price_annual": 948, "trial_days": 14, "is_popular": True},
            {"name": "Scale", "code": "scale", "price_monthly": 249, "price_annual": 2388, "trial_days": 14},
        ]

    # Filter out any legacy archived/non-standard plans if present, maintaining canonical order
    canonical_order = ["starter", "pro", "scale"]
    plan_map = {}
    for p in raw_plans:
        code = (p.get("code") or p.get("plan_code") or p.get("name", "")).strip().lower()
        if code in canonical_order and code not in plan_map:
            plan_map[code] = p

    plans = []
    for code in canonical_order:
        if code in plan_map:
            plans.append(_enrich_plan(plan_map[code]))
        elif code in PLAN_DETAILS:
            # Fallback if specific canonical tier missing
            fallback_base = {
                "starter": {"name": "Starter", "code": "starter", "price_monthly": 0, "price_annual": 0, "trial_days": 0},
                "pro": {"name": "Pro", "code": "pro", "price_monthly": 99, "price_annual": 948, "trial_days": 14},
                "scale": {"name": "Scale", "code": "scale", "price_monthly": 249, "price_annual": 2388, "trial_days": 14},
            }[code]
            plans.append(_enrich_plan(fallback_base))

    context.plans = plans
    context.faq_items = FAQ_ITEMS
    context.feature_matrix = FEATURE_MATRIX

    # Build schema offers
    offers = []
    for plan in plans:
        offers.append({
            "@type": "Offer",
            "name": plan.get("display_name") or plan.get("name"),
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
