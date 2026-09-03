"""Tenant hostname helpers — single source of truth for signup UX and provisioning."""

from __future__ import annotations

import frappe


def tenant_base_domain() -> str:
    """DNS suffix for tenant sites, e.g. ``entx.app`` → ``acme.entx.app``."""
    conf = frappe.conf or {}
    domain = (conf.get("ee_tenant_domain") or conf.get("ee_base_domain") or "entx.app").strip().lower()
    return domain.lstrip(".")


def tenant_site_name(slug: str) -> str:
    slug = (slug or "").strip().lower()
    return f"{slug}.{tenant_base_domain()}"


def tenant_site_url(slug: str, *, https: bool = True) -> str:
    host = tenant_site_name(slug)
    return f"{'https' if https else 'http'}://{host}"
