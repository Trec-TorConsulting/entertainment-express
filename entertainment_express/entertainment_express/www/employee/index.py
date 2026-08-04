import frappe

from entertainment_express.security.request_guards import require_employee_login

no_cache = 1


def _portal_bootstrap():
    user = frappe.session.user or "Guest"
    settings = frappe.get_cached_doc("EE Portal Settings", "EE Portal Settings")

    return {
        "user": user,
        "roles": frappe.get_roles(user) if user != "Guest" else [],
        "csrf_token": frappe.sessions.get_csrf_token(),
        "branding": {
            "name": getattr(settings, "brand_name", None),
            "logo": getattr(settings, "brand_logo", None),
            "color": getattr(settings, "brand_color", None),
        },
    }


def get_context(context):
    require_employee_login()
    context.no_cache = 1
    context.no_breadcrumbs = 1
    context.no_sidebar = 1
    context.portal_bootstrap = _portal_bootstrap()
