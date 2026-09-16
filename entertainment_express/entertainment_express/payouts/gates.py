# Copyright (c) 2026, Trec-Tor Consulting and contributors
# For license information, please see license.txt

import frappe
from frappe import _


@frappe.whitelist()
def validate_teardown_payout_gate(booking_id, worker=None):
    """
    Enforces post-event teardown checkout gate before releasing instant payouts.
    Verifies return barcode checklist completion and checks for open gear damage incidents.
    """
    if not booking_id or not frappe.db.exists("Event Booking", booking_id):
        return {"approved": False, "reason": _("Invalid booking reference")}

    # Check for open damage incidents / field issues
    if frappe.db.exists("DocType", "EE Field Issue"):
        open_issues = frappe.get_all(
            "EE Field Issue",
            filters={"booking": booking_id, "status": ["in", ["Open", "Under Review"]]},
            fields=["name", "issue_type", "severity"]
        )
        if open_issues:
            return {
                "approved": False,
                "reason": _("Payout blocked: Open gear damage incident under review ({0})").format(open_issues[0]["name"]),
                "open_issues": open_issues
            }

    # Check return packing list checklist
    if frappe.db.exists("DocType", "EE Booking Item"):
        unreturned = frappe.get_all(
            "EE Booking Item",
            filters={"parent": booking_id, "status": ["in", ["Pending Return", "Missing"]]},
            fields=["name", "item_name"]
        )
        if unreturned:
            return {
                "approved": False,
                "reason": _("Payout blocked: Teardown checklist incomplete ({0} unreturned items)").format(len(unreturned)),
                "unreturned_count": len(unreturned)
            }

    return {
        "approved": True,
        "reason": _("Teardown checklist verified clear. Instant payout unlocked!")
    }
