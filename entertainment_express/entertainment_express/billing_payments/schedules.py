"""Deposit + balance payment schedules."""

from __future__ import annotations

import frappe
from frappe.utils import flt, add_days, getdate


def ensure_schedule(booking_name: str, balance_days_before: int = 7) -> str:
    if frappe.db.exists("Payment Schedule", booking_name):
        return booking_name
    booking = frappe.get_doc("Event Booking", booking_name)
    deposit = flt(booking.deposit_amount)
    balance = flt(booking.balance_due)
    event_date = getdate(booking.event_date)
    due_balance = add_days(event_date, -int(balance_days_before))
    doc = frappe.get_doc(
        {
            "doctype": "Payment Schedule",
            "booking": booking_name,
            "policy_name": f"deposit_{int(booking.deposit_percent or 25)}_balance_{balance_days_before}d",
            "status": "active",
        }
    )
    if deposit:
        invoice = frappe.db.get_value(
            "Sales Invoice",
            {"ee_booking": booking_name, "ee_is_deposit": 1},
            "name",
        )
        doc.append(
            "milestones",
            {
                "kind": "deposit",
                "due_date": getdate(),
                "amount": deposit,
                "invoice": invoice,
                "status": "invoiced" if invoice else "scheduled",
            },
        )
    if balance:
        doc.append(
            "milestones",
            {
                "kind": "balance",
                "due_date": due_balance,
                "amount": balance,
                "status": "scheduled",
            },
        )
    doc.insert(ignore_permissions=True)
    frappe.db.commit()
    return doc.name
