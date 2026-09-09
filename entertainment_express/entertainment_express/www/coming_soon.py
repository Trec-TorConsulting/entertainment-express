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
            "icon": "📅",
            "title": "Conflict-Free Booking",
            "description": "Real-time calendar availability, automatic travel buffers, instant quotes, and deposit checkout tailored to entertainment workflows.",
        },
        {
            "icon": "🚚",
            "title": "Crew & Truck Dispatch",
            "description": "Run sheets, equipment loading checklists, vehicle assignments, and automated mobile schedules delivered straight to crew phones.",
        },
        {
            "icon": "⚡",
            "title": "Automated Contracts & Billing",
            "description": "Integrated e-signatures, automated installment schedules, card-on-file balance auto-charges, and quick gratuity processing.",
        },
        {
            "icon": "👥",
            "title": "Client & Performer Portals",
            "description": "Branded client hub for song requests, timelines, and forms, alongside staff portals for run sheets, tips, and shift swaps.",
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
