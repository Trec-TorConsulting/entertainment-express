"""Request boundary guards for backend and client portal access."""

from urllib.parse import quote

import frappe
from frappe import _


SUPER_ADMIN_ROLES = {
    "System Manager",
    "SaaS Operator",
}
OWNER_ROLES = {
    "EE Tenant Admin",
}
EMPLOYEE_ROLES = {
    "EE Sales",
    "EE Dispatcher",
    "EE HR",
    "EE Accounting",
    "EE Office",
    "EE Entertainer",
    "EE Crew",
}
CUSTOMER_ROLES = {
    "EE Customer",
}

INTERNAL_BACKEND_ROLES = SUPER_ADMIN_ROLES | OWNER_ROLES | EMPLOYEE_ROLES

BACKEND_PREFIXES = (
    "/app",
    "/desk",
    "/api/method/frappe.desk",
)

HEALTH_ENDPOINTS = {
    "/api/method/ping",
    "/api/method/frappe.utils.health.ping",
    "/api/method/frappe.health.get_health_status",
}

# Any direct branded framework route in backend navigation should be rewritten
# to the EE workspace entry route.
BRANDED_BACKEND_PATH_PARTS = (
    "/workspace/erpnext",
    "/erpnext",
    "/frappe",
)
EE_BACKEND_HOME = "/app/workspace/entertainment-express"
EE_OPERATOR_HOME = EE_BACKEND_HOME
# Canonical tenant-admin cockpit. Do not alias this to /admin.
EE_OWNER_PORTAL = "/owner"
EE_EMPLOYEE_PORTAL = "/employee"
EE_CLIENT_PORTAL = "/client"
EE_LOGIN = "/login"
# Public site roots: EE SaaS marketing on the control plane, the tenant's own
# branded landing on a tenant site.
EE_MARKETING_HOME = "index"
TENANT_HOME = "tenant_home"
PORTAL_MODE_OPTIONS = {"off", "warn", "enforce"}


def _get_user_roles(user: str) -> set[str]:
    if not user or user == "Guest":
        return set()
    return set(frappe.get_roles(user) or [])


def _is_super_admin(roles: set[str]) -> bool:
    return bool(roles.intersection(SUPER_ADMIN_ROLES))


def _is_owner(roles: set[str]) -> bool:
    return bool(roles.intersection(OWNER_ROLES))


def _is_employee(roles: set[str]) -> bool:
    return bool(roles.intersection(EMPLOYEE_ROLES))


def get_portal_mode() -> str:
    mode = (
        frappe.db.get_single_value("EE Portal Settings", "portal_mode")
        or frappe.conf.get("ee_portal_mode")
        or "warn"
    )
    mode = str(mode).strip().lower()
    return mode if mode in PORTAL_MODE_OPTIONS else "warn"


def resolve_home_portal(user: str) -> str:
    roles = _get_user_roles(user)
    if _is_super_admin(roles):
        return EE_OPERATOR_HOME
    if _is_owner(roles):
        return EE_OWNER_PORTAL
    if _is_employee(roles):
        return EE_EMPLOYEE_PORTAL
    return EE_CLIENT_PORTAL


def _is_backend_path(path: str) -> bool:
    return any(path == prefix or path.startswith(prefix + "/") for prefix in BACKEND_PREFIXES)


def _is_health_path(path: str) -> bool:
    return path in HEALTH_ENDPOINTS


def _redirect(location: str) -> None:
    frappe.flags.redirect_location = location
    raise frappe.Redirect(302)


def _rewrite_path(location: str) -> None:
    """Rewrite the in-flight request path (before_request cannot safely raise Redirect).

    Werkzeug caches ``request.path`` as a ``cached_property``. Reading it before a
    rewrite (to decide where to send the user) pins the old value, so we must clear
    those caches after updating PATH_INFO or ``get_response()`` still serves Desk.

    After clearing, immediately recompute ``path`` so exception handlers never see a
    Request with a missing ``path`` attribute (that previously caused HTTP 500).
    """
    req = getattr(frappe.local, "request", None)
    if not req:
        return
    environ = getattr(req, "environ", None)
    if environ is not None:
        environ["PATH_INFO"] = location
    # Only clear PATH_INFO-derived caches — never host (independent) and always
    # rebuild path so handle_exception / downstream code can read it.
    for key in ("path", "full_path", "url", "base_url", "url_root", "host_url"):
        req.__dict__.pop(key, None)
    try:
        _ = req.path  # recompute cached_property from environ
    except Exception:
        req.__dict__["path"] = location
    frappe.local.path = location.strip("/")


def enforce_tenant_suspension() -> None:
    """Tenant sites with ee_suspended refuse API work except health and login."""
    if not frappe.conf.get("ee_suspended"):
        return
    req = getattr(frappe.local, "request", None)
    if not req:
        return
    path = (getattr(req, "path", "") or "").strip() or "/"
    if _is_health_path(path) or path.startswith("/login") or path.startswith("/api/method/login"):
        return
    if path.startswith("/assets") or path.startswith("/files"):
        return
    frappe.throw(
        "This Entertainment Express account is suspended. Update billing to restore access.",
        frappe.PermissionError,
    )


def sanitize_backend_urls() -> None:
    """Keep human-facing backend routes free of framework-brand path segments."""
    req = getattr(frappe.local, "request", None)
    if not req:
        return

    path = (getattr(req, "path", "") or "").strip() or "/"
    if _is_health_path(path):
        return

    user = frappe.session.user or "Guest"
    roles = _get_user_roles(user)
    mode = get_portal_mode()

    def _resolve_enforced_target() -> str | None:
        if user == "Guest":
            return EE_CLIENT_PORTAL
        if _is_super_admin(roles):
            return None
        if mode != "enforce":
            return None
        if _is_owner(roles):
            return EE_OWNER_PORTAL
        if _is_employee(roles):
            return EE_EMPLOYEE_PORTAL
        return EE_CLIENT_PORTAL

    enforced_target = _resolve_enforced_target()

    # Frappe/ERPNext "Home" desk route resolves through Page doctype and can
    # leak framework UX/permissions. Keep all home entries on the EE workspace.
    if path == "/app/home" or path.startswith("/app/home/"):
        if enforced_target:
            _rewrite_path(enforced_target)
            return
        _rewrite_path(EE_BACKEND_HOME)
        return

    if path in {"/app", "/app/", "/desk", "/desk/"}:
        if enforced_target:
            # before_request runs under frappe.app.application; raising Redirect here
            # becomes a 500. Rewrite the resolved path instead.
            _rewrite_path(enforced_target)
            return
        if path in {"/desk", "/desk/"}:
            _rewrite_path(EE_BACKEND_HOME)
            return

    if not path.startswith("/app") and not path.startswith("/desk"):
        return

    if enforced_target:
        _rewrite_path(enforced_target)
        return

    lowered = path.lower()
    if any(token in lowered for token in BRANDED_BACKEND_PATH_PARTS):
        _rewrite_path(EE_BACKEND_HOME)


def enforce_backend_boundary() -> None:
    """
    Restrict deep Desk/backend entry points to super-admin accounts in enforce mode.
    Non-enforced modes keep legacy behavior while portals reach parity.
    """
    req = getattr(frappe.local, "request", None)
    if not req:
        return

    path = (getattr(req, "path", "") or "").strip() or "/"
    if _is_health_path(path):
        return

    if not _is_backend_path(path):
        return

    if get_portal_mode() != "enforce":
        return

    user = frappe.session.user or "Guest"
    if user in {"Guest", "Administrator"}:
        return

    roles = _get_user_roles(user)
    if _is_super_admin(roles):
        return

    # Keep users inside their permitted portal boundary instead of surfacing
    # a hard permission error when stale /app or desk API paths are hit.
    _rewrite_path(resolve_home_portal(user))


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


def require_owner_login() -> None:
    """Allow an explicit /owner visit if the user has EE Tenant Admin.

    System Manager / SaaS Operator still *home* to Desk (resolve_home_portal), but a
    dual-role operator who opens /owner is not bounced off the cockpit.
    """
    user = frappe.session.user or "Guest"
    if user == "Guest":
        req = getattr(frappe.local, "request", None)
        dest = (getattr(req, "path", None) or EE_OWNER_PORTAL) if req else EE_OWNER_PORTAL
        _redirect(f"{EE_LOGIN}?redirect-to={quote(dest, safe='/')}")

    roles = _get_user_roles(user)
    if _is_owner(roles):
        return
    _redirect(resolve_home_portal(user))


def require_employee_login() -> None:
    """Allow an explicit /employee visit if the user has an employee role."""
    user = frappe.session.user or "Guest"
    if user == "Guest":
        req = getattr(frappe.local, "request", None)
        dest = (getattr(req, "path", None) or EE_EMPLOYEE_PORTAL) if req else EE_EMPLOYEE_PORTAL
        _redirect(f"{EE_LOGIN}?redirect-to={quote(dest, safe='/')}")

    roles = _get_user_roles(user)
    if _is_employee(roles):
        return
    _redirect(resolve_home_portal(user))


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
        return resolve_home_portal(user)
    return EE_MARKETING_HOME if _is_control_plane() else TENANT_HOME
