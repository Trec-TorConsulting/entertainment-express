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
            "brand_logo": "",
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

    pathname = str(context.get("pathname") or context.get("path") or context.get("route") or "")
    template = str(context.get("template") or "")
    is_auth_or_sys = (
        path in ("/login", "/update-password", "/404", "/500", "/403")
        or pathname in ("login", "update-password", "update_password", "404", "500", "403")
        or "login" in template
        or "update_password" in template
        or "update-password" in template
        or "404" in template
        or "500" in template
    )

    if is_auth_or_sys:
        body_cls = context.get("body_class") or ""
        if "ee-auth-page" not in body_cls:
            context["body_class"] = (body_cls + " ee-auth-page").strip()
        try:
            import frappe
            req_key = (
                getattr(frappe.local, "form_dict", {}).get("key")
                or (getattr(frappe.local, "request", None) and frappe.local.request.args.get("key"))
            )
            if req_key:
                context["key"] = req_key
        except Exception:
            pass

    ee_default_svg_favicon = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 36 36' fill='none'%3E%3Crect width='36' height='36' rx='8' fill='%236d28d9'/%3E%3Cpath d='M8.5 11C8.5 10.17 9.17 9.5 10 9.5H18C18.55 9.5 19 9.95 19 10.5V11.5C19 12.05 18.55 12.5 18 12.5H11.5V15H16.5C17.05 15 17.5 15.45 17.5 16V17C17.5 17.55 17.05 18 16.5 18H11.5V20.5H18C18.55 20.5 19 20.95 19 21.5V22.5C19 23.05 18.55 23.5 18 23.5H10C9.17 23.5 8.5 22.83 8.5 22V11Z' fill='%23ffffff'/%3E%3Cpath d='M20.5 12C20.5 11.45 20.95 11 21.5 11H26C26.55 11 27 11.45 27 12V13C27 13.55 26.55 14 26 14H22.5V15.5H25C25.55 15.5 26 15.95 26 16.5V17.5C26 18.05 25.55 18.5 25 18.5H22.5V20H26C26.55 20 27 20.45 27 21V22C27 22.55 26.55 23 26 23H21.5C20.95 23 20.5 22.55 20.5 22V12Z' fill='%23fb923c'/%3E%3Cpolygon points='17.5,7.5 19.5,11.5 17.5,15.5 15.5,11.5' fill='%23ffffff' opacity='0.95'/%3E%3C/svg%3E"
    effective_favicon = favicon or ee_default_svg_favicon
    context["favicon"] = effective_favicon

    extra = context.get("head_html") or ""
    styles = (
        '<link rel="preconnect" href="https://fonts.googleapis.com">\n'
        '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
        '<link rel="preload" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@500;600;700;800&display=swap" as="style">\n'
        '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@500;600;700;800&display=swap" media="print" onload="this.media=\'all\'">\n'
        '<noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@500;600;700;800&display=swap"></noscript>\n'
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

    styles += (
        "<style>"
        ".web-header,header.web-header,.ee-web-navbar,nav.ee-web-navbar,nav.navbar{background:#ffffff !important;background-color:#ffffff !important;border-bottom:1px solid #e2e8f0 !important;}"
        ".ee-web-navbar .nav-link,.navbar-nav .nav-link,.navbar-center-links .nav-link,.nav-link{color:#1e293b !important;font-weight:600 !important;}"
        ".ee-web-navbar .nav-link:hover,.navbar-nav .nav-link:hover{color:#0f766e !important;background-color:#f1f5f9 !important;border-radius:6px;}"
        ".ee-navbar-brand-name,.ee-web-navbar .ee-brand-title,.navbar-brand{color:#0f172a !important;font-weight:700 !important;}"
        ".ee-web-navbar .ee-nav-login{color:#0f172a !important;font-weight:600 !important;}"
        ".web-footer,header.web-footer,.ee-web-footer,footer.ee-web-footer,.ee-site-footer,footer.ee-site-footer{background:#ffffff !important;background-color:#ffffff !important;border-top:1px solid #e2e8f0 !important;color:#0f172a !important;}"
        ".ee-footer-brand-title,.ee-web-footer .ee-footer-brand-title,.ee-site-footer strong{color:#0f172a !important;font-weight:700 !important;}"
        ".ee-footer-nav a,.ee-web-footer a,.ee-site-footer a,.ee-web-footer a.text-muted{color:#1e293b !important;font-weight:600 !important;}"
        ".ee-footer-nav a:hover,.ee-web-footer a:hover,.ee-site-footer a:hover{color:#0f766e !important;text-decoration:underline !important;}"
        ".ee-web-footer .text-muted,.ee-web-footer h6,.ee-web-footer p,.ee-web-footer small,.ee-site-footer,.ee-site-footer div{color:#475569 !important;}"
        ".footer-powered{display:none!important}"
        "</style>\n"
    )
    if hide or full:
        styles += "<style>.powered-by,.powered-by-frappe{display:none!important}</style>\n"
        try:
            context["body_class"] = ((context.get("body_class") or "") + " ee-hide-product").strip()
        except Exception:
            pass
    if effective_favicon:
        styles += f'<link rel="icon" href="{effective_favicon}">\n<link rel="shortcut icon" href="{effective_favicon}">\n'
    if og_image:
        styles += f'<meta property="og:image" content="{og_image}">\n'
    if full and brand_name:
        styles += f'<meta property="og:site_name" content="{brand_name}">\n'

    context["head_html"] = extra + styles
