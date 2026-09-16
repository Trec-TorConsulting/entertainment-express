import frappe
from entertainment_express.marketing.site_context import (
    apply_common_page_context,
    get_marketing_settings,
)


def get_context(context):
    settings = get_marketing_settings()
    apply_common_page_context(
        context,
        settings,
        "Entertainment Express | Launching Soon",
        "The complete operating system engineered specifically for mobile entertainment businesses. Join the VIP waitlist for early access.",
        "/coming-soon",
    )

    context.coming_soon_headline = settings.get("coming_soon_headline") or "The Operating System for Entertainment Professionals"
    context.coming_soon_subhead = settings.get(
        "coming_soon_subhead"
    ) or "Bookings, crew scheduling, contracts, dispatch, and client management built specifically for mobile entertainment. Launching soon."
    context.coming_soon_launch_date = settings.get("coming_soon_launch_date") or ""

    # Feature preview cards highlighting major differentiators
    context.features_preview = [
        {
            "icon": "💳",
            "title": "PWA Mobile POS & Hardware",
            "description": "Stripe Terminal Bluetooth card readers on crew phones: in-person chip, contactless tap, Apple Pay, digital tip splitting, and instant SMS receipts.",
        },
        {
            "icon": "🚀",
            "title": "Autonomous Event Operations",
            "description": "Emergency dispatch copilot, computer vision Smart Van Eye truck load inspections, 24/7 AI voice phone receptionist, and dynamic surge pricing.",
        },
        {
            "icon": "🤖",
            "title": "AI Financial Intelligence",
            "description": "Multimodal receipt OCR expense claims, autonomous overdue AR dunning agent with 1-click Stripe pay links, and bank reconciliation.",
        },
        {
            "icon": "🏢",
            "title": "Company Studio & Owner Parity",
            "description": "Complete ERPNext parity inside /owner: single-pane Chart of Accounts, tax templates, Master Data Explorer across 12 entities, and emergency overrides.",
        },
        {
            "icon": "🚚",
            "title": "Crew & Truck Dispatch",
            "description": "Run sheets, equipment loading checklists, vehicle assignments, and automated mobile schedules delivered straight to crew phones.",
        },
        {
            "icon": "📱",
            "title": "Client Hub & E-Sign",
            "description": "Branded client hub for contract e-signing, online deposits, guest song requests, timelines, and collaborative planning forms.",
        },
    ]

    # Supported verticals
    context.verticals = [
        ("dj", "DJs & Emcees"),
        ("inflatables", "Inflatables & Party Rentals"),
        ("photobooth", "Photo & 360 Booths"),
        ("gametruck", "Game Trucks & VR"),
        ("casino", "Casino & Arcade Games"),
        ("performers", "Performers & Musicians"),
        ("multi", "Multi-Service Entertainment"),
    ]
    context.no_cache = 1
