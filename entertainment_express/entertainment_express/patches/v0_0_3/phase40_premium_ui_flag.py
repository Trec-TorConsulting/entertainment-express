"""Phase 40 portal premium UI flag on EE Portal Settings."""

from __future__ import annotations

import frappe


def execute() -> None:
    if not frappe.db.exists("DocType", "EE Portal Settings"):
        return
    if not frappe.db.exists("EE Portal Settings", "EE Portal Settings"):
        frappe.get_doc({"doctype": "EE Portal Settings"}).insert(ignore_permissions=True)
    try:
        val = frappe.db.get_single_value("EE Portal Settings", "premium_ui_enabled")
        if val is None:
            frappe.db.set_single_value("EE Portal Settings", "premium_ui_enabled", 0)
    except Exception:
        pass
