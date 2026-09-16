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
        "name": "Smart Operations Assistant",
        "headline": "Save Hours on Everyday Event Communications & Timelines",
        "summary": "Faster inquiry replies, plain-English contract summaries, realistic day-of schedules, and automated client follow-ups.",
        "meta_description": "Smart assistant for event operations. Draft lead replies, review venue contract terms, build realistic event timelines, and close more bookings.",
        "problem": "Event operators lose hours every day answering identical pricing emails, parsing dense venue restrictions, building day-of timelines by hand, and chasing down unconfirmed quotes.",
        "solution": "Built straight into your daily workflow, our assistant helps you draft thoughtful, customized replies in seconds using your own rates and calendar. It flags venue rules, catches schedule bottlenecks, and handles routine follow-up so you can focus on running events.",
        "highlights": [
            "Quick-draft email responses tailored to your packages and real availability",
            "Plain-language summaries of venue load-in rules, sound curfews, and power specs",
            "Realistic timeline suggestions with sensible crew setup and tear-down windows",
            "Automated follow-up emails that gently keep unconfirmed quotes moving forward",
            "Included on the Scale tier with private, isolated tenant data protection",
        ],
        "keywords": ["event management assistant", "event business automation", "event booking workflow", "automated quoting event software"],
        "icon": "⚡",
    },
    "pwa-stripe-pos": {
        "name": "PWA Mobile POS & Stripe Terminal Hardware",
        "headline": "Take In-Person Chip, Tap, and Apple Pay on Any Crew Phone",
        "summary": "Turn every field crew smartphone into a mobile card reader with Stripe Terminal, digital tip splitting, and instant SMS receipts.",
        "meta_description": "Mobile POS software for event entertainment crews. Stripe Terminal Bluetooth card reader integration, in-person chip and tap payments, and digital tip splitting.",
        "problem": "Clients frequently request extra hours, last-minute equipment add-ons, or want to tip DJs and setup crew on-site. Without a card reader, crew either miss the revenue, accept untracked personal cash/Venmo, or force owners to manually invoice on Monday morning.",
        "solution": "The Entertainment Express Crew PWA connects directly to Stripe Terminal hardware (such as Stripe Reader M2 and WisePOS E) via Bluetooth and Web USB. Field technicians take card-present chip, swipe, tap, and Apple Pay payments right on their phone. Overtime and add-ons post instantly to the booking invoice with automated digital tip distribution.",
        "highlights": [
            "Native Stripe Terminal reader pairing (Bluetooth & smart internet readers)",
            "Card-present chip, contactless tap, Google Pay, and Apple Pay processing",
            "On-site booking balance collection and overtime add-on charging",
            "Customizable digital tip screen with automated crew payroll tip pooling",
            "Instant branded SMS and email customer receipts generated on the spot",
        ],
        "keywords": ["mobile event POS", "Stripe Terminal event app", "DJ card reader", "party rental in-person payments", "crew mobile checkout"],
        "icon": "💳",
    },
    "owner-studio-parity": {
        "name": "Company Studio & Full Owner Portal Parity",
        "headline": "100% ERP Management Inside Your Dedicated Owner Portal",
        "summary": "Complete business management without touching complex backend menus: Chart of Accounts, Tax Rules, Master Data Explorer, and Emergency Overrides.",
        "meta_description": "Dedicated Owner Portal with complete ERPNext parity. Company Studio, tax rules, Chart of Accounts, Schema-Driven Master Data Explorer, and emergency overrides.",
        "problem": "Traditional ERP systems force busy business owners to learn obtuse backend developer desks, confusing menus, and fragile database doctypes just to update tax rates, check account ledgers, or fix customer record typos.",
        "solution": "Entertainment Express delivers complete ERPNext parity inside the streamlined /owner portal. Through Company Studio, owners configure accounting mappings, tax rules, and company defaults. The Schema-Driven Master Data Explorer provides full CRUD over 12 core business entities with live validation, while the Emergency Override Center safely resolves locks with strict audit logging.",
        "highlights": [
            "Company Studio for single-pane financial defaults, tax templates, and COA mapping",
            "Schema-Driven Master Data Explorer across 12 core business entities",
            "Full Create, Read, Update, and Archive capabilities with live schema validation",
            "Emergency Override Center with mandatory rationale capture and tamper-evident audit logs",
            "Zero backend access required: your entire enterprise managed from one clean URL",
        ],
        "keywords": ["event company ERP", "entertainment business owner portal", "no backend ERP management", "master data explorer", "event management audit logs"],
        "icon": "🏢",
    },
    "ai-financial-intelligence": {
        "name": "AI Financial Intelligence & Autonomous Dunning",
        "headline": "Put Your Accounts Receivable and Expense Bookkeeping on Autopilot",
        "summary": "Multimodal receipt OCR expense claims, autonomous overdue dunning agent, instant 60-second quote generator, and Stripe payout reconciliation.",
        "meta_description": "AI-powered financial automation for event companies. Multimodal receipt OCR, autonomous AR dunning agent with 1-click pay links, and automated bank reconciliation.",
        "problem": "Event operators lose thousands of dollars each month to unpaid final balances, lost paper fuel and supply receipts, delayed lead quotes, and hours spent manually matching Stripe batch deposits to booking invoices.",
        "solution": "Our In-The-Box AI Financial Agent automates the tedious math of running an entertainment business. Crew photograph receipts for instant multimodal OCR extraction linked to event cost centers. The Autonomous Dunning Agent monitors aging accounts and sends multi-channel follow-ups with 1-click payment links, while the 60-second quote assistant converts inbound leads immediately.",
        "highlights": [
            "Multimodal receipt OCR: snap a photo of fuel/hardware receipts for instant expense filing",
            "Automated linking to event Cost Centers for accurate job-level gross margins",
            "Autonomous AR Dunning Agent with gentle, firm, and urgent escalation sequences",
            "1-click Stripe payment links embedded directly in automated payment reminders",
            "60-Second Instant Quoting Assistant parsing customer event specs into bookable quotes",
            "Automated Stripe Payout matching to eliminate manual spreadsheet reconciliation",
        ],
        "keywords": ["AI event bookkeeping", "automated AR dunning", "receipt OCR event management", "Stripe bank reconciliation", "instant event quote AI"],
        "icon": "🤖",
    },
    "ai-autonomous-operations": {
        "name": "Autonomous Event Operations & Dispatch Copilot",
        "headline": "Self-Healing Weekend Operations When Things Go Wrong",
        "summary": "Emergency dispatch copilot, computer vision Smart Van Eye equipment verification, 24/7 AI voice phone receptionist, dynamic surge pricing, and review interception.",
        "meta_description": "Autonomous event operations for live entertainment. Emergency dispatch copilot, computer vision van loading, 24/7 AI voice phone receptionist, and reputation catalyst.",
        "problem": "Weekend event crises happen fast: an employee calls out sick at 7 AM Saturday, a driver forgets a vital power cable, high-demand peak dates are underpriced, and missed customer calls go to voicemail and book with a competitor.",
        "solution": "Our Out-Of-The-Box Autonomous Operations engine protects your weekend execution. The Emergency Dispatch Copilot automatically finds available replacements and broadcasts shifts. Smart Van Eye uses computer vision to inspect truck loads and detect gear damage. The 24/7 AI Voice Receptionist answers inbound calls via Twilio Voice, while Dynamic Yield Pricing maximizes peak-date revenue.",
        "highlights": [
            "Autonomous Emergency Dispatch Copilot: 1-click replacement finding & shift broadcasts",
            "Computer Vision Smart Van Eye: camera-based load-out verification and damage quarantine",
            "24/7 AI Voice Phone Receptionist powered by Twilio Voice & Conversational LLM",
            "Dynamic Surge & Yield Pricing: automated rate adjustments for high-demand Saturdays",
            "AI Review Interceptor: routes 5-star fans to Google Reviews while catching complaints privately",
        ],
        "keywords": ["autonomous event dispatch", "computer vision event equipment", "AI voice receptionist party rental", "dynamic event pricing", "event reputation management"],
        "icon": "🚀",
    },
    "predictive-margin-guardrails": {
        "name": "Predictive Margin Guardrails & Settlement",
        "headline": "Lock In Event Profitability Before You Quote and After You Settle",
        "summary": "Real-time pre-quote margin simulator, live cost drift warnings, automated 35% margin floor enforcement, and 1-click post-event P&L ledger settlement.",
        "meta_description": "Predictive margin guardrails and post-event settlement for event entertainment companies. Real-time quote margin simulation, live drift alerts, and 1-click cost center lock.",
        "problem": "Event operators often quote prices based on gut feeling, only to watch profit margins evaporate due to unexpected travel costs, overtime crew wages, payment gateway fees, or scope creep during setup.",
        "solution": "Predictive Margin Guardrails calculate live gross profit margin percentages before any proposal is delivered to a client. If projected margins dip below your 35% company floor, quotes are flagged immediately. During execution, live cost drift detection alerts managers when labor or gear expenses exceed baseline targets by 5%, and 1-click post-event settlement locks ledgers against unauthorized adjustments.",
        "highlights": [
            "Pre-Quote Margin Simulator: real-time margin calculation factoring labor, gear, mileage, and payment fees",
            "Minimum Margin Floor Enforcement: customizable policy floor (default 35%) with manager approval bypass",
            "Live Margin Drift Monitor: automated alerts when active event labor or equipment costs drift over 5%",
            "Post-Event 1-Click Settlement: automated 7-day cost center lock, variance tracking, and final ledger freeze",
            "Event P&L Drawer: complete margin drill-down visualizer directly inside your owner financial portal",
        ],
        "keywords": ["event margin calculator", "predictive job costing", "event profitability software", "post event settlement", "gross margin guardrails"],
        "icon": "📊",
    },
    "zero-signal-field-sync": {
        "name": "Zero-Signal Offline-First Field Sync",
        "headline": "100% Operational Readiness Even in Signal Dead-Zones",
        "summary": "Local-first IndexedDB PWA architecture, offline barcode scan validation, signature capture, and deterministic background sync.",
        "meta_description": "Offline-first field operations app for event entertainment crews. Local-first IndexedDB barcode scanning, offline digital signatures, and background sync.",
        "problem": "Cellular dead-zones at rural wedding barns, metal storage warehouses, and basement convention halls prevent field crews from scanning gear, logging call times, and capturing client sign-offs.",
        "solution": "The Zero-Signal Field Sync architecture stores full operational day manifests, inventory barcodes, and run sheets locally on the worker's device using IndexedDB. Scans, signatures, and timesheets complete sub-second offline and auto-sync when network connectivity returns.",
        "highlights": [
            "Local-First IndexedDB Storage: full day manifests and gear lists cached locally",
            "Offline Barcode Scan Validation: sub-millisecond local barcode checks without network",
            "Offline Media & Signature Capture: client waivers and damage photos stored in local Blob storage",
            "Background Sync Engine: automatic batch flushing with exponential backoff on reconnection",
            "Sync Inspector Drawer: transparent pending queue manager in /employee PWA",
        ],
        "keywords": ["offline event software", "zero signal field app", "offline barcode scanner", "PWA offline sync"],
        "icon": "📶",
    },
    "autonomous-event-copilot": {
        "name": "Autonomous Event Copilot & Agentic Ops",
        "headline": "AI-Powered Run-of-Show Synthesis and Emergency Staffing",
        "summary": "Sunset-anchored run-of-show timeline synthesis, emergency sick-call replacement ladders with 1-click SMS dispatch, and PDF rider parsing.",
        "meta_description": "Autonomous event copilot for live entertainment. Solar-anchored timeline generation, 1-click emergency shift dispatch, and technical rider extraction.",
        "problem": "Event leads spend hours manually building day-of timelines and scrambling when key crew members call in sick hours before call time.",
        "solution": "Our Autonomous Event Copilot computes mathematical sunset/golden hour times for photography and venue noise curfews, generating instant run-of-show timelines. On sick calls, it ranks available replacements by reliability and proximity, issuing 1-click SMS shift offers.",
        "highlights": [
            "Solar-Anchored Run-of-Show: mathematical sunset & golden hour photo window calculation",
            "Emergency Replacement Ladder: 1-click tokenized SMS shift offers with 15-minute expiration",
            "Technical Rider PDF Extractor: side-by-side entity extraction for contracts and stage riders",
            "Venue Curfew Integration: automated decibel reduction and finale timing checks",
        ],
        "keywords": ["AI event copilot", "emergency event staffing", "automated run of show", "PDF contract extractor"],
        "icon": "⚡",
    },
    "b2b-overflow-exchange": {
        "name": "B2B Overflow & Sub-Rental Gear Exchange",
        "headline": "Monetize Overbooked Dates & Cross-Rent Rigs Securely",
        "summary": "Control-plane mediated liquidity network, automated partner COI verification, margin escrow, and white-label gig packets.",
        "meta_description": "B2B overflow and gear exchange for party rental and DJ companies. Control-plane mediated gig network, automated COI verification, and escrow settlement.",
        "problem": "Operators lose revenue when turning away overbooked dates or lacking specialized equipment, while fearing client poaching when farming out gigs.",
        "solution": "The B2B Exchange enables peer operators to buy and sell overflow capacity and cross-rent rigs. Mediated through the central Control Plane, it enforces non-solicitation, verifies $1M+ liability COIs, and disburses margin escrow upon mutual sign-off.",
        "highlights": [
            "Control Plane Clearinghouse: cross-tenant matching preserving Sacred Rule #1 DB isolation",
            "Automated COI Verification Gate: verifies partner liability insurance before job claim",
            "Automated Margin Escrow: mutual sign-off releases funds directly to fulfilling partner",
            "White-Label Gig Packets: branded run sheets masking client contacts until 24h prior",
        ],
        "keywords": ["B2B event exchange", "party rental gear subrental", "event overflow network", "coi verification event"],
        "icon": "🤝",
    },
    "instant-crew-payouts": {
        "name": "Crew Instant Payouts & Micro-Incentives",
        "headline": "Pay Gig Crew 30 Minutes After Event Teardown",
        "summary": "Stripe Connect Instant Payout transfers to crew debit cards, teardown damage gates, and algorithmic reliability scoring.",
        "meta_description": "Instant crew payouts for event entertainment businesses. Stripe Connect instant debit card transfers, teardown checklist gates, and reliability scoring.",
        "problem": "High gig crew turnover and delayed bi-weekly payroll runs make it hard to retain top talent or reward punctual workers.",
        "solution": "Workers request instant payouts directly to their debit card via Stripe Connect 30 minutes after completing teardown. Payouts are gated by verified damage-free equipment check-ins, while an algorithmic reliability score weights top workers for priority dispatch.",
        "highlights": [
            "Stripe Connect Instant Transfers: 1.5% fee instant debit card payouts post-event",
            "Teardown Checklist Gate: blocks payouts until unreturned gear and damage reports are cleared",
            "Algorithmic Reliability Scoring: 0-100 score weighting Punctuality, Checklist, Asset Care, CSAT",
            "Priority Dispatch Ladder: automatically suggests Platinum-tier workers for VIP bookings",
        ],
        "keywords": ["instant crew payout", "Stripe Connect event payroll", "gig worker same day pay", "crew reliability score"],
        "icon": "💸",
    },
    "live-event-flight-deck": {
        "name": "Live Event Flight Deck & Dynamic Timeline Pacing",
        "headline": "Real-Time Mission Control for Saturday Night Live Operations",
        "summary": "Live command center, geofenced crew check-ins, dynamic timeline offset shifting (+15m / +30m), and hardware fault escalation.",
        "meta_description": "Real-time live event flight deck for event operators. Live fleet map, geofenced milestone check-ins, dynamic timeline pacing, and hardware fault alerts.",
        "problem": "Saturday night live operations are blind: late-running ceremonies, traffic delays, and gear failures require frantic group texts and phone calls.",
        "solution": "The Live Event Flight Deck delivers real-time mission control in /owner with vehicle pins, geofenced crew milestone states, and live incident alerts. When an event runs late, event leads tap '+15m' to shift all downstream moments across client and staff screens instantly.",
        "highlights": [
            "Live Mission Control Map: real-time fleet positions, venue coordinates, and incident alerts",
            "Geofenced Milestone State Machine: 500m Haversine radius validation for crew check-ins",
            "Dynamic Timeline Shifter: 1-tap (+15m / +30m) cascade moment adjustment across portals",
            "Hardware Fault Escalation: instant on-site issue reporting with owner audio alerts",
        ],
        "keywords": ["live event flight deck", "real time event dispatch", "dynamic timeline pacing", "event mission control"],
        "icon": "🛰️",
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
