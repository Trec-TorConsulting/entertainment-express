# Copyright (c) 2026, Trec-Tor Consulting and contributors
# For license information, please see license.txt

import frappe
from frappe.utils import flt
from entertainment_express.job_costing.cost_engine import recompute_event_cost_sheet
from entertainment_express.notifications import send


def send_margin_drift_alert(
    booking_name: str,
    cost_sheet_name: str,
    drift_percent: float,
    variance_details: str = None,
) -> None:
    """
    Dispatches multi-channel margin drift notification to tenant owners/admins.
    """
    recipients = []
    if hasattr(frappe, "db") and frappe.db.table_exists("User"):
        try:
            admins = frappe.db.get_all(
                "Has Role",
                filters={"role": ["in", ["EE Tenant Admin", "System Manager"]]},
                pluck="parent",
            )
            recipients = list(set([a for a in admins if "@" in str(a)]))
        except Exception:
            recipients = []

    if not recipients:
        recipients = ["admin@entx.app"]

    for r in recipients:
        try:
            send(
                template_key="margin_drift_alert",
                recipient=r,
                context={
                    "booking_name": booking_name,
                    "cost_sheet_name": cost_sheet_name,
                    "drift_percent": drift_percent,
                    "variance_details": variance_details or "Direct cost overrun detected.",
                },
                channels=["email", "sms"],
                related_doctype="Event Cost Sheet",
                related_name=cost_sheet_name,
            )
        except Exception as e:
            if hasattr(frappe, "log_error"):
                frappe.log_error(f"Failed to dispatch margin drift alert: {e}", "Margin Drift Alert")


def evaluate_booking_margin_drift(booking_name: str) -> dict:
    """
    Evaluates margin drift for an Event Booking.
    Calculates margin_drift_percent = projected_margin_percent - margin_percent.
    If drift exceeds threshold (default 5.0%), updates margin_status to 'warning'
    and triggers multi-channel alert to tenant owners.
    """
    if not booking_name or not frappe.db.exists("Event Booking", booking_name):
        return {}

    recomputed = recompute_event_cost_sheet(booking_name)
    sheet_name = frappe.db.get_value("Event Cost Sheet", {"event_booking": booking_name}, "name")
    if not sheet_name:
        return {}

    cost_sheet = frappe.get_doc("Event Cost Sheet", sheet_name)

    proj_margin = flt(getattr(cost_sheet, "projected_margin_percent", 0.0))
    actual_margin = flt(cost_sheet.margin_percent)
    drift = flt(proj_margin - actual_margin, 2)

    cost_sheet.margin_drift_percent = max(0.0, drift) if proj_margin > 0 else 0.0

    # Get drift threshold from settings
    drift_threshold = 5.0
    if frappe.db.table_exists("EE Portal Settings"):
        val = frappe.db.get_single_value("EE Portal Settings", "margin_drift_warning_threshold")
        if val is not None and val != "":
            drift_threshold = flt(val)

    drift_breached = cost_sheet.margin_drift_percent > drift_threshold

    if drift_breached and cost_sheet.margin_status == "healthy":
        cost_sheet.margin_status = "warning"

    cost_sheet.save(ignore_permissions=True)

    alert_sent = False
    if drift_breached:
        # Construct detailed variance message
        labor_var = flt(cost_sheet.labor_cost) - flt(getattr(cost_sheet, "projected_labor_cost", 0.0))
        sub_var = flt(cost_sheet.subcontractor_cost) - flt(getattr(cost_sheet, "projected_subcontractor_cost", 0.0))
        details = []
        if labor_var > 0:
            details.append(f"Labor Overrun: +${labor_var:.2f}")
        if sub_var > 0:
            details.append(f"Subcontractor Overrun: +${sub_var:.2f}")
        variance_msg = ", ".join(details) if details else f"Margin drifted by {cost_sheet.margin_drift_percent:.2f}% (Threshold: {drift_threshold:.2f}%)"

        send_margin_drift_alert(
            booking_name=booking_name,
            cost_sheet_name=cost_sheet.name,
            drift_percent=cost_sheet.margin_drift_percent,
            variance_details=variance_msg,
        )
        alert_sent = True

    return {
        "booking_name": booking_name,
        "cost_sheet": cost_sheet.name,
        "projected_margin_percent": proj_margin,
        "actual_margin_percent": actual_margin,
        "margin_drift_percent": cost_sheet.margin_drift_percent,
        "drift_warning_threshold": drift_threshold,
        "drift_breached": drift_breached,
        "margin_status": cost_sheet.margin_status,
        "alert_sent": alert_sent,
    }


def on_expense_doc_event(doc, method=None):
    """
    Doc event listener on expense documents (Timesheet, Purchase Invoice, Stock Entry).
    Triggers margin drift evaluation for the linked booking.
    """
    booking_name = getattr(doc, "ee_booking", None)
    if not booking_name and getattr(doc, "booking", None) and frappe.db.exists("Event Booking", doc.booking):
        booking_name = doc.booking

    if not booking_name and getattr(doc, "project", None):
        booking_name = frappe.db.get_value("Event Booking", {"project": doc.project}, "name")

    if not booking_name and getattr(doc, "cost_center", None):
        booking_name = frappe.db.get_value("Event Booking", {"cost_center": doc.cost_center}, "name")

    if not booking_name and doc.doctype == "Timesheet" and getattr(doc, "time_logs", None):
        for log in doc.time_logs:
            if getattr(log, "ee_booking", None):
                booking_name = log.ee_booking
                break

    if booking_name:
        evaluate_booking_margin_drift(booking_name)
