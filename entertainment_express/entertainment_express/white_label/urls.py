"""Canonical public base URL for tenant white-label / custom domains."""

from __future__ import annotations

import json

import frappe


def _conf() -> dict:
    return getattr(frappe, "conf", None) or {}


def _domain_rows() -> list[dict]:
    raw = _conf().get("ee_custom_domains") or []
    if isinstance(raw, str):
        try:
            raw = json.loads(raw)
        except Exception:
            raw = []
    return [r for r in (raw or []) if isinstance(r, dict)]


def verified_hostnames() -> list[str]:
    return [str(r.get("hostname") or "").strip().lower() for r in _domain_rows() if int(r.get("verified") or 0)]


def default_site_host() -> str:
    host = (_conf().get("host_name") or "").replace("https://", "").replace("http://", "").split("/")[0]
    if host:
        return host.rstrip(".")
    return (getattr(frappe.local, "site", None) or "").strip().rstrip(".")


def get_canonical_host() -> str:
    """Prefer primary verified custom domain, else first verified, else default site host."""
    verified = set(verified_hostnames())
    primary = ""
    try:
        primary = (frappe.db.get_single_value("EE Portal Settings", "primary_custom_domain") or "").strip().lower()
    except Exception:
        primary = ""
    if primary and primary in verified:
        return primary
    for host in verified_hostnames():
        if host:
            return host
    return default_site_host()


def get_public_base_url() -> str:
    host = get_canonical_host()
    if not host:
        try:
            return (frappe.utils.get_url() or "").rstrip("/")
        except Exception:
            return ""
    if host.startswith("http://") or host.startswith("https://"):
        return host.rstrip("/")
    return f"https://{host}"


def absolute_url(path: str = "") -> str:
    base = get_public_base_url().rstrip("/")
    path = path or ""
    if not path:
        return base
    if path.startswith("http://") or path.startswith("https://"):
        return path
    if not path.startswith("/"):
        path = "/" + path
    return f"{base}{path}"


def email_from_name(brand_from: str | None = None) -> str:
    if brand_from and str(brand_from).strip():
        return str(brand_from).strip()
    try:
        name = (frappe.db.get_single_value("EE Portal Settings", "email_from_name") or "").strip()
        if name:
            return name
        return (frappe.db.get_single_value("EE Portal Settings", "brand_name") or "").strip()
    except Exception:
        return ""
