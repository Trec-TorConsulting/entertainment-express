"""
HR Workforce Scheduler — flag overdue payouts, check compliance expiry.
"""

import frappe
from frappe.utils import getdate, add_days, now_datetime


def flag_overdue_payouts():
    """
    Daily check: Find Pay Runs with status 'pending_payout' older than SLA (7 days).
    Create a Frappe Todo for finance.
    """
    cutoff_date = add_days(getdate(), -7)
    overdue = frappe.get_all(
        "Pay Run",
        filters={
            "status": "pending_payout",
            "modified": ["<", cutoff_date],
        },
        fields=["name", "period_from", "period_to", "total_amount"],
        limit=50,
    )

    for pr in overdue:
        # Check if Todo already exists (idempotent)
        existing = frappe.db.get_value(
            "ToDo",
            {"reference_type": "Pay Run", "reference_name": pr["name"]},
            "name",
        )
        if not existing:
            frappe.get_doc({
                "doctype": "ToDo",
                "title": f"Payout overdue: {pr['name']} (${pr['total_amount']})",
                "description": f"Period: {pr['period_from']} – {pr['period_to']}",
                "reference_type": "Pay Run",
                "reference_name": pr["name"],
                "assigned_by": "Administrator",
                "assigned_to": "Administrator",  # Finance team lead
                "priority": "High",
            }).insert(ignore_permissions=True)
            frappe.db.commit()


def check_compliance_expiry():
    """
    Daily check: Mark Compliance Documents as 'expired' if expiry_date is today or past.
    """
    today = getdate()
    expired_docs = frappe.get_all(
        "Compliance Document",
        filters={
            "status": "verified",
            "expiry_date": ["<=", today],
        },
        fields=["name"],
        limit=100,
    )

    for doc in expired_docs:
        cd = frappe.get_doc("Compliance Document", doc["name"])
        cd.status = "expired"
        cd.save(ignore_permissions=True)
        frappe.db.commit()
