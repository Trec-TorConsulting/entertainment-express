"""
Post-install setup for entertainment_express.
Called by hooks.py after_install.
"""
import frappe


def after_install():
    """Create custom fields on ERPNext DocTypes."""
    create_all()
    from entertainment_express.setup.seed_marketing_settings import run as seed_marketing_settings
    from entertainment_express.setup.seed_marketing_pages import run as seed_marketing_pages

    seed_marketing_settings()
    seed_marketing_pages()


def create_all():
    """Create or update all EE custom fields on ERPNext DocTypes."""
    from entertainment_express.setup.custom_fields import CUSTOM_FIELDS

    for doctype, fields in CUSTOM_FIELDS.items():
        if not frappe.db.exists("DocType", doctype):
            continue
        for field_def in fields:
            fieldname = field_def["fieldname"]
            if frappe.db.exists("Custom Field", f"{doctype}-{fieldname}"):
                cf = frappe.get_doc("Custom Field", f"{doctype}-{fieldname}")
                for k, v in field_def.items():
                    if k not in ("dt", "fieldname"):
                        setattr(cf, k, v)
                cf.save()
            else:
                cf = frappe.get_doc({"doctype": "Custom Field", **field_def})
                cf.insert(ignore_permissions=True)

    frappe.db.commit()
