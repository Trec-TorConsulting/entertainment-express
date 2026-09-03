"""Normalize production domain defaults to entx.app on migrate."""

import frappe


def execute():
    if frappe.db.exists("DocType", "Marketing Settings"):
        settings = frappe.get_single("Marketing Settings")
        if (settings.base_domain or "").strip() in ("", "entertainmentexpress.app"):
            settings.base_domain = "entx.app"
            settings.save(ignore_permissions=True)

    conf = frappe.conf or {}
    updates = {}
    if (conf.get("ee_base_domain") or "") == "entertainmentexpress.app":
        updates["ee_base_domain"] = "entx.app"
    if not conf.get("ee_tenant_domain"):
        updates["ee_tenant_domain"] = "entx.app"
    if updates:
        from frappe.installer import update_site_config

        update_site_config(**updates)
