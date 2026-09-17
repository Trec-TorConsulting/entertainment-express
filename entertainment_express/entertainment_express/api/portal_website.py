"""Website builder configuration APIs for tenant owner portal.

Site-scopedDocType (EE Portal Settings) storage ensures strict multi-tenant isolation.
"""

from __future__ import annotations

import json
import frappe
from frappe.utils import cint

from entertainment_express.api.portal_owner import OWNER_ROLES

STAFF = OWNER_ROLES | {"EE Office", "EE Marketing", "System Manager"}
GUEST_ROLE = "EE Event Guest"
PAYER_ROLE = "EE Customer"


def _require_staff() -> None:
    roles = set(frappe.get_roles() or [])
    if GUEST_ROLE in roles and PAYER_ROLE not in roles:
        frappe.throw("Not allowed.", frappe.PermissionError)
    if not roles.intersection(STAFF):
        frappe.throw("Not allowed.", frappe.PermissionError)


def _default_value_props(company_name: str) -> list[dict]:
    return [
        {
            "icon": "sparkles",
            "title": "Unforgettable Experiences",
            "description": f"Tailored entertainment designed specifically for your audience by {company_name}.",
        },
        {
            "icon": "shield-check",
            "title": "Full-Service & Insured",
            "description": "Professional, insured crew, backup gear, and 100% on-time guarantee.",
        },
        {
            "icon": "calendar",
            "title": "Seamless Online Booking",
            "description": "Browse packages, request quotes, sign contracts, and pay securely online.",
        },
    ]


def _default_entertainers() -> list[dict]:
    return [
        {
            "id": "ent-1",
            "name": "Marcus Vance",
            "stage_name": "DJ Marcus 'BeatDrop' Vance",
            "role": "Lead DJ & Master of Ceremonies",
            "photo_url": "https://images.unsplash.com/photo-1571266028243-e4733b0f0bb1?w=500&auto=format&fit=crop&q=80",
            "bio": "10+ years spinning high-energy wedding receptions, corporate galas, and festival mainstages. Specializes in multi-genre crowd reading, seamless transitions, and bilingual MCing.",
            "specialties": ["High-Energy MC", "Open-Format DJ", "Corporate Galas", "Weddings"],
            "show_on_website": 1,
        },
        {
            "id": "ent-2",
            "name": "Elena Rostova",
            "stage_name": "Elena Rostova — Electric Strings",
            "role": "Electric Violinist & Solo Performer",
            "photo_url": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80",
            "bio": "Conservatory-trained virtuoso performing contemporary pop covers, classical fusion, and ambient cocktail hour sets. Creates captivating visual and acoustic atmospheres.",
            "specialties": ["Electric Violin", "Cocktail Hour", "Classical Fusion", "Ceremony Music"],
            "show_on_website": 1,
        },
        {
            "id": "ent-3",
            "name": "David Sterling",
            "stage_name": "David Sterling Magic & MC",
            "role": "Event Host & Strolling Magician",
            "photo_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80",
            "bio": "Engaging close-up illusionist and interactive host who keeps guests amazed during cocktail hours and VIP receptions.",
            "specialties": ["Strolling Magic", "VIP Hospitality", "Interactive Hosting"],
            "show_on_website": 1,
        },
    ]


@frappe.whitelist()
def get_website_config() -> dict:
    """Retrieve complete website builder settings and status."""
    _require_staff()

    company = frappe.db.get_single_value("Global Defaults", "default_company") or frappe.db.get_value(
        "Company", {}, "company_name"
    ) or "Our Entertainment Studio"

    settings = frappe.get_single("EE Portal Settings")

    # Default props if not configured
    raw_props = settings.get("value_props_json") or ""
    try:
        value_props = json.loads(raw_props) if raw_props else _default_value_props(company)
    except Exception:
        value_props = _default_value_props(company)

    # Entertainers Bios
    raw_entertainers = settings.get("entertainers_json") or ""
    try:
        entertainers = json.loads(raw_entertainers) if raw_entertainers else _default_entertainers()
    except Exception:
        entertainers = _default_entertainers()

    # Pages count
    pages_count = 0
    if frappe.db.table_exists("EE Website Page"):
        pages_count = frappe.db.count("EE Website Page")

    # Packages count
    packages_count = 0
    if frappe.db.table_exists("Service Package"):
        packages_count = frappe.db.count("Service Package")

    headline = settings.get("hero_headline") or f"Premier Live Entertainment with {company}"
    subtitle = (
        settings.get("hero_subtitle")
        or "From weddings and corporate galas to festivals and private celebrations, we bring energy, world-class talent, and flawless production to every stage."
    )

    return {
        "company_name": company,
        "brand_name": settings.get("brand_name") or company,
        "brand_logo": settings.get("brand_logo") or "",
        "brand_color": settings.get("brand_color") or "#0f766e",
        "brand_color_accent": settings.get("brand_color_accent") or "#f59e0b",
        "hero_headline": headline,
        "hero_subtitle": subtitle,
        "hero_image": settings.get("hero_image") or "",
        "hero_cta_text": settings.get("hero_cta_text") or "Book Your Event",
        "hero_cta_url": settings.get("hero_cta_url") or "/book",
        "show_packages": cint(settings.get("show_packages")) if settings.get("show_packages") is not None else 1,
        "show_reviews": cint(settings.get("show_reviews")) if settings.get("show_reviews") is not None else 1,
        "show_contact": cint(settings.get("show_contact")) if settings.get("show_contact") is not None else 1,
        "show_entertainers": cint(settings.get("show_entertainers")) if settings.get("show_entertainers") is not None else 1,
        "value_props": value_props,
        "entertainers": entertainers,
        "public_embed_key": settings.get("public_embed_key") or "",
        "review_url": settings.get("review_url") or "",
        "pages_count": pages_count,
        "packages_count": packages_count,
    }


@frappe.whitelist()
def save_website_config(values: dict | str | None = None) -> dict:
    """Update website builder settings for this tenant site."""
    _require_staff()
    if isinstance(values, str):
        values = frappe.parse_json(values) or {}
    values = values or {}

    settings = frappe.get_single("EE Portal Settings")

    allowed_fields = [
        "hero_headline",
        "hero_subtitle",
        "hero_image",
        "hero_cta_text",
        "hero_cta_url",
        "brand_name",
        "brand_logo",
        "brand_color",
        "brand_color_accent",
        "review_url",
    ]

    for field in allowed_fields:
        if field in values:
            setattr(settings, field, values[field])

    for bool_field in ["show_packages", "show_reviews", "show_contact", "show_entertainers"]:
        if bool_field in values:
            setattr(settings, bool_field, 1 if cint(values[bool_field]) else 0)

    if "value_props" in values:
        vprops = values["value_props"]
        if isinstance(vprops, list):
            settings.value_props_json = json.dumps(vprops)
        elif isinstance(vprops, str):
            settings.value_props_json = vprops

    if "entertainers" in values:
        ents = values["entertainers"]
        if isinstance(ents, list):
            settings.entertainers_json = json.dumps(ents)
        elif isinstance(ents, str):
            settings.entertainers_json = ents

    settings.save(ignore_permissions=True)

    return get_website_config()
