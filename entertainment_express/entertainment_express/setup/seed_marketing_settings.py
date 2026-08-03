import frappe


def run():
    """Seed marketing settings defaults if they are missing."""
    if not frappe.db.exists("DocType", "Marketing Settings"):
        return

    settings = frappe.get_single("Marketing Settings")
    defaults = {
        "base_domain": "entertainmentexpress.app",
        "hero_headline": "Run your entertainment company on one platform.",
        "hero_subhead": "Bookings, crew scheduling, contracts, dispatch, and billing made simple.",
        "primary_cta_label": "Start free trial",
        "primary_cta_target": "/start-trial",
        "secondary_cta_label": "Request a demo",
        "secondary_cta_target": "/demo",
        "analytics_provider": "none",
        "consent_banner_enabled": 1,
        "consent_banner_text": "We use cookies to improve your experience. You can accept or reject non-essential cookies.",
        "captcha_provider": "none",
        "section_feature_grid": 1,
        "section_pricing_teaser": 1,
        "section_testimonials": 1,
    }

    dirty = False
    for key, value in defaults.items():
        current = getattr(settings, key, None)
        if current in (None, ""):
            setattr(settings, key, value)
            dirty = True

    if dirty:
        settings.save(ignore_permissions=True)
        frappe.db.commit()
