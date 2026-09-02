"""
Simple rate limiting for Mobile API v2.

Uses Frappe's Redis cache. Default: 100 requests / 60s per identity key
(user or client IP). On exceed, raises frappe.RateLimitExceededError with
Retry-After semantics via response header when available.
"""

from __future__ import annotations

import time
from functools import wraps
from typing import Callable

import frappe

DEFAULT_LIMIT = 100
DEFAULT_WINDOW = 60  # seconds


def _client_ip() -> str:
    try:
        return (
            frappe.get_request_header("X-Forwarded-For", "").split(",")[0].strip()
            or frappe.get_request_header("X-Real-Ip", "")
            or getattr(getattr(frappe.local, "request", None), "remote_addr", None)
            or "unknown"
        )
    except Exception:
        return "unknown"


def rate_limit_key(identity: str | None = None) -> str:
    identity = identity or frappe.session.user or _client_ip()
    site = getattr(getattr(frappe, "local", None), "site", None) or "site"
    return f"ee:rl:{site}:{identity}:{int(time.time() // DEFAULT_WINDOW)}"


def check_rate_limit(identity: str | None = None, limit: int = DEFAULT_LIMIT) -> None:
    """Increment counter and throw if over limit."""
    key = rate_limit_key(identity)
    cache = frappe.cache()
    count = cache.get_value(key) or 0
    count = int(count) + 1
    cache.set_value(key, count, expires_in_sec=DEFAULT_WINDOW + 5)

    if count > limit:
        retry_after = DEFAULT_WINDOW - int(time.time() % DEFAULT_WINDOW)
        try:
            frappe.local.response["http_status_code"] = 429
            frappe.local.response["Retry-After"] = str(max(1, retry_after))
        except Exception:
            pass
        frappe.throw(
            f"Rate limit exceeded. Retry after {max(1, retry_after)} seconds.",
            frappe.RateLimitExceededError if hasattr(frappe, "RateLimitExceededError") else frappe.ValidationError,
        )


def rate_limited(limit: int = DEFAULT_LIMIT):
    """Decorator for whitelist methods."""

    def decorator(fn: Callable):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            identity = None
            try:
                # Prefer authenticated user when available
                identity = frappe.session.user if frappe.session.user != "Guest" else _client_ip()
            except Exception:
                identity = _client_ip()
            check_rate_limit(identity, limit=limit)
            return fn(*args, **kwargs)

        return wrapper

    return decorator
