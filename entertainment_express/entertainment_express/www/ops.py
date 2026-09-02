from urllib.parse import quote

import frappe
from frappe.utils import flt, fmt_money

from entertainment_express.api.control_analytics import fleet
from entertainment_express.api.fleet import fleet_dashboard

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
    dash = fleet_dashboard()
    currency = frappe.db.get_default("currency") or "USD"
    tenants = []
    for row in dash.get("tenants") or []:
        item = dict(row)
        item["mrr_display"] = fmt_money(flt(item.get("mrr")), currency=currency)
        tenants.append(item)
    context.tenants = tenants
    context.title = "Fleet"
