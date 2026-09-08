import frappe

from entertainment_express.marketing.site_context import (
    apply_common_page_context,
    build_breadcrumbs,
    build_software_app_jsonld,
    get_marketing_settings,
)


COMPETITORS = {
    "inflatable-office": {
        "name": "Inflatable Office",
        "tagline": "Modern Alternative to Inflatable Office",
        "meta_description": "Switch from Inflatable Office to Entertainment Express. Auto-import your inventory, customers, and bookings in 15 minutes. Modern UI, weather automation, and mobile dispatch.",
        "weaknesses": [
            "Outdated 2010s-era interface that confuses clients and team members",
            "No automated weather risk alerts or rain-date rebooking workflows",
            "No native mobile app for field delivery crews and drivers",
            "Clunky, manual data exports and legacy database architecture",
        ],
        "comparison_features": [
            {"feature": "Modern Portal UI (Glassmorphic)", "ee": "Yes — Stripe-grade", "competitor": "No — 2010s-era"},
            {"feature": "Weather Risk Automation (Wind/Rain/Lightning)", "ee": "Yes", "competitor": "No"},
            {"feature": "Mobile Crew App (PWA & Offline)", "ee": "Yes", "competitor": "No"},
            {"feature": "15-Minute Automated Preset Import", "ee": "Yes", "competitor": "N/A"},
            {"feature": "Custom Domain & White-Label", "ee": "Yes", "competitor": "Limited / Add-on"},
            {"feature": "E-Signature & Contracts", "ee": "Yes", "competitor": "Basic"},
            {"feature": "Visual Dispatch & Load Board", "ee": "Yes", "competitor": "Limited list view"},
            {"feature": "AI Event Copilot", "ee": "Scale plan", "competitor": "No"},
        ],
        "migration_cta": "Import your Inflatable Office data in 15 minutes with our automated presets",
        "keywords": ["Inflatable Office alternative", "Inflatable Office vs", "switch from Inflatable Office", "bounce house booking software"],
    },
    "goodshuffle-pro": {
        "name": "Goodshuffle Pro",
        "tagline": "Modern Alternative to Goodshuffle Pro",
        "meta_description": "Looking for a Goodshuffle Pro alternative? Entertainment Express provides complete crew dispatch, weather automation, live DJ workflows, and predictable transparent pricing.",
        "weaknesses": [
            "High per-user transaction fees and steep pricing tiers that penalize volume",
            "Designed primarily for high-end decor, lacking specialized field dispatch and DJ tools",
            "No weather forecast automation for outdoor party and inflatable rentals",
            "Limited mobile experience for field delivery and setup staff",
        ],
        "comparison_features": [
            {"feature": "Predictable Transparent Pricing (No per-quote fees)", "ee": "Yes — Flat rate", "competitor": "Expensive per-seat"},
            {"feature": "Weather Risk & Rain-Date Automation", "ee": "Yes", "competitor": "No"},
            {"feature": "Serato / Rekordbox Music Export", "ee": "Yes", "competitor": "No"},
            {"feature": "Mobile Crew App (Checklists & GPS)", "ee": "Yes", "competitor": "Limited web"},
            {"feature": "Drag-and-Drop Dispatch Board", "ee": "Yes", "competitor": "Basic calendar"},
            {"feature": "White-Label Customer Portal", "ee": "Yes", "competitor": "Yes"},
            {"feature": "Contracts & E-Sign Flow", "ee": "Yes", "competitor": "Yes"},
            {"feature": "AI Event Copilot", "ee": "Scale plan", "competitor": "No"},
        ],
        "migration_cta": "Switch from Goodshuffle Pro and cut your software bill in half",
        "keywords": ["Goodshuffle Pro alternative", "Goodshuffle Pro pricing", "Goodshuffle vs Entertainment Express"],
    },
    "dj-event-planner": {
        "name": "DJ Event Planner",
        "tagline": "Modern Alternative to DJ Event Planner (DJEP)",
        "meta_description": "Replace DJ Event Planner with Entertainment Express. Modern client portal, Serato playlist export, mobile crew run sheets, contracts, and instant Stripe checkout.",
        "weaknesses": [
            "Dated 2000s interface that frustrates modern wedding couples and corporate planners",
            "No native export to Serato or Rekordbox DJ software crates",
            "Slow server response times and complex setup requiring weeks of configuration",
            "No multi-vertical support if you also offer photo booths, inflatables, or games",
        ],
        "comparison_features": [
            {"feature": "Modern, Mobile-First Client Experience", "ee": "Yes — 100% responsive", "competitor": "No — 2000s desktop UI"},
            {"feature": "1-Click Serato/Rekordbox Playlist Export", "ee": "Yes", "competitor": "No"},
            {"feature": "Collaborative Real-Time Timeline", "ee": "Yes", "competitor": "Static text forms"},
            {"feature": "Guest Song Request Portal with Voting", "ee": "Yes", "competitor": "Basic form"},
            {"feature": "Multi-Vertical Fleet Dispatch (Booths/Games)", "ee": "Yes", "competitor": "DJ-only"},
            {"feature": "Instant Stripe & Apple Pay Checkout", "ee": "Yes", "competitor": "Legacy gateways"},
            {"feature": "Automated Contracts & Digital Signatures", "ee": "Yes", "competitor": "Basic"},
            {"feature": "AI Assistant for Client Inquiries", "ee": "Scale plan", "competitor": "No"},
        ],
        "migration_cta": "Migrate your DJ Event Planner clients and packages in minutes",
        "keywords": ["DJ Event Planner alternative", "DJEP alternative", "best DJ software for bookings", "DJ booking CRM"],
    },
    "honeybook": {
        "name": "HoneyBook",
        "tagline": "Event Operations Alternative to HoneyBook",
        "meta_description": "Why live entertainment companies outgrow HoneyBook: Entertainment Express provides inventory conflict management, truck load dispatch, weather alerts, and crew scheduling.",
        "weaknesses": [
            "Built for solo photographers and freelancers, not multi-crew entertainment fleets",
            "Zero inventory tracking or equipment double-booking prevention",
            "No visual crew dispatch board or vehicle route planning",
            "No weather threshold monitoring or industry-specific vertical tools",
        ],
        "comparison_features": [
            {"feature": "Equipment & Unit Conflict Management", "ee": "Yes — Real-time locks", "competitor": "No — Solo-focused"},
            {"feature": "Multi-Crew Dispatch & Run Sheets", "ee": "Yes", "competitor": "No"},
            {"feature": "Weather Risk Monitoring & Alerts", "ee": "Yes", "competitor": "No"},
            {"feature": "Client Proposal & Smart Contracts", "ee": "Yes", "competitor": "Yes"},
            {"feature": "Integrated Online Payments (Stripe)", "ee": "Yes", "competitor": "Yes"},
            {"feature": "Crew Mobile App with Packing Lists", "ee": "Yes", "competitor": "Basic mobile"},
            {"feature": "Custom Domain & Full White-Label", "ee": "Yes", "competitor": "Limited"},
            {"feature": "Reverse-Trial Model (Free Tier Included)", "ee": "Yes", "competitor": "No free plan"},
        ],
        "migration_cta": "Graduate from HoneyBook to dedicated event fleet operations",
        "keywords": ["HoneyBook alternative for event rental", "HoneyBook vs Entertainment Express", "DJ software alternative to HoneyBook"],
    },
    "event-rental-systems": {
        "name": "Event Rental Systems (ERS)",
        "tagline": "Modern Alternative to Event Rental Systems",
        "meta_description": "Upgrade from Event Rental Systems (ERS) to Entertainment Express. Modern consumer checkout, automated weather alerts, mobile driver app, and transparent flat pricing.",
        "weaknesses": [
            "Rigid, clunky checkout flow that drives high shopping cart abandonment",
            "Legacy backend system with slow page loads and confusing admin settings",
            "Lack of modern crew mobile tools for digital delivery sign-offs",
            "Expensive setup fees and locked-in long-term contracts",
        ],
        "comparison_features": [
            {"feature": "High-Converting Consumer Checkout", "ee": "Yes — Under 90 sec", "competitor": "Multi-step drop-off"},
            {"feature": "Automated Weather Cancellation Risk", "ee": "Yes", "competitor": "No"},
            {"feature": "Mobile Driver App with Turn-by-Turn", "ee": "Yes", "competitor": "Limited"},
            {"feature": "Transparent Flat Pricing (No Hidden Fees)", "ee": "Yes", "competitor": "Complex pricing"},
            {"feature": "Instant Setup (No onboarding fee)", "ee": "Yes", "competitor": "Costly setup fees"},
            {"feature": "Digital Damage Photos & Waivers", "ee": "Yes", "competitor": "Basic"},
            {"feature": "Multi-Vertical Support (DJs, Booths, Trucks)", "ee": "Yes", "competitor": "Inflatables only"},
            {"feature": "Modern Web & Mobile UI", "ee": "Yes — Tailwind/Tokens", "competitor": "Legacy CSS"},
        ],
        "migration_cta": "Export your ERS catalog and switch without downtime",
        "keywords": ["Event Rental Systems alternative", "ERS software alternative", "party rental software switch"],
    },
}


def get_context(context):
    settings = get_marketing_settings()
    slug = (frappe.form_dict.get("competitor") or "").strip().lower()

    if slug not in COMPETITORS:
        frappe.throw("Competitor comparison page not found", frappe.DoesNotExistError)

    competitor = COMPETITORS[slug]
    route = f"/compare/{slug}"
    title = f"{competitor['tagline']} | Entertainment Express"
    meta_desc = competitor["meta_description"]

    breadcrumbs = [
        {"label": "Home", "url": "/"},
        {"label": "Compare", "url": "/compare/inflatable-office"},
        {"label": competitor["name"], "url": route},
    ]

    apply_common_page_context(
        context,
        settings,
        title,
        meta_desc,
        route,
        breadcrumbs=breadcrumbs,
    )

    base_domain = context.base_domain or "entx.app"
    site_url = f"https://www.{base_domain}"

    # SoftwareApplication JSON-LD
    context.page_json_ld = build_software_app_jsonld(
        name=f"Entertainment Express vs {competitor['name']}",
        description=meta_desc,
        url=f"{site_url}{route}",
        category="BusinessApplication",
    )

    context.slug = slug
    context.competitor = competitor
    context.all_competitors = COMPETITORS
    context.competitor_keys = list(COMPETITORS.keys())
    context.no_cache = 1
