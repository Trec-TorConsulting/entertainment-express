import frappe


def get_context(context):
    context.no_cache = 1
    try:
        from entertainment_express.api.catalog import public_catalog

        payload = public_catalog()
    except Exception:
        payload = {"packages": [], "items": []}
    context.packages = payload.get("packages") or []
    context.items = payload.get("items") or []
    context.logged_in = bool(frappe.session.user and frappe.session.user != "Guest")
