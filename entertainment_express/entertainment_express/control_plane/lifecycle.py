"""Tenant suspend / resume / deprovision."""

from __future__ import annotations

import frappe
from frappe.utils import now_datetime


def suspend_tenant(tenant_name: str, reason: str = "") -> dict:
    tenant = frappe.get_doc("Tenant", tenant_name)
    tenant.status = "suspended"
    tenant.suspended_on = now_datetime()
    if reason:
        tenant.notes = ((tenant.notes or "") + f"\nSuspended: {reason}").strip()
    tenant.save()
    _set_site_flag(tenant.site_name, "ee_suspended", 1)
    sub = frappe.db.get_value("Subscription", {"tenant": tenant_name, "status": ["in", ["active", "past_due", "trialing"]]}, "name")
    if sub:
        frappe.db.set_value("Subscription", sub, "status", "suspended")
    frappe.db.commit()
    return {"tenant": tenant_name, "status": "suspended"}


def resume_tenant(tenant_name: str) -> dict:
    tenant = frappe.get_doc("Tenant", tenant_name)
    tenant.status = "active"
    tenant.suspended_on = None
    tenant.save()
    _set_site_flag(tenant.site_name, "ee_suspended", 0)
    sub = frappe.db.get_value("Subscription", {"tenant": tenant_name, "status": "suspended"}, "name")
    if sub:
        frappe.db.set_value("Subscription", sub, "status", "active")
    frappe.db.commit()
    return {"tenant": tenant_name, "status": "active"}


def deprovision_tenant(tenant_name: str) -> dict:
    tenant = frappe.get_doc("Tenant", tenant_name)
    tenant.status = "deprovisioning"
    tenant.save()
    frappe.db.commit()
    return {"tenant": tenant_name, "status": "deprovisioning"}


def _set_site_flag(site_name: str, key: str, value):
    if not site_name:
        return
    import json
    import os

    if frappe.local.site == site_name:
        try:
            from frappe.installer import update_site_config

            update_site_config(key, value)
            frappe.conf[key] = value
            return
        except Exception:
            frappe.log_error(frappe.get_traceback(), "EE site flag")
    sites_path = os.path.abspath(os.path.join(frappe.get_site_path(), os.pardir))
    conf_path = os.path.join(sites_path, site_name, "site_config.json")
    if not os.path.isfile(conf_path):
        return
    with open(conf_path, encoding="utf-8") as handle:
        conf = json.load(handle)
    conf[key] = value
    with open(conf_path, "w", encoding="utf-8") as handle:
        json.dump(conf, handle, indent=1)
        handle.write("\n")
