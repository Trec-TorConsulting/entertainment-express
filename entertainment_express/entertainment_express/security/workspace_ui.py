"""Workspace UI policy overrides for white-labeled tenant desks."""

from __future__ import annotations

import frappe
from frappe.desk.desktop import get_workspace_sidebar_items as _base_get_workspace_sidebar_items


def _is_tenant_owner(user: str) -> bool:
    if not user or user == "Guest":
        return False
    roles = set(frappe.get_roles(user) or [])
    return "EE Tenant Admin" in roles


@frappe.whitelist()
def get_workspace_sidebar_items(user: str | None = None):
    """Wrap Frappe workspace sidebar payload and hide Workspace creation for owners."""
    previous_user = None
    target_user = user or frappe.session.user

    if user and user != frappe.session.user:
        previous_user = frappe.session.user
        frappe.set_user(user)

    try:
        payload = _base_get_workspace_sidebar_items()
    finally:
        if previous_user is not None:
            frappe.set_user(previous_user)

    if _is_tenant_owner(target_user):
        payload["has_create_access"] = False

    return payload
