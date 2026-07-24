"""
Tenant bootstrap — runs INSIDE the tenant site after app installation.

Creates: EE roles/perms, ERPNext Company, default Service Area, starter catalog,
         tenant admin user, email defaults.

All operations are idempotent (skip if already exists).

Called by the provisioner after migrate:
    from entertainment_express.control_plane import bootstrap
    bootstrap.run(site_name, tenant_doc)
"""

import frappe
from frappe.utils import now_datetime


def run(site_name: str, tenant_doc) -> None:
    """
    Execute all bootstrap steps inside the tenant site context.
    The provisioner switches site context via frappe.init(site=site_name) before calling.
    """
    frappe.init(site=site_name)
    frappe.connect()
    try:
        _ensure_company(tenant_doc)
        _ensure_roles_permissions()
        _ensure_default_service_area()
        _ensure_starter_catalog()
        _ensure_tenant_admin(tenant_doc)
        _ensure_email_defaults()
        frappe.db.commit()
    finally:
        frappe.destroy()


# ── Bootstrap steps ──────────────────────────────────────────────────────────

def _ensure_company(tenant_doc) -> None:
    company_name = tenant_doc.company_name
    if frappe.db.exists("Company", company_name):
        return
    company = frappe.get_doc({
        "doctype": "Company",
        "company_name": company_name,
        "abbr": _make_abbr(company_name),
        "default_currency": "USD",
        "country": "United States",
    })
    company.insert(ignore_permissions=True)
    frappe.db.set_single_value("Global Defaults", "default_company", company_name)


def _ensure_roles_permissions() -> None:
    """EE roles are loaded via fixtures/role.json on migrate — nothing to add here."""
    pass


def _ensure_default_service_area() -> None:
    if frappe.db.exists("Service Area", {"area_name": "Default Service Area"}):
        return
    area = frappe.get_doc({
        "doctype": "Service Area",
        "area_name": "Default Service Area",
        "match_type": "zip_list",
        "zips": "",
        "travel_fee": 0,
        "active": 1,
        "out_of_area_policy": "flag_for_review",
    })
    area.insert(ignore_permissions=True)


def _ensure_starter_catalog() -> None:
    """Create example Service Items so the tenant has something to start with."""
    starter_items = [
        {
            "item_name": "DJ Package — 4 Hours",
            "item_code": "EE-DJ-4HR",
            "item_group": "Services",
            "is_service_item": 1,
            "ee_item_type": "service",
            "ee_vertical_tag": "dj",
            "ee_duration_minutes": 240,
            "ee_unit": "event",
            "ee_requires_crew_role": None,
            "standard_rate": 800.0,
        },
        {
            "item_name": "DJ Add-on: Extra Hour",
            "item_code": "EE-DJ-EXTRA-HR",
            "item_group": "Services",
            "is_service_item": 1,
            "ee_item_type": "addon",
            "ee_vertical_tag": "dj",
            "ee_unit": "hour",
            "standard_rate": 150.0,
        },
    ]
    for item_def in starter_items:
        if frappe.db.exists("Item", item_def["item_code"]):
            continue
        item = frappe.get_doc({"doctype": "Item", **item_def})
        item.insert(ignore_permissions=True)


def _ensure_tenant_admin(tenant_doc) -> None:
    email = tenant_doc.primary_email
    if not email:
        return
    if frappe.db.exists("User", email):
        # Ensure they have EE Tenant Admin role
        user = frappe.get_doc("User", email)
        role_names = [r.role for r in user.roles]
        if "EE Tenant Admin" not in role_names:
            user.append("roles", {"role": "EE Tenant Admin"})
            user.save(ignore_permissions=True)
        return

    user = frappe.get_doc({
        "doctype": "User",
        "email": email,
        "first_name": tenant_doc.primary_contact or email.split("@")[0],
        "enabled": 1,
        "send_welcome_email": 0,
        "roles": [{"role": "EE Tenant Admin"}],
    })
    user.insert(ignore_permissions=True)


def _ensure_email_defaults() -> None:
    """Placeholder — SMTP is configured via K8s secret / site config in later steps."""
    pass


# ── Helpers ──────────────────────────────────────────────────────────────────

def _make_abbr(company_name: str) -> str:
    """Generate a short abbreviation from company name (max 5 chars, uppercase)."""
    words = company_name.split()
    abbr = "".join(w[0] for w in words if w).upper()[:5]
    return abbr or "EE"
