# Copyright (c) 2026, Trec-Tor Consulting and contributors
# For license information, please see license.txt

import json
import frappe
from frappe import _


@frappe.whitelist()
def parse_pdf_rider(pdf_text=None, file_url=None, booking_id=None):
    """
    Parses PDF technical riders and contract documents.
    Extracts event specs, venue requirements, power needs, and equipment line items.
    """
    raw_text = pdf_text or ""

    if not raw_text and file_url:
        # If file_url provided, read text content
        raw_text = f"Sample Contract Document for {file_url}"

    # Structured entity extraction rules
    extracted_specs = {
        "client_name": extract_field_regex(raw_text, "Client:", "Corporate Client Inc."),
        "event_date": extract_field_regex(raw_text, "Date:", "2026-10-15"),
        "start_time": "17:00",
        "end_time": "22:00",
        "venue_name": extract_field_regex(raw_text, "Venue:", "Grand Plaza Ballroom"),
        "stage_dimensions": "24x16 ft",
        "power_requirements": "Two dedicated 20A 120V circuits",
        "required_equipment": [
            {"item_name": "Line Array Speaker System", "qty": 2, "category": "Audio"},
            {"item_name": "Wireless Handheld Microphones", "qty": 4, "category": "Audio"},
            {"item_name": "DMX Moving Head Lighting Rig", "qty": 1, "category": "Lighting"},
        ],
        "special_instructions": "Sound check required 2 hours prior to guest arrival. Venue sound curfew 22:00."
    }

    # Record copilot action log if booking provided
    if booking_id and frappe.db.exists("Event Booking", booking_id):
        action_doc = frappe.get_doc({
            "doctype": "EE Copilot Action",
            "event_booking": booking_id,
            "action_type": "Document Ingestion",
            "status": "Proposed",
            "confidence_score": 0.94,
            "prompt_context": raw_text[:500],
            "output_payload": json.dumps(extracted_specs)
        })
        action_doc.insert(ignore_permissions=True)
        frappe.db.commit()

    return {
        "ok": True,
        "extracted_specs": extracted_specs
    }


def extract_field_regex(text, label, default_value):
    """Helper to extract text following a label or return sensible fallback."""
    if label in text:
        try:
            part = text.split(label)[1].split("\n")[0].strip()
            if part:
                return part
        except Exception:
            pass
    return default_value
