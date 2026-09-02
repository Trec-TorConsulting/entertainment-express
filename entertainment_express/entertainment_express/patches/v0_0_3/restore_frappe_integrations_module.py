"""Give Frappe back Module Def Integrations if EE stole the name.

A modules.txt line of ``Integrations`` collides with frappe.integrations and
rewrites tabModule Def to app_name=entertainment_express. Pre-model-sync so
Google Settings loads from frappe again before DocType sync.
"""


def execute():
    import frappe

    if not frappe.db.table_exists("Module Def"):
        return
    if not frappe.db.exists("Module Def", "Integrations"):
        return
    app = frappe.db.get_value("Module Def", "Integrations", "app_name")
    if app == "entertainment_express":
        frappe.db.set_value(
            "Module Def",
            "Integrations",
            "app_name",
            "frappe",
            update_modified=False,
        )
