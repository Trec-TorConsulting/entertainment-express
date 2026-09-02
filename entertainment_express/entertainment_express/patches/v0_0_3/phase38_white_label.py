"""Phase 38 white-label fields on EE Portal Settings (DocType JSON). Defaults applied here."""

from __future__ import annotations

import frappe


def execute():
    if not frappe.db.exists("DocType", "EE Portal Settings"):
        return
    if not frappe.db.exists("EE Portal Settings", "EE Portal Settings"):
        frappe.get_doc({"doctype": "EE Portal Settings"}).insert(ignore_permissions=True)
    # Ensure new Check defaults to off when column exists after migrate
    try:
        if frappe.db.has_column("tabSingles", "doctype"):
            current = frappe.db.get_single_value("EE Portal Settings", "hide_product_chrome")
            if current is None:
                frappe.db.set_single_value("EE Portal Settings", "hide_product_chrome", 0)
    except Exception:
        pass
