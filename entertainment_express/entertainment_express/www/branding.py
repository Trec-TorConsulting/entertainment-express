"""White-label website chrome (login, footer, public tenant pages, and system routes)."""

from __future__ import annotations


def update_website_context(context):
    brand_name = "Entertainment Express"
    hide = False
    favicon = ""
    footer_text = ""
    og_image = ""
    full = False
    kit = {}
    is_base_site = False

    try:
        from entertainment_express.white_label import kit as wl_kit

        if context.get("is_base_site") or wl_kit.skip_tenant_kit():
            is_base_site = True
        else:
            kit = wl_kit.effective_kit()
            brand_name = kit.get("brand_name") or brand_name
            mode = (kit.get("white_label_mode") or "portals").lower()
            hide = mode == "full" or (mode == "portals" and bool(int(kit.get("hide_product_chrome") or 0)))
            full = mode == "full"
            favicon = kit.get("brand_favicon") or ""
            footer_text = (kit.get("footer_text") or "").strip()
            og_image = kit.get("og_image") or ""
            if full and not brand_name:
                brand_name = kit.get("email_from_name") or brand_name
    except Exception:
        kit = {}

    if is_base_site:
        # SaaS Control Plane / Marketing www site defaults matching www.entx.app
        brand_name = "Entertainment Express"
        hide = False
        full = False
        kit = {
            "brand_name": "Entertainment Express",
            "brand_logo": "/assets/entertainment_express/marketing/img/logo.svg",
            "brand_color": "#6d28d9",
            "brand_color_secondary": "#4f46e5",
            "brand_color_bg": "#f8fafc",
            "brand_color_text": "#0f172a",
            "font_heading": "Outfit",
            "font_body": "Inter",
            "white_label_mode": "off",
            "hide_product_chrome": 0,
        }
        context["app_name"] = brand_name
        context["brand_html"] = brand_name
    elif hide or full:
        context["app_name"] = brand_name
        context["brand_html"] = brand_name
    else:
        context["app_name"] = brand_name if brand_name != "Entertainment Express" else "Entertainment Express"
        context["brand_html"] = context["app_name"]

    if full and not footer_text:
        footer_text = brand_name
    context["footer_text"] = footer_text
    context["white_label_mode"] = kit.get("white_label_mode") or "portals"
    context["hide_product_chrome"] = 1 if hide else 0
    context["ee_brand_kit"] = kit
    context["hide_footer"] = 1
    context["disable_signup"] = 1

    try:
        from entertainment_express.control_plane.entitlements import has_entitlement

        val = has_entitlement("show_ee_badge")
        context["show_ee_badge"] = 1 if val in (True, 1, "1") else 0
    except Exception:
        context["show_ee_badge"] = 0

    try:
        import frappe
        from entertainment_express.marketing.site_context import get_marketing_settings

        base_domain = (
            get_marketing_settings().get("base_domain")
            or getattr(frappe.conf, "ee_base_domain", None)
            or "entx.app"
        ).strip()
        context["base_domain"] = base_domain
    except Exception:
        context["base_domain"] = "entx.app"

    # Detect if this is an authentication or system/error page
    path = ""
    try:
        import frappe
        req = getattr(frappe.local, "request", None)
        if req and hasattr(req, "path"):
            path = req.path or ""
    except Exception:
        path = ""

    pathname = str(context.get("pathname") or "")
    template = str(context.get("template") or "")
    is_auth_or_sys = (
        path in ("/login", "/update-password", "/404", "/500", "/403")
        or pathname in ("login", "update-password", "404", "500", "403")
        or "login" in template
        or "update_password" in template
        or "404" in template
        or "500" in template
    )

    if is_auth_or_sys:
        body_cls = context.get("body_class") or ""
        if "ee-auth-page" not in body_cls:
            context["body_class"] = (body_cls + " ee-auth-page").strip()

    extra = context.get("head_html") or ""
    styles = (
        '<link rel="preconnect" href="https://fonts.googleapis.com">\n'
        '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
        '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@500;600;700;800&display=swap" rel="stylesheet">\n'
        '<link rel="stylesheet" href="/assets/entertainment_express/css/ee-white-label.css">\n'
        '<link rel="stylesheet" href="/assets/entertainment_express/css/ee-auth.css?v=1.0">\n'
    )

    try:
        from entertainment_express.white_label import kit as wl_kit

        if kit and (kit.get("white_label_mode") or "off") != "off":
            styles += f"<style>{wl_kit.css_variables(kit)}</style>\n"
        elif is_base_site:
            styles += (
                "<style>"
                ":root{"
                "--ee-brand:#6d28d9;"
                "--ee-brand-2:#4f46e5;"
                "--ee-accent:#6d28d9;"
                "--ee-bg:#f8fafc;"
                "--ee-text:#0f172a;"
                "--ee-font:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;"
                "--ee-font-display:'Outfit',-apple-system,BlinkMacSystemFont,sans-serif;"
                "}"
                "</style>\n"
            )
    except Exception:
        pass

    styles += "<style>.footer-powered{display:none!important}</style>\n"
    if hide or full:
        styles += "<style>.powered-by,.powered-by-frappe{display:none!important}</style>\n"
        try:
            context["body_class"] = ((context.get("body_class") or "") + " ee-hide-product").strip()
        except Exception:
            pass
    if favicon:
        styles += f'<link rel="icon" href="{favicon}">\n'
    if og_image:
        styles += f'<meta property="og:image" content="{og_image}">\n'
    if full and brand_name:
        styles += f'<meta property="og:site_name" content="{brand_name}">\n'

    context["head_html"] = extra + styles
