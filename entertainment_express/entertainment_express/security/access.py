"""Shared role and customer-ownership checks."""

from __future__ import annotations

import frappe

STAFF_ROLES = {
    "System Manager",
    "SaaS Operator",
    "EE Tenant Admin",
    "EE Sales",
    "EE Dispatcher",
    "EE Accounting",
    "EE HR",
    "EE Office",
}


def require_login() -> None:
    if not frappe.session.user or frappe.session.user == "Guest":
        frappe.throw("Please sign in to continue.", frappe.PermissionError)


def require_roles(*roles: str) -> None:
    require_login()
    user_roles = set(frappe.get_roles(frappe.session.user) or [])
    if not user_roles.intersection(roles):
        frappe.throw("You do not have permission to do that.", frappe.PermissionError)


def is_staff(user: str | None = None) -> bool:
    user = user or frappe.session.user
    return bool(set(frappe.get_roles(user) or []).intersection(STAFF_ROLES | {"EE Crew", "EE Entertainer"}))


def customer_name_for_user(user: str | None = None) -> str | None:
    user = user or frappe.session.user
    if not user or user == "Guest":
        return None
    by_email = frappe.db.get_value("Customer", {"email_id": user}, "name")
    if by_email:
        return by_email
    contact = frappe.db.get_value("Contact", {"email_id": user}, "name")
    if not contact:
        return None
    return frappe.db.get_value(
        "Dynamic Link",
        {"parenttype": "Contact", "parent": contact, "link_doctype": "Customer"},
        "link_name",
    )


def assert_booking_access(booking_name: str) -> None:
    """Staff may access any booking on this site; customers only their own."""
    require_login()
    if not frappe.db.exists("Event Booking", booking_name):
        frappe.throw("Booking not found.", frappe.DoesNotExistError)
    if is_staff():
        return
    customer = customer_name_for_user()
    booking_customer = frappe.db.get_value("Event Booking", booking_name, "customer")
    if customer and customer == booking_customer:
        return
    try:
        from entertainment_express.api.portal_collaboration import is_booking_member

        if is_booking_member(booking_name, frappe.session.user):
            return
    except Exception:
        pass
    frappe.throw("You cannot access this booking.", frappe.PermissionError)
