"""Request boundary guards for backend and client portal access."""

from urllib.parse import quote

import frappe
from frappe import _


INTERNAL_BACKEND_ROLES = {
    "System Manager",
    "SaaS Operator",
    "EE Tenant Admin",
    "EE Sales",
    "EE Dispatcher",
    "EE HR",
    "EE Accounting",
    "EE Office",
    "EE Entertainer",
    "EE Crew",
}

BACKEND_PREFIXES = (
    "/app",
    "/desk",
    "/api/method/frappe.desk",
)

# Any direct branded framework route in backend navigation should be rewritten
# to the EE workspace entry route.
BRANDED_BACKEND_PATH_PARTS = (
    "/workspace/erpnext",
    "/erpnext",
    "/frappe",
)
EE_BACKEND_HOME = "/app/workspace/entertainment-express"
EE_CLIENT_PORTAL = "/client"
EE_LOGIN = "/login"
# Public site roots: EE SaaS marketing on the control plane, the tenant's own
# branded landing on a tenant site.
EE_MARKETING_HOME = "index"
TENANT_HOME = "tenant_home"


def _is_backend_path(path: str) -> bool:
    return any(path == prefix or path.startswith(prefix + "/") for prefix in BACKEND_PREFIXES)


def _redirect(location: str) -> None:
    frappe.flags.redirect_location = location
    raise frappe.Redirect(302)


def sanitize_backend_urls() -> None:
    """Keep human-facing backend routes free of framework-brand path segments."""
    req = getattr(frappe.local, "request", None)
    if not req:
        return

    path = (getattr(req, "path", "") or "").strip() or "/"
    user = frappe.session.user or "Guest"

    # Frappe/ERPNext "Home" desk route resolves through Page doctype and can
    # leak framework UX/permissions. Keep all home entries on the EE workspace.
    if path == "/app/home" or path.startswith("/app/home/"):
        if user == "Guest":
            req.environ["PATH_INFO"] = EE_CLIENT_PORTAL
            frappe.local.path = EE_CLIENT_PORTAL.strip("/")
            return
        req.environ["PATH_INFO"] = EE_BACKEND_HOME
        frappe.local.path = EE_BACKEND_HOME.strip("/")
        return

    if path in {"/app", "/app/", "/desk", "/desk/"}:
        if user == "Guest":
            # before_request runs under frappe.app.application; raising Redirect here
            # becomes a 500. Rewrite the resolved path instead.
            req.environ["PATH_INFO"] = EE_CLIENT_PORTAL
            frappe.local.path = EE_CLIENT_PORTAL.strip("/")
            return
        if path in {"/desk", "/desk/"}:
            req.environ["PATH_INFO"] = EE_BACKEND_HOME
            frappe.local.path = EE_BACKEND_HOME.strip("/")
            return

    if not path.startswith("/app") and not path.startswith("/desk"):
        return

    lowered = path.lower()
    if any(token in lowered for token in BRANDED_BACKEND_PATH_PARTS):
        req.environ["PATH_INFO"] = EE_BACKEND_HOME
        frappe.local.path = EE_BACKEND_HOME.strip("/")


def enforce_backend_boundary() -> None:
    """
    Restrict Desk/backend entry points to owner/employee accounts only.
    Guests still follow normal login behavior; logged-in non-staff accounts are denied.
    """
    req = getattr(frappe.local, "request", None)
    if not req:
        return

    path = (getattr(req, "path", "") or "").strip() or "/"
    if not _is_backend_path(path):
        return

    user = frappe.session.user or "Guest"
    if user in {"Guest", "Administrator"}:
        return

    roles = set(frappe.get_roles(user) or [])
    if roles.intersection(INTERNAL_BACKEND_ROLES):
        return

    frappe.throw(
        _("Backend access is restricted to Entertainment Express owners and employees. Use the /client portal."),
        frappe.PermissionError,
    )


def require_client_login() -> None:
    """Gate the /client customer portal behind authentication.

    The portal is not public marketing; anonymous visitors are sent to login and
    returned to the page they requested after signing in. Called from each
    www/client/*.py get_context.
    """
    if (frappe.session.user or "Guest") != "Guest":
        return
    req = getattr(frappe.local, "request", None)
    dest = (getattr(req, "path", None) or EE_CLIENT_PORTAL) if req else EE_CLIENT_PORTAL
    _redirect(f"{EE_LOGIN}?redirect-to={quote(dest, safe='/')}")


def _is_control_plane() -> bool:
    """The SaaS/control-plane site (admin.{base_domain}) sets ee_control_plane in
    site_config; every other site is a tenant."""
    return bool(frappe.conf.get("ee_control_plane"))


def get_website_user_home_page(user: str | None) -> str | None:
    """Resolve the website home (Frappe get_website_user_home_page hook).

    - Logged-in customers -> the /client portal.
    - Everyone else (guests, staff) -> the public home: EE SaaS marketing on the
      control plane, or the tenant's own branded landing on a tenant site.
    Staff still reach the desk via /app on login (Frappe handles that), so this
    only governs the public site root and "View Website".
    """
    if user and user != "Guest":
        roles = set(frappe.get_roles(user) or [])
        if not roles.intersection(INTERNAL_BACKEND_ROLES):
            return EE_CLIENT_PORTAL
    return EE_MARKETING_HOME if _is_control_plane() else TENANT_HOME
