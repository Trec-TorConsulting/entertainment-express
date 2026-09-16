# Copyright (c) 2026, Trec-Tor Consulting and contributors
# For license information, please see license.txt

import json
import frappe
from frappe import _
from frappe.utils import now_datetime
from entertainment_express.copilot.solar import calculate_solar_times


@frappe.whitelist()
def generate_run_of_show(booking_id=None, questionnaire_data=None, latitude=40.7128, longitude=-74.0060):
    """
    Synthesizes a structured, minute-by-minute event timeline (Run-of-Show)
    incorporating questionnaire answers, astronomical sunset/golden hour constraints,
    and venue noise curfews.
    """
    if isinstance(questionnaire_data, str):
        questionnaire_data = json.loads(questionnaire_data)

    q = questionnaire_data or {}
    start_time = q.get("start_time", "16:00")
    end_time = q.get("end_time", "23:00")
    event_date_str = q.get("event_date", "2026-09-16")
    event_type = q.get("event_type", "Wedding Reception")

    # Compute solar constraints
    solar = calculate_solar_times(latitude, longitude, target_date=event_date_str)
    golden_hour = solar["golden_hour_start"]
    sunset = solar["sunset"]

    # Synthesize standard moment flow anchored by constraints
    moments = []

    # 1. Crew Load-In & Sound Check
    moments.append({
        "activity_name": "Crew Load-In & Audio Sound Check",
        "start_time": "14:30",
        "end_time": "15:45",
        "energy_level": 2,
        "speaker": "Production Crew",
        "description": "Unload gear, set up main PA systems, and perform wireless mic frequency sweep.",
        "category": "Logistics"
    })

    # 2. Guest Arrival & Ceremony/Cocktail
    moments.append({
        "activity_name": "Guest Arrival & Cocktail Hour",
        "start_time": start_time,
        "end_time": "17:00",
        "energy_level": 4,
        "speaker": "Background Music / Host",
        "description": "Smooth upbeat jazz / acoustic playlist. Signature drinks served.",
        "category": "Entertainment"
    })

    # 3. Grand Entrance & First Dance
    moments.append({
        "activity_name": "Grand Entrance & Special Dances",
        "start_time": "17:15",
        "end_time": "17:35",
        "energy_level": 8,
        "speaker": "Lead DJ / Emcee",
        "description": "High-energy entrance track. First dance followed by welcome toast.",
        "category": "Highlight"
    })

    # 4. Dinner Service
    moments.append({
        "activity_name": "Dinner Service & Speeches",
        "start_time": "17:40",
        "end_time": "18:50",
        "energy_level": 3,
        "speaker": "Keynote Speakers / Family",
        "description": "Plated dinner service with low-volume dining soundtrack. Speeches at 18:20.",
        "category": "Dining"
    })

    # 5. Golden Hour Outdoor Photo Shoot (Sun-anchored)
    moments.append({
        "activity_name": "Golden Hour Outdoor Photo Window",
        "start_time": golden_hour,
        "end_time": sunset,
        "energy_level": 5,
        "speaker": "Photographer / Couple",
        "description": f"Sun-anchored golden hour session (Calculated Sunset: {sunset}). Ambient courtyard music.",
        "category": "Photography"
    })

    # 6. Open Dance Floor
    moments.append({
        "activity_name": "Open Dance Floor Peak Sets",
        "start_time": "19:15",
        "end_time": "22:30",
        "energy_level": 10,
        "speaker": "Lead DJ",
        "description": "High-energy dance rotation based on guest requests and crowd energy curve.",
        "category": "Entertainment"
    })

    # 7. Grand Finale & Sound Curfew Tear-Down
    moments.append({
        "activity_name": "Grand Finale Send-Off & Sound Curfew",
        "start_time": "22:30",
        "end_time": end_time,
        "energy_level": 6,
        "speaker": "Lead Emcee",
        "description": "Final track send-off. Decibel reduction to comply with 23:00 local noise curfew.",
        "category": "Wrap-Up"
    })

    # Record copilot action log if booking provided
    if booking_id and frappe.db.exists("Event Booking", booking_id):
        action_doc = frappe.get_doc({
            "doctype": "EE Copilot Action",
            "event_booking": booking_id,
            "action_type": "Timeline Generation",
            "status": "Proposed",
            "confidence_score": 0.98,
            "prompt_context": json.dumps({"q": q, "solar": solar}),
            "output_payload": json.dumps(moments)
        })
        action_doc.insert(ignore_permissions=True)
        frappe.db.commit()

    return {
        "ok": True,
        "booking_id": booking_id,
        "solar": solar,
        "moments_count": len(moments),
        "moments": moments
    }
