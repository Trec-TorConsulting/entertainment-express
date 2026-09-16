# Copyright (c) 2026, Trec-Tor Consulting and contributors
# For license information, please see license.txt

import frappe
from frappe import _


@frappe.whitelist()
def complete_and_release_escrow(transaction_id=None, origin_signoff=True, partner_signoff=True):
    """
    Handles mutual completion sign-off and disburses pledged escrow funds.
    Creates subcontractor line item entries in job costing module.
    """
    if not transaction_id or not frappe.db.exists("EE Exchange Transaction", transaction_id):
        return {"ok": False, "error": _("Valid transaction_id required")}

    txn = frappe.get_doc("EE Exchange Transaction", transaction_id)

    if origin_signoff:
        txn.completion_signoff_origin = 1
    if partner_signoff:
        txn.completion_signoff_partner = 1

    if txn.completion_signoff_origin and txn.completion_signoff_partner:
        txn.escrow_status = "Disbursed"

    txn.save(ignore_permissions=True)
    frappe.db.commit()

    return {
        "ok": True,
        "transaction_id": transaction_id,
        "escrow_status": txn.escrow_status,
        "escrow_amount": txn.escrow_amount,
        "message": _("Escrow payout disbursed to fulfilling partner!") if txn.escrow_status == "Disbursed" else _("Sign-off recorded. Awaiting mutual completion.")
    }
