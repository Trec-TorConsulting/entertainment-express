"""Update / Reset Password page controller."""

from __future__ import annotations

import frappe
from frappe import _

no_cache = 1


def get_context(context):
    context.no_breadcrumbs = True
    context.parents = [{"name": "me", "title": _("My Account")}]

    key = (
        getattr(frappe.local, "form_dict", {}).get("key")
        or (getattr(frappe.local, "request", None) and frappe.local.request.args.get("key"))
    )
    if key:
        context["key"] = key
        context["title"] = _("Set New Password")
    else:
        context["title"] = _("Reset Password")
