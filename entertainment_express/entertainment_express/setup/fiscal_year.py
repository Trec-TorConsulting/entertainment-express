"""Fiscal year safety helpers for tenant bootstrap and migrations."""

from __future__ import annotations

from datetime import date

import frappe
from frappe.utils import getdate, nowdate


def ensure_active_fiscal_year(company_name: str | None = None, reference_date: date | None = None) -> str:
    """Ensure a non-disabled Fiscal Year exists for the reference date.

    Returns the Fiscal Year name that covers ``reference_date``.
    """
    ref_date = getdate(reference_date or nowdate())

    active_fy = frappe.db.get_value(
        "Fiscal Year",
        {
            "year_start_date": ("<=", ref_date),
            "year_end_date": (">=", ref_date),
            "disabled": 0,
        },
        "name",
    )
    if active_fy:
        _set_global_default_fiscal_year(active_fy)
        return active_fy

    disabled_match = frappe.db.get_value(
        "Fiscal Year",
        {
            "year_start_date": ("<=", ref_date),
            "year_end_date": (">=", ref_date),
            "disabled": 1,
        },
        "name",
    )
    if disabled_match:
        frappe.db.set_value("Fiscal Year", disabled_match, "disabled", 0, update_modified=False)
        _set_global_default_fiscal_year(disabled_match)
        return disabled_match

    year = ref_date.year
    year_start = date(year, 1, 1)
    year_end = date(year, 12, 31)

    fiscal_year_label = f"FY {year}"
    suffix = 1
    while frappe.db.exists("Fiscal Year", fiscal_year_label):
        suffix += 1
        fiscal_year_label = f"FY {year} ({suffix})"

    fy_doc = frappe.get_doc(
        {
            "doctype": "Fiscal Year",
            "year": fiscal_year_label,
            "year_start_date": year_start,
            "year_end_date": year_end,
            "disabled": 0,
            "is_short_year": 0,
        }
    )

    if company_name and fy_doc.meta.has_field("company"):
        fy_doc.company = company_name

    fy_doc.insert(ignore_permissions=True)
    _set_global_default_fiscal_year(fy_doc.name)
    return fy_doc.name


def _set_global_default_fiscal_year(fiscal_year_name: str) -> None:
    """Set Global Defaults fiscal year, handling ERPNext field-name variations."""
    for fieldname in ("current_fiscal_year", "default_fiscal_year"):
        try:
            frappe.db.set_single_value("Global Defaults", fieldname, fiscal_year_name)
            return
        except Exception:
            continue
