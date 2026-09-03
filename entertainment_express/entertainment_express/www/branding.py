"""White-label website chrome (login, footer, public tenant pages)."""

from __future__ import annotations


def update_website_context(context):
    brand_name = "Entertainment Express"
    hide = False
    favicon = ""
    footer_text = ""
    og_image = ""
    full = False
    kit = {}

    try:
        from entertainment_express.white_label import kit as wl_kit

        if wl_kit.skip_tenant_kit():
            context["hide_footer"] = 1
            context["disable_signup"] = 1
            return

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

    if hide or full:
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

    extra = context.get("head_html") or ""
    styles = '<link rel="stylesheet" href="/assets/entertainment_express/css/ee-white-label.css">'
    try:
        from entertainment_express.white_label import kit as wl_kit

        if kit and (kit.get("white_label_mode") or "off") != "off":
            styles += f"<style>{wl_kit.css_variables(kit)}</style>"
    except Exception:
        pass
    styles += "<style>.footer-powered{display:none!important}</style>"
    if hide or full:
        styles += "<style>.powered-by,.powered-by-frappe{display:none!important}</style>"
        try:
            context["body_class"] = (context.get("body_class") or "") + " ee-hide-product"
        except Exception:
            pass
    if favicon:
        styles += f'<link rel="icon" href="{favicon}">'
    if og_image:
        styles += f'<meta property="og:image" content="{og_image}">'
    if full and brand_name:
        styles += f'<meta property="og:site_name" content="{brand_name}">'
    context["head_html"] = extra + styles
