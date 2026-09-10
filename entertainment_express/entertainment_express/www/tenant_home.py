import json
import frappe
from frappe.utils import cint
from entertainment_express.api.portal_owner import OWNER_ROLES


def get_context(context):
    context.no_cache = 1

    # Company name from Global Defaults or Company doctype
    company = frappe.db.get_single_value("Global Defaults", "default_company") or frappe.db.get_value(
        "Company", {}, "company_name"
    ) or "Our Entertainment Studio"

    context.company_name = company
    context.title = company

    # Settings from EE Portal Settings
    settings = None
    if frappe.db.table_exists("EE Portal Settings"):
        try:
            settings = frappe.get_single("EE Portal Settings")
        except Exception:
            settings = None

    brand_name = (settings.get("brand_name") if settings else "") or company
    brand_logo = (settings.get("brand_logo") if settings else "") or ""
    brand_color = (settings.get("brand_color") if settings else "") or "#0f766e"
    brand_color_accent = (settings.get("brand_color_accent") if settings else "") or "#f59e0b"

    hero_headline = (settings.get("hero_headline") if settings else "") or f"Live Entertainment with {brand_name}"
    hero_subtitle = (
        (settings.get("hero_subtitle") if settings else "")
        or "World-class live entertainment, flawless event production, and unforgettable memories for weddings, corporate celebrations, and private parties."
    )
    hero_image = (settings.get("hero_image") if settings else "") or ""
    hero_cta_text = (settings.get("hero_cta_text") if settings else "") or "Request a Quote"
    hero_cta_url = (settings.get("hero_cta_url") if settings else "") or "/request-quote"

    show_packages = cint(settings.get("show_packages")) if (settings and settings.get("show_packages") is not None) else 1
    show_reviews = cint(settings.get("show_reviews")) if (settings and settings.get("show_reviews") is not None) else 1
    show_contact = cint(settings.get("show_contact")) if (settings and settings.get("show_contact") is not None) else 1

    # Value props
    raw_props = (settings.get("value_props_json") if settings else "") or ""
    try:
        value_props = json.loads(raw_props) if raw_props else []
    except Exception:
        value_props = []

    if not value_props:
        value_props = [
            {
                "icon": "sparkles",
                "title": "Tailored Performances",
                "description": f"Custom playlists, interactive MCs, and curated experiences created for your unique crowd by {brand_name}."
            },
            {
                "icon": "shield-check",
                "title": "Licensed & Insured",
                "description": "100% reliable equipment redundancy, commercial liability coverage, and professional attire guaranteed."
            },
            {
                "icon": "calendar",
                "title": "Effortless Event Planning",
                "description": "Direct portal access for itinerary coordination, song selection, online payments, and contract e-signing."
            }
        ]

    # Packages
    packages = []
    try:
        from entertainment_express.api.storefront import list_packages
        packages = list_packages()
    except Exception:
        packages = []

    # If no packages are entered yet, supply friendly starter package examples so the page never looks barren
    has_custom_packages = len(packages) > 0
    if not packages:
        packages = [
            {
                "id": "starter-signature",
                "name": "Signature Entertainment Experience",
                "rate": "$1,495",
                "description": "Up to 4 hours of continuous sound & lighting, wireless microphones, online planning suite, and dedicated event coordinator.",
                "image": "",
                "is_sample": True
            },
            {
                "id": "starter-premium",
                "name": "Premier Celebration Package",
                "rate": "$2,295",
                "description": "Full-day production, premium subwoofer system, smart moving-head dance floor lighting, custom monogram, and cocktail hour setup.",
                "image": "",
                "is_sample": True
            },
            {
                "id": "starter-grand",
                "name": "Grand Gala & Festival Production",
                "rate": "Custom Quote",
                "description": "Multi-performer lineup, stage lighting truss, photobooth bundle, and all-day audio engineering for large-scale venues.",
                "image": "",
                "is_sample": True
            }
        ]

    # Authenticated Owner check
    user = frappe.session.user
    is_owner = False
    if user and user != "Guest":
        try:
            roles = set(frappe.get_roles(user) or [])
            is_owner = bool(roles.intersection(OWNER_ROLES | {"System Manager"}))
        except Exception:
            is_owner = False

    context.brand_name = brand_name
    context.brand_logo = brand_logo
    context.brand_color = brand_color
    context.brand_color_accent = brand_color_accent
    context.hero_headline = hero_headline
    context.hero_subtitle = hero_subtitle
    context.hero_image = hero_image
    context.hero_cta_text = hero_cta_text
    context.hero_cta_url = hero_cta_url
    context.show_packages = show_packages
    context.show_reviews = show_reviews
    context.show_contact = show_contact
    context.value_props = value_props
    context.packages = packages
    context.has_custom_packages = has_custom_packages
    context.is_owner = is_owner
    context.owner_builder_url = "/owner/website"
    context.review_url = (settings.get("review_url") if settings else "") or ""
    context.footer_text = (settings.get("footer_text") if settings else "") or f"© {brand_name}. All rights reserved."
    context.white_label_mode = (settings.get("white_label_mode") if settings else "portals")
