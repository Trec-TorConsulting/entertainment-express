"""Workforce and staff entitlement enforcement."""

from __future__ import annotations

import frappe
from entertainment_express.control_plane.entitlements import has_entitlement


def check_staff_limit(doc=None, method=None) -> None:
    """Enforce max_staff plan limit before adding or inviting a new EE staff user."""
    limit = has_entitlement("max_staff")
    if limit is True:
        limit = has_entitlement("max_staff_users")
    if limit is not True and isinstance(limit, int) and limit < 9999:
        staff_count = frappe.db.count("User", {"enabled": 1, "user_type": "System User"})
        if staff_count >= limit:
            frappe.throw(
                f"Your plan allows {limit} staff members. Upgrade to Pro for more.",
                frappe.ValidationError,
            )
