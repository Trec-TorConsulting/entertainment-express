# Copyright (c) 2026, Trec-Tor Consulting and contributors
# For license information, please see license.txt

import frappe
from entertainment_express.job_costing.cost_engine import recompute_event_cost_sheet
from entertainment_express.job_costing.settlement import validate_expense_against_locked_ledger
from entertainment_express.job_costing.drift_monitor import evaluate_booking_margin_drift


def on_financial_doc_change(doc, method=None):
    """
    Background or synchronous hook listening to financial document submissions:
    Timesheet, Purchase Invoice, Purchase Order, Stock Entry, Payment Entry, Sales Invoice.
    1. Validates cost center lock state (raises error if ledger locked)
    2. Recomputes Event Cost Sheet
    3. Evaluates margin drift & fires alerts if threshold breached
    """
    # 1. Enforce ledger lock validation first
    validate_expense_against_locked_ledger(doc, method)

    booking_name = None

    # Direct booking reference
    if getattr(doc, "ee_booking", None):
        booking_name = doc.ee_booking
    elif getattr(doc, "booking", None) and frappe.db.exists("Event Booking", doc.booking):
        booking_name = doc.booking

    # Reference via Project
    if not booking_name and getattr(doc, "project", None):
        booking_name = frappe.db.get_value("Event Booking", {"project": doc.project}, "name")

    # Reference via Cost Center
    if not booking_name and getattr(doc, "cost_center", None):
        booking_name = frappe.db.get_value("Event Booking", {"cost_center": doc.cost_center}, "name")

    # For Timesheet, inspect children lines
    if not booking_name and doc.doctype == "Timesheet" and getattr(doc, "time_logs", None):
        for log in doc.time_logs:
            if getattr(log, "ee_booking", None):
                booking_name = log.ee_booking
                break
            if getattr(log, "project", None):
                booking_name = frappe.db.get_value("Event Booking", {"project": log.project}, "name")
                if booking_name:
                    break

    # For Stock Entry, inspect items
    if not booking_name and doc.doctype == "Stock Entry" and getattr(doc, "items", None):
        for item in doc.items:
            if getattr(item, "cost_center", None):
                booking_name = frappe.db.get_value("Event Booking", {"cost_center": item.cost_center}, "name")
                if booking_name:
                    break

    if booking_name:
        try:
            recompute_event_cost_sheet(booking_name)
            evaluate_booking_margin_drift(booking_name)
        except Exception as e:
            frappe.log_error(f"Failed to sync cost sheet on {doc.doctype} {getattr(doc, 'name', '')}: {e}", "Job Costing Sync")

