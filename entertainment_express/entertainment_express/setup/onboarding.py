"""White-label the desk onboarding.

Automated tenant sites install ERPNext, which ships Module Onboarding records
(e.g. "Let's begin your journey with ERPNext"). Entertainment Express is a
white-label product, so those third-party guides must never surface on a tenant
desk. This runs after every migrate (idempotent).
"""

import frappe

from entertainment_express.setup.fiscal_year import ensure_active_fiscal_year

# Module Onboarding records owned by Entertainment Express (kept visible). Empty
# for now — add EE onboarding names here when a branded guide is introduced.
EE_ONBOARDINGS: frozenset[str] = frozenset()


def hide_third_party_onboarding() -> None:
    """Mark every non-EE Module Onboarding complete so it is not rendered."""
    if not frappe.db.table_exists("Module Onboarding"):
        return

    names = frappe.get_all(
        "Module Onboarding",
        filters={"is_complete": 0},
        pluck="name",
    )
    for name in names:
        if name in EE_ONBOARDINGS:
            continue
        frappe.db.set_value("Module Onboarding", name, "is_complete", 1, update_modified=False)

    company_name = frappe.db.get_single_value("Global Defaults", "default_company")
    ensure_active_fiscal_year(company_name=company_name)

    if frappe.db.table_exists("Website Settings"):
        for field, value in (
            ("app_name", "Entertainment Express"),
            ("footer", ""),
            ("copyright", ""),
            ("footer_template", ""),
        ):
            try:
                if frappe.get_meta("Website Settings").has_field(field):
                    frappe.db.set_single_value("Website Settings", field, value)
            except Exception:
                pass

    frappe.db.commit()
