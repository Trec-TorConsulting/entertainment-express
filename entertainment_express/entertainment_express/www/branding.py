"""White-label website chrome (login, footer)."""


def update_website_context(context):
    brand_name = "Entertainment Express"
    hide = False
    favicon = ""
    try:
        import frappe

        settings = frappe.get_cached_doc("EE Portal Settings", "EE Portal Settings")
        if getattr(settings, "brand_name", None):
            brand_name = settings.brand_name
        hide = bool(int(getattr(settings, "hide_product_chrome", 0) or 0))
        favicon = getattr(settings, "brand_favicon", None) or ""
    except Exception:
        pass

    if hide:
        context["app_name"] = brand_name
        context["brand_html"] = brand_name
    else:
        context["app_name"] = brand_name if brand_name != "Entertainment Express" else "Entertainment Express"
        context["brand_html"] = context["app_name"]
    context["hide_footer"] = 1
    context["disable_signup"] = 1
    # Frappe's "Standard Footer" web template still prints "Powered by ERPNext"
    # even when hide_footer is set. Keep tenant marketing pages white-label.
    extra = context.get("head_html") or ""
    styles = "<style>.footer-powered{display:none!important}</style>"
    if hide:
        styles += "<style>.powered-by,.powered-by-frappe{display:none!important}</style>"
    if favicon:
        styles += f'<link rel="icon" href="{favicon}">'
    context["head_html"] = extra + styles
