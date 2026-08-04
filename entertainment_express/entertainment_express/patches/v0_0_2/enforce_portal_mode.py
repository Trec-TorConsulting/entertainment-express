import frappe


def execute():
    if not frappe.db.exists("DocType", "EE Portal Settings"):
        return

    if not frappe.db.exists("EE Portal Settings", "EE Portal Settings"):
        doc = frappe.new_doc("EE Portal Settings")
        doc.insert(ignore_permissions=True)

    frappe.db.set_single_value("EE Portal Settings", "portal_mode", "enforce")
