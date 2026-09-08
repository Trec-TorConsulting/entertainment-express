import frappe

from entertainment_express.marketing.site_context import (
    apply_common_page_context,
    build_breadcrumbs,
    build_software_app_jsonld,
    get_marketing_settings,
)


FEATURES = {
    "weather-risk": {
        "name": "Weather Risk & Rain-Date Automation",
        "headline": "Stop Losing Money and Client Trust to Bad Weather",
        "meta_description": "Automated weather threshold alerts, rain-date rebooking, and outdoor event risk management for party rental and entertainment companies.",
        "problem": "Outdoor events are constantly at the mercy of unpredictable weather. Most operators manually check weather apps and scramble on Friday night to notify disappointed clients about cancellations — losing deposits, customer trust, and valuable equipment to sudden rain and wind storms.",
        "solution": "Entertainment Express monitors live hyper-local weather forecasts for every outdoor event. When wind, precipitation, or lightning thresholds exceed your safety policies, our automation alerts your team, triggers client notifications with a 1-click rain-date reschedule offer, and updates booking schedules seamlessly.",
        "highlights": [
            "Hyper-local weather forecast monitoring per event coordinate",
            "Configurable wind speed, rain probability, and lightning thresholds",
            "Automated client SMS/email alerts with one-click rain-date rebooking",
            "Protects expensive inflatables, tents, and audio equipment from wind damage",
            "Preserves customer goodwill and deposits instead of issuing forced refunds",
        ],
        "keywords": ["party rental weather cancellation", "event weather risk software", "inflatable wind alerts", "rain date rescheduling"],
        "icon": "🌦️",
    },
    "dispatch-load-planning": {
        "name": "Dispatch & Truck Load Planning",
        "headline": "Zero Dispatch Misses with Visual Fleet Scheduling",
        "summary": "Drag-and-drop crew scheduling, truck loading verification, and route optimization in one visual dispatch board.",
        "meta_description": "Visual dispatch board and truck load planning for entertainment fleets. Eliminate double bookings, coordinate delivery crews, and streamline equipment check-outs.",
        "problem": "Coordinating multiple trucks, dozens of crew members, and hundreds of equipment pieces across weekend events usually relies on messy whiteboards, printed clipboards, and frantic phone calls when gear is inevitably left behind at the warehouse.",
        "solution": "Our visual drag-and-drop dispatch board brings your entire weekend operation onto a single live screen. Assign drivers and crew to specific vehicles, verify digital load checklists before trucks leave the dock, and cluster delivery routes to save fuel and drive time.",
        "highlights": [
            "Visual drag-and-drop dispatch calendar with live conflict alerts",
            "Truck capacity calculations and digital equipment loading checklists",
            "Turn-by-turn mobile driving directions and venue dock instructions for crew",
            "Shift broadcast and one-click SMS availability confirmations",
            "Real-time GPS tracking and on-site check-in / check-out timestamps",
        ],
        "keywords": ["party rental dispatch software", "event load planning", "delivery crew dispatch app", "fleet scheduling software"],
        "icon": "🚚",
    },
    "dj-playlist-export": {
        "name": "Serato & Rekordbox DJ Playlist Export",
        "headline": "From Guest Requests to DJ Crates in One Click",
        "summary": "Automated music request collection, client must-play management, and native crate file export for professional wedding DJs.",
        "meta_description": "DJ music planning software with 1-click Serato and Rekordbox playlist export. Eliminate manual track copying and streamline wedding timeline coordination.",
        "problem": "DJs spend hours manually re-typing guest song requests from emails, paper planning forms, and Spotify links into Serato or Rekordbox crates before every Saturday night performance, often creating track typos and cue point confusion.",
        "solution": "Couples and guests submit requests through a customized, mobile-optimized music portal. With one click, export the entire approved playlist — categorized by Cocktail, Dinner, Special Dances, and Open Dancing — directly into native Serato (.crate) or Rekordbox XML formats.",
        "highlights": [
            "Native 1-click export to Serato DJ Pro crate files and Rekordbox XML",
            "Organized crate buckets for Must-Play, Play If Possible, and Do-Not-Play",
            "Spotify integration with automatic BPM, key, and explicit tag detection",
            "Guest request portal with host moderation and upvoting controls",
            "Timeline-anchored music cues for grand entrance, first dance, and cake cutting",
        ],
        "keywords": ["Serato playlist export", "Rekordbox crate export", "DJ music planning software", "wedding DJ request app"],
        "icon": "🎵",
    },
    "customer-portal": {
        "name": "Client Self-Service & E-Sign Portal",
        "headline": "Close Quotes and Collect Deposits in Under 90 Seconds",
        "summary": "Modern, white-labeled client portal for contract e-signing, deposit payments, event timeline planning, and invoice receipts.",
        "meta_description": "White-labeled customer portal for event companies. Online contract signing, Stripe credit card deposits, timeline builder, and guest collaboration.",
        "problem": "Sending static PDF contracts, chasing paper checks, and exchanging dozens of emails for minor timeline changes creates friction that slows down sales and causes prospective clients to book with faster-responding competitors.",
        "solution": "Provide your clients with a modern, Stripe-grade portal that carries your branding and custom domain. Clients review interactive proposals, customize add-ons, sign legally binding contracts digitally, and pay deposits with Apple Pay or credit card in seconds.",
        "highlights": [
            "Legally binding digital signature capture compliant with ESIGN/UETA",
            "Instant credit card, Apple Pay, Google Pay, and ACH deposit collection",
            "Collaborative event timeline builder with instant updates for coordinators",
            "Automated payment schedule reminders and balance auto-charging",
            "Mobile-optimized for high-converting smartphone completions",
        ],
        "keywords": ["event customer portal", "online contract e-sign event", "event deposit payment portal", "client self-service event software"],
        "icon": "📱",
    },
    "white-label-branding": {
        "name": "White-Label Branding & Custom Domain",
        "headline": "Your Brand in the Spotlight, Not Our Software",
        "summary": "Complete white-labeling with custom domain, tenant color tokens, personalized email templates, and branded client portals.",
        "meta_description": "White-label event booking software with custom domain SSL, customized color themes, custom email domains, and complete brand control.",
        "problem": "Generic booking platforms force your clients to see their logo, their color scheme, and their domain name — diluting your hard-earned local brand reputation and making your company look like a franchise or reseller.",
        "solution": "Entertainment Express runs completely behind your brand. Connect your custom domain (e.g. portal.yourbrand.com) with automated SSL, match your primary and secondary color palette, and send transactional emails and invoices from your own business email address.",
        "highlights": [
            "Custom domain mapping with automated Let's Encrypt SSL certificates",
            "Full design token customizer for brand colors, logos, and favicons",
            "Transactional emails sent from your verified business domain (DKIM/SPF)",
            "Remove all 'Powered by' badges on Pro and Scale tiers",
            "Unified brand experience across desktop and mobile browsers",
        ],
        "keywords": ["white label event software", "custom domain client portal", "branded event booking system", "white label rental software"],
        "icon": "✨",
    },
    "ai-copilot": {
        "name": "AI Event Operations Copilot",
        "headline": "Supercharge Your Operations Team with Event AI",
        "summary": "AI-powered inquiry responses, contract summary generation, timeline recommendations, and intelligent customer follow-ups.",
        "meta_description": "AI copilot for event companies. Automate email replies, summarize venue contracts, suggest event timelines, and convert inquiries faster.",
        "problem": "Event business owners spend 15+ hours every week answering repetitive inquiry emails, reviewing dense venue contract clauses, drafting custom timelines, and following up on unconfirmed proposals.",
        "solution": "Built right into your operations dashboard, AI Copilot analyzes customer inquiries and instantly drafts polite, tailored responses based on your package pricing and availability. It identifies timeline conflicts and suggests optimal schedule buffers automatically.",
        "highlights": [
            "Instant AI-drafted email responses trained on your service packages",
            "Automated contract and venue restriction summarization",
            "Smart timeline schedule suggestions with realistic setup/teardown buffers",
            "Automated proposal follow-up sequences that convert hesitant leads",
            "Available on the Scale plan with strict tenant data privacy guarantees",
        ],
        "keywords": ["AI event management software", "AI copilot for event business", "event booking automation AI", "automated quoting event software"],
        "icon": "🤖",
    },
}


def get_context(context):
    settings = get_marketing_settings()
    slug = (frappe.form_dict.get("feature") or "").strip().lower()

    if slug not in FEATURES:
        frappe.throw("Feature deep-dive page not found", frappe.DoesNotExistError)

    feature = FEATURES[slug]
    route = f"/features/{slug}"
    title = f"{feature['name']} | Entertainment Express"
    meta_desc = feature["meta_description"]

    breadcrumbs = [
        {"label": "Home", "url": "/"},
        {"label": "Features", "url": "/features"},
        {"label": feature["name"], "url": route},
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
        name=feature["name"],
        description=meta_desc,
        url=f"{site_url}{route}",
        category="BusinessApplication",
    )

    context.slug = slug
    context.feature = feature
    context.all_features = FEATURES
    context.feature_keys = list(FEATURES.keys())
    context.no_cache = 1
