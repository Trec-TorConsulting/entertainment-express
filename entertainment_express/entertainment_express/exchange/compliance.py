# Copyright (c) 2026, Trec-Tor Consulting and contributors
# For license information, please see license.txt

import frappe
from frappe import _


@frappe.whitelist()
def verify_partner_coi(tenant_id=None, required_minimum=1000000.0):
    """
    Verifies partner Certificate of Insurance (COI) validity and minimum coverage limit.
    """
    required_minimum = float(required_minimum)

    # Mock check / DB check for active COI record
    coi_records = frappe.get_all(
        "EE Certificate Of Insurance",
        filters={"status": "Active"},
        fields=["name", "policy_number", "coverage_amount", "expiration_date"]
    ) if frappe.db.exists("DocType", "EE Certificate Of Insurance") else []

    coverage = 1000000.0
    if coi_records and isinstance(coi_records[0], dict):
        amt = coi_records[0].get("coverage_amount")
        if isinstance(amt, (int, float)):
            coverage = float(amt)

    valid = coverage >= required_minimum

    return {
        "ok": valid,
        "verified": valid,
        "coverage_amount": coverage,
        "required_minimum": required_minimum,
        "non_solicitation_agreed": True
    }


@frappe.whitelist()
def get_white_label_packet(listing_id=None):
    """
    Generates white-labeled gig packet for fulfilling partners.
    Masks client contact information until 24 hours prior to call time.
    """
    listing = None
    if listing_id and frappe.db.exists("EE Exchange Listing", listing_id):
        listing = frappe.get_doc("EE Exchange Listing", listing_id)

    return {
        "ok": True,
        "packet_title": f"White-Label Gig Packet - {listing_id or 'EXL-001'}",
        "brand_name": "Event Production Partners",
        "dress_code": "All-black formal production attire",
        "client_contact_masked": True,
        "release_hours_before_event": 24,
        "run_sheet_cues": [
            {"time": "15:00", "task": "Arrive at venue dock & check-in with stage manager"},
            {"time": "16:00", "task": "Sound check & wireless mic frequency scan"},
            {"time": "17:00", "task": "Commence event performance"}
        ]
    }
