import frappe

no_cache = 1


def get_context(context):
    context.no_cache = 1
    token = frappe.form_dict.get("token") or ""
    if not token:
        path = (frappe.request.path if getattr(frappe, "request", None) else "") or ""
        parts = [p for p in path.split("/") if p]
        if len(parts) >= 2 and parts[0] == "w":
            token = parts[1]
    context.token = token
