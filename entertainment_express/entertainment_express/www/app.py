import frappe

from entertainment_express.security.request_guards import EE_BACKEND_HOME, EE_CLIENT_PORTAL, _redirect

no_cache = 1


def get_context(context):
    if frappe.session.user and frappe.session.user not in {"Guest", "Administrator"}:
        _redirect(EE_BACKEND_HOME)
    _redirect(EE_CLIENT_PORTAL)
