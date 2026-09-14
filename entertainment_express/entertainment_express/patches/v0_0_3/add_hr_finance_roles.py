"""
Patch: Add EE HR and EE Finance roles to existing tenant sites.

These roles were referenced throughout the codebase (api/hr_workforce.py,
api/portal_hr.py, security/access.py, security/request_guards.py) but were
missing from the role.json fixture. This patch creates them on sites that
were provisioned before the fixture was corrected, so that HR managers and
finance staff can use the platform without silent permission denials.

Added to patches.txt in [post_model_sync] so it runs after the Role DocType
model is available.
"""

import frappe


def execute():
    for role_name, desk_access in [("EE HR", 1), ("EE Finance", 1)]:
        if frappe.db.exists("Role", role_name):
            continue
        role = frappe.get_doc(
            {
                "doctype": "Role",
                "role_name": role_name,
                "desk_access": desk_access,
                "is_custom": 1,
                "disabled": 0,
            }
        )
        role.insert(ignore_permissions=True)
        frappe.db.commit()
        frappe.logger().info(f"entertainment_express: created role '{role_name}'")
