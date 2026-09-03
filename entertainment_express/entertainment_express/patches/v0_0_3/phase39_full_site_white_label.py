"""Phase 39 — full-site white-label kit + migrate hide_product_chrome → white_label_mode."""

from __future__ import annotations

import frappe


def execute():
    if not frappe.db.exists("DocType", "EE Portal Settings"):
        return
    if not frappe.db.exists("EE Portal Settings", "EE Portal Settings"):
        frappe.get_doc({"doctype": "EE Portal Settings"}).insert(ignore_permissions=True)

    try:
        mode = frappe.db.get_single_value("EE Portal Settings", "white_label_mode")
    except Exception:
        mode = None

    if mode in ("off", "portals", "full"):
        return

    hide = 0
    try:
        hide = int(frappe.db.get_single_value("EE Portal Settings", "hide_product_chrome") or 0)
    except Exception:
        hide = 0

    # Design: full if hide was on, else portals
    new_mode = "full" if hide else "portals"
    try:
        frappe.db.set_single_value("EE Portal Settings", "white_label_mode", new_mode)
        if new_mode == "full":
            frappe.db.set_single_value("EE Portal Settings", "hide_product_chrome", 1)
    except Exception:
        pass
