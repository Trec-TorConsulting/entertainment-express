"""
JWT auth for Mobile API v2.

Issues short-lived access tokens (1h) + refresh tokens (30d). Tokens carry
scope claims used by mobile/crew/customer/dispatch endpoints.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

import frappe
from frappe.exceptions import PermissionError, ValidationError

try:
    import jwt
except ImportError:  # pragma: no cover
    jwt = None  # type: ignore

ACCESS_TTL_SECONDS = 60 * 60  # 1 hour
REFRESH_TTL_SECONDS = 60 * 60 * 24 * 30  # 30 days
ALGO = "HS256"

SCOPE_CREW_READ = "crew_read"
SCOPE_CREW_WRITE = "crew_write"
SCOPE_CUSTOMER_READ = "customer_read"
SCOPE_CUSTOMER_WRITE = "customer_write"
SCOPE_DISPATCH_READ = "dispatch_read"
SCOPE_DISPATCH_WRITE = "dispatch_write"


def _secret() -> str:
    secret = (
        frappe.conf.get("ee_jwt_secret")
        or frappe.conf.get("encryption_key")
        or "CHANGE_ME_IN_SITE_CONFIG"
    )
    if secret == "CHANGE_ME_IN_SITE_CONFIG":
        frappe.logger().warning("ee_jwt_secret is not set — using insecure default")
    return str(secret)


def _require_jwt_lib() -> None:
    if jwt is None:
        frappe.throw(
            "PyJWT is required for mobile API auth. Install with: pip install PyJWT",
            frappe.ValidationError,
        )


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _encode(payload: dict[str, Any]) -> str:
    _require_jwt_lib()
    return jwt.encode(payload, _secret(), algorithm=ALGO)


def _decode(token: str, *, verify_exp: bool = True) -> dict[str, Any]:
    _require_jwt_lib()
    options = {"verify_signature": True, "verify_exp": verify_exp}
    try:
        return jwt.decode(token, _secret(), algorithms=[ALGO], options=options)
    except jwt.ExpiredSignatureError as exc:
        raise PermissionError("Token expired") from exc
    except Exception as exc:
        raise PermissionError("Invalid authorization token") from exc


def scopes_for_user(user: str) -> list[str]:
    """Derive API scopes from Frappe roles."""
    roles = set(frappe.get_roles(user))
    scopes: list[str] = []

    if roles & {"EE Crew", "Employee", "System Manager"}:
        scopes.extend([SCOPE_CREW_READ, SCOPE_CREW_WRITE])
    if roles & {"EE Customer", "Customer", "System Manager"}:
        scopes.extend([SCOPE_CUSTOMER_READ, SCOPE_CUSTOMER_WRITE])
    if roles & {"EE Dispatcher", "EE Tenant Admin", "System Manager"}:
        scopes.extend([SCOPE_DISPATCH_READ, SCOPE_DISPATCH_WRITE])

    # Deduplicate while preserving order
    seen: set[str] = set()
    unique: list[str] = []
    for s in scopes:
        if s not in seen:
            seen.add(s)
            unique.append(s)
    return unique


def issue_token_pair(user: str, scopes: list[str] | None = None) -> dict[str, Any]:
    """Return access + refresh tokens for a Frappe user."""
    scopes = scopes if scopes is not None else scopes_for_user(user)
    now = _now()
    access_payload = {
        "sub": user,
        "scopes": scopes,
        "typ": "access",
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(seconds=ACCESS_TTL_SECONDS)).timestamp()),
    }
    refresh_payload = {
        "sub": user,
        "scopes": scopes,
        "typ": "refresh",
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(seconds=REFRESH_TTL_SECONDS)).timestamp()),
    }
    return {
        "access_token": _encode(access_payload),
        "refresh_token": _encode(refresh_payload),
        "token_type": "Bearer",
        "expires_in": ACCESS_TTL_SECONDS,
        "scopes": scopes,
        "user": user,
    }


def verify_access_token(token: str) -> dict[str, Any]:
    payload = _decode(token)
    if payload.get("typ") != "access":
        raise PermissionError("Access token required")
    if not payload.get("sub"):
        raise PermissionError("Invalid authorization token")
    return payload


def refresh_access_token(refresh_token: str) -> dict[str, Any]:
    payload = _decode(refresh_token)
    if payload.get("typ") != "refresh":
        raise PermissionError("Refresh token required")
    user = payload.get("sub")
    if not user:
        raise PermissionError("Invalid refresh token")
    scopes = payload.get("scopes") or scopes_for_user(user)
    return issue_token_pair(user, scopes)


def require_scopes(payload: dict[str, Any], *needed: str) -> None:
    granted = set(payload.get("scopes") or [])
    if not needed:
        return
    if not granted.intersection(needed):
        raise PermissionError(f"Missing required scope: {', '.join(needed)}")


@frappe.whitelist(allow_guest=True, methods=["POST"])
def auth_login(email: str = None, password: str = None) -> dict:
    """
    POST — exchange email/password for JWT access + refresh tokens.
    """
    email = (email or "").strip()
    password = password or ""
    if not email or not password:
        raise ValidationError("email and password are required")

    from entertainment_express.api.rate_limit import check_rate_limit

    check_rate_limit(email, limit=30)  # stricter on auth

    try:
        frappe.local.login_manager.authenticate(user=email, pwd=password)
        frappe.local.login_manager.post_login()
    except Exception as exc:
        raise PermissionError("Invalid email or password") from exc

    user = frappe.session.user
    if user in ("Guest", None):
        raise PermissionError("Invalid email or password")

    tokens = issue_token_pair(user)
    return {
        "status": "success",
        "data": {
            **tokens,
            "full_name": frappe.db.get_value("User", user, "full_name"),
            "roles": frappe.get_roles(user),
        },
        "meta": {"timestamp": frappe.utils.now_datetime().isoformat(), "version": "2.0"},
    }


@frappe.whitelist(allow_guest=True, methods=["POST"])
def auth_refresh(refresh_token: str = None) -> dict:
    """POST — exchange a refresh token for a new access/refresh pair."""
    if not refresh_token:
        raise ValidationError("refresh_token is required")
    tokens = refresh_access_token(refresh_token)
    return {
        "status": "success",
        "data": tokens,
        "meta": {"timestamp": frappe.utils.now_datetime().isoformat(), "version": "2.0"},
    }
