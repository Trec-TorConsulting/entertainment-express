# Copyright (c) 2026, Trec-Tor Consulting and contributors
"""ERPNext Salary Component baseline seed for gig event operations."""

from __future__ import annotations

import frappe

DEFAULT_SALARY_COMPONENTS = [
    {
        "name": "Gig Base Pay",
        "salary_component": "Gig Base Pay",
        "salary_component_abbr": "GBP",
        "type": "Earning",
        "description": "Base flat fee or regular hourly pay for event shifts",
    },
    {
        "name": "Gig Overtime",
        "salary_component": "Gig Overtime",
        "salary_component_abbr": "GOT",
        "type": "Earning",
        "description": "Overtime compensation for event hours exceeding standard shift duration",
    },
    {
        "name": "Booking Commission",
        "salary_component": "Booking Commission",
        "salary_component_abbr": "COMM",
        "type": "Earning",
        "description": "Sales agent commission earned on customer paid event invoices",
    },
    {
        "name": "Client Tip Share",
        "salary_component": "Client Tip Share",
        "salary_component_abbr": "TIP",
        "type": "Earning",
        "description": "Digital customer gratuities allocated to on-site event crew",
    },
]


def seed_salary_components():
    """Seeds default gig salary components into ERPNext Salary Component DocType if present."""
    if not hasattr(frappe, "db") or not hasattr(frappe.db, "exists"):
        return

    if not frappe.db.exists("DocType", "Salary Component"):
        return

    for comp in DEFAULT_SALARY_COMPONENTS:
        if not frappe.db.exists("Salary Component", comp["name"]):
            try:
                doc = frappe.get_doc(
                    {
                        "doctype": "Salary Component",
                        **comp,
                    }
                )
                doc.insert(ignore_permissions=True)
            except Exception:
                pass

    if hasattr(frappe.db, "commit"):
        frappe.db.commit()
