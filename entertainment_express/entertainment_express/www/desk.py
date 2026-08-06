import frappe

from entertainment_express.security.request_guards import (
    EE_CLIENT_PORTAL,
    SUPER_ADMIN_ROLES,
    _redirect,
    resolve_home_portal,
)

no_cache = 1


def get_context(context):
    """Legacy `/desk` entry — same boundary as `/app`."""
    user = frappe.session.user or "Guest"
    if user == "Guest":
        _redirect(EE_CLIENT_PORTAL)

    roles = set(frappe.get_roles(user) or [])
    if user == "Administrator" or roles.intersection(SUPER_ADMIN_ROLES):
        return

    _redirect(resolve_home_portal(user))
