import frappe
from frappe import _

no_cache = 1


def get_context(context):
    context.no_cache = 1
    token = frappe.form_dict.get("token") or ""
    if not token:
        path = (frappe.request.path if getattr(frappe, "request", None) else "") or ""
        parts = [p for p in path.split("/") if p]
        if len(parts) >= 2 and parts[0] == "g":
            token = parts[1]
    context.token = token
    if not token:
        frappe.throw(_("Gallery not found"), frappe.DoesNotExistError)
    try:
        from entertainment_express.api import media_gallery

        data = media_gallery.public_gallery(token)
    except Exception:
        frappe.local.response["http_status_code"] = 404
        frappe.throw(_("Gallery not found"), frappe.DoesNotExistError)
    context.gallery = data
    context.title = data.get("title") or "Gallery"
