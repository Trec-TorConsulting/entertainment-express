"""White-label website chrome (login, footer)."""


def update_website_context(context):
    context["app_name"] = "Entertainment Express"
    context["brand_html"] = "Entertainment Express"
    context["hide_footer"] = 1
    context["disable_signup"] = 1
    # Frappe's "Standard Footer" web template still prints "Powered by ERPNext"
    # even when hide_footer is set. Keep tenant marketing pages white-label.
    extra = context.get("head_html") or ""
    context["head_html"] = extra + "<style>.footer-powered{display:none!important}</style>"
