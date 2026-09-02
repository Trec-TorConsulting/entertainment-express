"""Login lockout and privileged 2FA on this site only."""

from __future__ import annotations

import frappe

from entertainment_express.security import audit

LOCK_LIMIT = 8
LOCK_WINDOW = 900
PRIVILEGED = {"EE Tenant Admin", "SaaS Operator", "System Manager"}
EXEMPT_USERS = {"Administrator", "Guest", "guest"}
LOGIN_PATHS = ("/login", "/api/method/login", "frappe.auth.login", "frappe.core.doctype.user.user.login")


def _site() -> str:
    return getattr(getattr(frappe, "local", None), "site", None) or "site"


def _cache():
    try:
        return frappe.cache()
    except Exception:
        return None


def _path() -> str:
    req = getattr(getattr(frappe, "local", None), "request", None)
    return (getattr(req, "path", None) or getattr(getattr(frappe, "local", None), "path", None) or "").lower()


def _method() -> str:
    req = getattr(getattr(frappe, "local", None), "request", None)
    return (getattr(req, "method", None) or "GET").upper()


def _identity() -> str:
    user = getattr(getattr(frappe, "session", None), "user", "") or ""
    if user and user not in ("Guest", "guest"):
        return user.lower()
    try:
        form = getattr(getattr(frappe, "local", None), "form_dict", None) or {}
        email = (form.get("usr") or form.get("email") or "") if hasattr(form, "get") else ""
        if email:
            return str(email).lower()
    except Exception:
        pass
    try:
        return (
            frappe.get_request_header("X-Forwarded-For", "").split(",")[0].strip()
            or "unknown"
        )
    except Exception:
        return "unknown"


def _is_login_post() -> bool:
    if _method() != "POST":
        return False
    path = _path()
    return any(token in path for token in LOGIN_PATHS)


def check_login_lockout() -> None:
    if not _is_login_post():
        return
    cache = _cache()
    if not cache:
        return
    key = f"ee:lock:{_site()}:{_identity()}"
    try:
        count = int(cache.get_value(key) or 0)
    except Exception:
        count = 0
    if count >= LOCK_LIMIT:
        frappe.throw("Too many sign-in tries. Wait a few minutes and try again.", frappe.PermissionError)
    try:
        cache.set_value(key, count + 1, expires_in_sec=LOCK_WINDOW)
    except Exception:
        pass


def clear_login_failures(login_manager=None):
    cache = _cache()
    if not cache:
        return
    try:
        cache.set_value(f"ee:lock:{_site()}:{_identity()}", 0, expires_in_sec=60)
    except Exception:
        pass


def _user_has_2fa(user: str) -> bool:
    try:
        from frappe.twofactor import get_otpsecret_for_user

        return bool(get_otpsecret_for_user(user))
    except Exception:
        pass
    try:
        return bool(frappe.db.get_value("User", user, "enabled_2fa"))
    except Exception:
        return False


def enforce_privileged_2fa() -> None:
    user = getattr(getattr(frappe, "session", None), "user", "") or ""
    if user in EXEMPT_USERS or not user:
        return
    conf = getattr(frappe, "conf", None) or {}
    if not int(conf.get("ee_require_2fa") or 0):
        return
    path = _path()
    if any(token in path for token in ("/login", "twofactor", "two_factor", "hardening.security_status")):
        return
    roles = set(frappe.get_roles(user) or [])
    if not roles.intersection(PRIVILEGED):
        return
    if _user_has_2fa(user):
        return
    frappe.throw("Turn on two-step codes before using this workspace.", frappe.PermissionError)


def on_booking_update(doc, method=None):
    changed = False
    try:
        changed = bool(doc.has_value_changed("event_date") or doc.has_value_changed("status"))
    except Exception:
        changed = True
    if not changed:
        return
    audit.write(
        "booking_changed",
        "Event Booking",
        getattr(doc, "name", "") or "",
        after={"event_date": str(getattr(doc, "event_date", "") or ""), "status": getattr(doc, "status", "") or ""},
    )


def on_contract_update(doc, method=None):
    if (doc.status or "") == "signed" and (hasattr(doc, "has_value_changed") and doc.has_value_changed("status")):
        audit.write("contract_signed", "EE Contract", doc.name, after={"status": "signed"})


def on_invoice_submit(doc, method=None):
    audit.write("invoice_submitted", "Sales Invoice", doc.name, extra={"grand_total": str(getattr(doc, "grand_total", ""))})
