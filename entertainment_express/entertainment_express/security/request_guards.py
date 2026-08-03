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
    "EE Finance",
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


def _is_backend_path(path: str) -> bool:
    return any(path == prefix or path.startswith(prefix + "/") for prefix in BACKEND_PREFIXES)


def _redirect(location: str) -> None:
    frappe.local.response["type"] = "redirect"
    frappe.local.response["location"] = location
    frappe.local.response["http_status_code"] = 302
    raise frappe.Redirect


def sanitize_backend_urls() -> None:
    """Keep human-facing backend routes free of framework-brand path segments."""
    req = getattr(frappe.local, "request", None)
    if not req:
        return

    path = (getattr(req, "path", "") or "").strip() or "/"

    if path in {"/desk", "/desk/"}:
        _redirect(EE_BACKEND_HOME)

    if not path.startswith("/app") and not path.startswith("/desk"):
        return

    lowered = path.lower()
    if any(token in lowered for token in BRANDED_BACKEND_PATH_PARTS):
        _redirect(EE_BACKEND_HOME)


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
