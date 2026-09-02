"""Apply a processor payment to a Sales Invoice exactly once."""

from __future__ import annotations

import frappe
from frappe.utils import flt


def apply_succeeded(invoice_name: str, booking_name: str = "", processor: str = "stripe", processor_txn_id: str = "") -> dict:
    invoice = frappe.get_doc("Sales Invoice", invoice_name)
    if invoice.status == "Paid" or flt(invoice.outstanding_amount) <= 0:
        return {"status": "already_paid", "invoice": invoice_name}

    company = (
        invoice.company
        or frappe.defaults.get_user_default("Company")
        or frappe.db.get_single_value("Global Defaults", "default_company")
        or frappe.db.get_value("Company", {}, "name")
    )
    company_doc = frappe.get_doc("Company", company)
    paid_from = company_doc.default_receivable_account
    paid_to = company_doc.default_bank_account or company_doc.default_cash_account
    if not paid_from or not paid_to:
        frappe.throw(f"Company {company} is missing default Bank/Cash or Receivable account.")

    amount = flt(invoice.outstanding_amount) or flt(invoice.grand_total)
    pe = frappe.get_doc(
        {
            "doctype": "Payment Entry",
            "payment_type": "Receive",
            "posting_date": frappe.utils.today(),
            "company": company,
            "party_type": "Customer",
            "party": invoice.customer,
            "paid_from": paid_from,
            "paid_to": paid_to,
            "paid_amount": amount,
            "received_amount": amount,
            "source_exchange_rate": 1,
            "target_exchange_rate": 1,
            "references": [
                {
                    "reference_doctype": "Sales Invoice",
                    "reference_name": invoice_name,
                    "allocated_amount": amount,
                }
            ],
            "reference_no": processor_txn_id,
            "reference_date": frappe.utils.today(),
            "remarks": f"{processor} payment {processor_txn_id}",
        }
    )
    if frappe.get_meta("Payment Entry").has_field("ee_processor"):
        pe.ee_processor = processor
    if frappe.get_meta("Payment Entry").has_field("ee_processor_txn_id"):
        pe.ee_processor_txn_id = processor_txn_id
    pe.insert(ignore_permissions=True)
    pe.submit()

    booking = booking_name or invoice.get("ee_booking")
    if booking and frappe.db.exists("Event Booking", booking):
        frappe.db.set_value("Event Booking", booking, {"deposit_status": "paid", "status": "confirmed"})
    frappe.db.commit()
    return {"status": "paid", "payment_entry": pe.name, "invoice": invoice_name}
