import frappe
from frappe import _

no_cache = 1


def get_context(context):
    context.no_cache = 1
    route = (frappe.form_dict.get("route") or "").strip().strip("/")
    if not route:
        path = (frappe.request.path if getattr(frappe, "request", None) else "") or ""
        parts = [p for p in path.split("/") if p]
        if len(parts) >= 2 and parts[0] == "p":
            route = parts[1]
    if not route:
        frappe.throw(_("Page not found"), frappe.DoesNotExistError)

    name = frappe.db.get_value("EE Website Page", {"route": route, "published": 1}, "name")
    if not name:
        frappe.local.response["http_status_code"] = 404
        frappe.throw(_("Page not found"), frappe.DoesNotExistError)

    from entertainment_express.website_sanitize import sanitize_html

    doc = frappe.get_doc("EE Website Page", name)
    brand = {}
    try:
        settings = frappe.get_single("EE Portal Settings")
        brand = {
            "name": settings.brand_name or "",
            "color": settings.brand_color or "#0f766e",
            "logo": settings.brand_logo or "",
        }
    except Exception:
        brand = {"name": "", "color": "#0f766e", "logo": ""}

    context.page_doc = doc
    context.title = doc.seo_title or doc.title
    context.seo_description = doc.seo_description or ""
    context.body_html = sanitize_html(doc.body or "")
    context.brand = brand
    context.route = route
