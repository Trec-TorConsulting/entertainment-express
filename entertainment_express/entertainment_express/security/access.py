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


def _user_emails(user: str) -> set[str]:
    """Login id and profile email, normalized for Customer/Contact lookups."""
    emails: set[str] = set()
    ident = (user or "").strip().lower()
    if ident:
        emails.add(ident)
    profile = frappe.db.get_value("User", user, "email")
    if profile:
        emails.add(str(profile).strip().lower())
    return emails


def customer_names_for_user(user: str | None = None) -> list[str]:
    """Customer records owned by this portal user (email on Customer or linked Contact)."""
    user = user or frappe.session.user
    if not user or user == "Guest":
        return []
    names: set[str] = set()
    for email in _user_emails(user):
        customer = frappe.db.get_value("Customer", {"email_id": email}, "name")
        if customer:
            names.add(customer)
        contact = frappe.db.get_value("Contact", {"email_id": email}, "name")
        if not contact:
            continue
        for link in frappe.get_all(
            "Dynamic Link",
            filters={"parenttype": "Contact", "parent": contact, "link_doctype": "Customer"},
            pluck="link_name",
            ignore_permissions=True,
        ):
            if link:
                names.add(link)
    return sorted(names)


def customer_name_for_user(user: str | None = None) -> str | None:
    names = customer_names_for_user(user)
    return names[0] if names else None


def assert_booking_access(booking_name: str) -> None:
    """Staff may access any booking on this site; customers only their own."""
    require_login()
    if not frappe.db.exists("Event Booking", booking_name):
        frappe.throw("Booking not found.", frappe.DoesNotExistError)
    if is_staff():
        return
    booking_customer = frappe.db.get_value("Event Booking", booking_name, "customer")
    if booking_customer and booking_customer in customer_names_for_user():
        return
    try:
        from entertainment_express.api.portal_collaboration import is_booking_member

        if is_booking_member(booking_name, frappe.session.user):
            return
    except Exception:
        pass
    frappe.throw("You cannot access this booking.", frappe.PermissionError)
