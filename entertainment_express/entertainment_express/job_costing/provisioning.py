# Copyright (c) 2026, Trec-Tor Consulting and contributors
# For license information, please see license.txt

import frappe
from frappe.utils import flt


def get_default_company():
    """Retrieve default tenant company."""
    return (
        frappe.defaults.get_user_default("Company")
        or frappe.db.get_single_value("Global Defaults", "default_company")
        or frappe.db.get_value("Company", {}, "name")
    )


def ensure_event_cost_center_and_project(booking):
    """
    Ensure an isolated ERPNext Cost Center and Project exist for a confirmed/active Event Booking.
    Links the Cost Center, Project, and Event Cost Sheet back to the booking record.
    """
    if isinstance(booking, str):
        booking = frappe.get_doc("Event Booking", booking)

    status = (getattr(booking, "status", None) or "").lower()
    # Provision when confirmed, tentative, in_progress, or completed (or if explicitly triggered)
    if status in ("canceled", "inquiry") and not getattr(booking, "force_provision", False):
        return None

    company = get_default_company()
    updated = False

    # 1. Cost Center Provisioning
    if not getattr(booking, "cost_center", None) or not frappe.db.exists("Cost Center", booking.cost_center):
        existing_cc = None
        if frappe.db.table_exists("Cost Center"):
            existing_cc = frappe.db.get_value("Cost Center", {"cost_center_name": booking.name, "company": company}, "name")

        if existing_cc:
            booking.cost_center = existing_cc
            updated = True
        elif frappe.db.table_exists("Cost Center"):
            # Find parent cost center for company
            parent_cc = frappe.db.get_value(
                "Cost Center",
                {"company": company, "is_group": 1},
                "name",
                order_by="creation asc",
            )
            try:
                cc_doc = frappe.get_doc({
                    "doctype": "Cost Center",
                    "cost_center_name": booking.name,
                    "company": company,
                    "is_group": 0,
                    "parent_cost_center": parent_cc,
                })
                cc_doc.insert(ignore_permissions=True)
                booking.cost_center = cc_doc.name
                updated = True
            except Exception as e:
                frappe.log_error(f"Failed to auto-create Cost Center for {booking.name}: {e}", "Job Costing Provisioning")

    # 2. Project Provisioning
    if not getattr(booking, "project", None) or not frappe.db.exists("Project", booking.project):
        existing_prj = None
        if frappe.db.table_exists("Project"):
            existing_prj = frappe.db.get_value(
                "Project",
                {"project_name": f"{booking.name} - {booking.event_name or 'Event'}", "company": company},
                "name",
            )

        if existing_prj:
            booking.project = existing_prj
            updated = True
        elif frappe.db.table_exists("Project"):
            try:
                prj_doc = frappe.get_doc({
                    "doctype": "Project",
                    "project_name": f"{booking.name} - {booking.event_name or 'Event'}",
                    "customer": getattr(booking, "customer", None),
                    "company": company,
                    "cost_center": getattr(booking, "cost_center", None),
                    "status": "Open",
                })
                prj_doc.insert(ignore_permissions=True)
                booking.project = prj_doc.name
                updated = True
            except Exception as e:
                frappe.log_error(f"Failed to auto-create Project for {booking.name}: {e}", "Job Costing Provisioning")

    # 3. Event Cost Sheet Provisioning
    if not getattr(booking, "cost_sheet", None) or not frappe.db.exists("Event Cost Sheet", booking.cost_sheet):
        existing_sheet = None
        if frappe.db.table_exists("Event Cost Sheet"):
            existing_sheet = frappe.db.get_value("Event Cost Sheet", {"event_booking": booking.name}, "name")

        target_margin = flt(getattr(booking, "target_margin_percent", None))
        if not target_margin:
            target_margin = 40.0
            if frappe.db.table_exists("EE Portal Settings"):
                target_margin = flt(frappe.db.get_single_value("EE Portal Settings", "default_target_margin_percent") or 40.0)

        if existing_sheet:
            booking.cost_sheet = existing_sheet
            updated = True
            # Update links on existing sheet if changed
            sheet_doc = frappe.get_doc("Event Cost Sheet", existing_sheet)
            sheet_updated = False
            if sheet_doc.cost_center != getattr(booking, "cost_center", None):
                sheet_doc.cost_center = getattr(booking, "cost_center", None)
                sheet_updated = True
            if sheet_doc.project != getattr(booking, "project", None):
                sheet_doc.project = getattr(booking, "project", None)
                sheet_updated = True
            if sheet_updated:
                sheet_doc.save(ignore_permissions=True)
        elif frappe.db.table_exists("Event Cost Sheet"):
            try:
                sheet_doc = frappe.get_doc({
                    "doctype": "Event Cost Sheet",
                    "event_booking": booking.name,
                    "cost_center": getattr(booking, "cost_center", None),
                    "project": getattr(booking, "project", None),
                    "gross_revenue": flt(getattr(booking, "grand_total", 0.0)),
                    "target_margin_percent": target_margin,
                    "currency": getattr(booking, "currency", None) or "USD",
                })
                sheet_doc.insert(ignore_permissions=True)
                booking.cost_sheet = sheet_doc.name
                updated = True
            except Exception as e:
                frappe.log_error(f"Failed to auto-create Event Cost Sheet for {booking.name}: {e}", "Job Costing Provisioning")

    # If booking is already persisted in DB, save references
    if updated and not booking.is_new() and frappe.db.exists("Event Booking", booking.name):
        frappe.db.set_value(
            "Event Booking",
            booking.name,
            {
                "cost_center": getattr(booking, "cost_center", None),
                "project": getattr(booking, "project", None),
                "cost_sheet": getattr(booking, "cost_sheet", None),
            },
            update_modified=False,
        )

    return {
        "cost_center": getattr(booking, "cost_center", None),
        "project": getattr(booking, "project", None),
        "cost_sheet": getattr(booking, "cost_sheet", None),
    }
