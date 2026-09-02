import frappe


def get_context(context):
    context.no_cache = 1
    try:
        from entertainment_express.api.storefront import list_packages

        context.packages = list_packages()
    except Exception:
        context.packages = []
    context.items = []
    context.logged_in = bool(frappe.session.user and frappe.session.user != "Guest")
