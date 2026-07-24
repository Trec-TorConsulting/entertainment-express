"""
Entitlement helper for plan-based feature gating.
Phase-1 minimal implementation — checks Plan Entitlement records.
"""

import frappe


def has_entitlement(feature_key: str, site_name: str | None = None) -> bool | int:
    """
    Check whether the current site's plan includes feature_key.

    Returns:
        True/False for boolean features (limit_value == "1" / "0")
        int limit for numeric features (e.g. max_bookings_per_month = 100)
        True if limit_value == "unlimited"
        False if feature not found
    """
    # Get tenant for current site
    tenant_name = _get_tenant_name(site_name)
    if not tenant_name:
        return True  # No tenant context (control plane or dev) — allow

    plan_name = frappe.db.get_value("Tenant", tenant_name, "plan")
    if not plan_name:
        return False

    entitlement = frappe.db.get_value(
        "Plan Entitlement",
        {"parent": plan_name, "feature_key": feature_key},
        "limit_value",
    )
    if entitlement is None:
        return False
    if entitlement == "unlimited":
        return True
    try:
        return int(entitlement)
    except (ValueError, TypeError):
        return bool(entitlement and entitlement != "0")


def _get_tenant_name(site_name: str | None) -> str | None:
    """Look up the Tenant record for the given site (or current site)."""
    site = site_name or frappe.local.site
    return frappe.db.get_value("Tenant", {"site_name": site}, "name")
