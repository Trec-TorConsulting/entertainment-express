import frappe

from entertainment_express.security.request_guards import (
    EE_CLIENT_PORTAL,
    SUPER_ADMIN_ROLES,
    _redirect,
    resolve_home_portal,
)

no_cache = 1


def get_context(context):
    """Desk entry (`/app`, `/app/home`, …). Operators stay; everyone else → portal."""
    user = frappe.session.user or "Guest"
    if user == "Guest":
        _redirect(EE_CLIENT_PORTAL)

    roles = set(frappe.get_roles(user) or [])
    if user == "Administrator" or roles.intersection(SUPER_ADMIN_ROLES):
        return

    # Tenant admins land on /admin (not /app/home → Page doctype).
    _redirect(resolve_home_portal(user))
