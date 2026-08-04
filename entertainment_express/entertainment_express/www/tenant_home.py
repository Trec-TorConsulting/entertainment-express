import frappe


def get_context(context):
    context.no_cache = 1
    # The tenant's own company, created during provisioning bootstrap.
    company = frappe.db.get_single_value("Global Defaults", "default_company") or frappe.db.get_value(
        "Company", {}, "company_name"
    )
    context.company_name = company or "Our Studio"
    context.title = context.company_name
