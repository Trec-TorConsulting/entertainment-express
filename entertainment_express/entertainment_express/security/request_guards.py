"""Request boundary guards for backend and client portal access."""

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
