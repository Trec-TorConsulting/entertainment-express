from urllib.parse import quote

import frappe

from entertainment_express.api.control_analytics import fleet

no_cache = 1
no_sitemap = 1


def get_context(context):
    user = frappe.session.user or "Guest"
    if user == "Guest":
        path = getattr(getattr(frappe.local, "request", None), "path", None) or "/ops"
        frappe.local.flags.redirect_location = f"/login?redirect-to={quote(path, safe='/')}"
        raise frappe.Redirect
    roles = set(frappe.get_roles() or [])
    if not roles.intersection({"SaaS Operator", "System Manager"}):
        frappe.throw("Fleet access denied.", frappe.PermissionError)
    context.no_cache = 1
    context.metrics = fleet()
    context.title = "Fleet"
