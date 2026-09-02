"""Tenant suspend / resume / deprovision."""

from __future__ import annotations

import json
import os

import frappe
from frappe.utils import now_datetime


def suspend_tenant(tenant_name: str, reason: str = "") -> dict:
    tenant = frappe.get_doc("Tenant", tenant_name)
    tenant.status = "suspended"
    tenant.suspended_on = now_datetime()
    if reason:
        tenant.notes = ((tenant.notes or "") + f"\nSuspended: {reason}").strip()
    tenant.save()
    update_site_flags(tenant.site_name, {"ee_suspended": 1, "ee_subscription_status": "suspended"})
    sub = frappe.db.get_value(
        "Subscription",
        {"tenant": tenant_name, "status": ["in", ["active", "past_due", "trialing"]]},
        "name",
    )
    if sub:
        frappe.db.set_value("Subscription", sub, "status", "suspended")
    frappe.db.commit()
    return {"tenant": tenant_name, "status": "suspended"}


def resume_tenant(tenant_name: str) -> dict:
    tenant = frappe.get_doc("Tenant", tenant_name)
    tenant.status = "active"
    tenant.suspended_on = None
    tenant.save()
    update_site_flags(tenant.site_name, {"ee_suspended": 0})
    sub = frappe.db.get_value("Subscription", {"tenant": tenant_name, "status": "suspended"}, "name")
    if sub:
        frappe.db.set_value("Subscription", sub, "status", "active")
        update_site_flags(tenant.site_name, {"ee_subscription_status": "active"})
    frappe.db.commit()
    return {"tenant": tenant_name, "status": "active"}


def deprovision_tenant(tenant_name: str) -> dict:
    tenant = frappe.get_doc("Tenant", tenant_name)
    if tenant.status in ("deleted", "deprovisioning"):
        return {"tenant": tenant_name, "status": tenant.status}
    tenant.status = "deprovisioning"
    tenant.save()
    existing = frappe.db.exists(
        "Provisioning Job",
        {"tenant": tenant_name, "action": "deprovision", "state": ["in", ["queued", "running"]]},
    )
    if not existing:
        job = frappe.get_doc(
            {
                "doctype": "Provisioning Job",
                "tenant": tenant_name,
                "action": "deprovision",
                "state": "queued",
                "log": "Queued by deprovision_tenant",
            }
        )
        job.insert(ignore_permissions=True)
        from entertainment_express.control_plane.provisioner import enqueue_provision

        enqueue_provision(job.name)
    frappe.db.commit()
    return {"tenant": tenant_name, "status": "deprovisioning"}


def automations_paused() -> bool:
    return bool(getattr(frappe, "conf", None) and frappe.conf.get("ee_suspended"))


def read_site_config(site_name: str) -> dict:
    path = _site_config_path(site_name)
    if not path or not os.path.isfile(path):
        return {}
    with open(path, encoding="utf-8") as handle:
        return json.load(handle)


def update_site_flags(site_name: str, flags: dict) -> None:
    if not site_name or not flags:
        return
    current = getattr(getattr(frappe, "local", None), "site", None)
    if current == site_name:
        try:
            from frappe.installer import update_site_config

            for key, value in flags.items():
                update_site_config(key, value)
                frappe.conf[key] = value
            return
        except Exception:
            frappe.log_error(frappe.get_traceback(), "EE site flag")
    path = _site_config_path(site_name)
    if not path:
        return
    conf = {}
    if os.path.isfile(path):
        with open(path, encoding="utf-8") as handle:
            conf = json.load(handle)
    conf.update(flags)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as handle:
        json.dump(conf, handle, indent=1)
        handle.write("\n")


def _set_site_flag(site_name: str, key: str, value):
    update_site_flags(site_name, {key: value})


def _site_config_path(site_name: str) -> str | None:
    if not site_name:
        return None
    current = getattr(getattr(frappe, "local", None), "site", None)
    if current:
        sites_path = os.path.abspath(os.path.join(frappe.get_site_path(), os.pardir))
    else:
        sites_path = os.path.join(os.environ.get("FRAPPE_BENCH_ROOT", "/home/frappe/frappe-bench"), "sites")
    return os.path.join(sites_path, site_name, "site_config.json")
