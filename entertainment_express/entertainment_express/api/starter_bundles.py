"""
Vertical Starter Bundles for Entertainment Express.

Provides industry-tailored Contract Templates and Email/Notification Templates
for DJs, Inflatables, Photo Booths, Game Trucks, Live Performers, and General Event Rentals.
Can be seeded automatically on tenant creation, from the guided startup wizard,
or imported on demand in the owner portal.
"""

from __future__ import annotations

import frappe
from frappe.utils import cint


VERTICAL_BUNDLES = {
    "djs": {
        "label": "DJs, MCs & Mobile Entertainment",
        "contracts": [
            {
                "template_name": "Professional DJ & MC Performance Agreement",
                "active": 1,
                "body": (
                    '<div style="font-family: sans-serif; max-width: 650px; margin: 0 auto; padding: 24px; color: #1e293b;">\n'
                    '  <h2 style="color: #0f766e; border-bottom: 2px solid #0f766e; padding-bottom: 8px;">PROFESSIONAL DJ & MC PERFORMANCE AGREEMENT</h2>\n'
                    '  <p>This binding agreement is made between <strong>{{ company_name }}</strong> ("DJ/Provider") and <strong>{{ customer_name }}</strong> ("Client").</p>\n'
                    '  <h3>1. Event Details & Performance Hours</h3>\n'
                    '  <p><strong>Event Date:</strong> {{ event_date }}<br/>'
                    '<strong>Venue Location:</strong> {{ venue_address }}</p>\n'
                    '  <p>Provider agrees to deliver professional DJ, MC, and sound amplification services for the designated hours. Provider will arrive at least 60 minutes prior to performance time for sound check and load-in.</p>\n'
                    '  <h3>2. Fees & Payment Terms</h3>\n'
                    '  <p><strong>Total Agreed Fee:</strong> {{ grand_total }}<br/>'
                    '<strong>Required Retainer/Deposit:</strong> {{ deposit_amount }}</p>\n'
                    '  <p>The non-refundable retainer reserves your date. The remaining balance is due prior to performance startup on the event date.</p>\n'
                    '  <h3>3. Site & Technical Requirements</h3>\n'
                    '  <p>Client agrees to provide: (a) One dedicated 120V/20A electrical outlet within 25 feet of the DJ booth; (b) Shelter from direct sun and rain if performing outdoors.</p>\n'
                    '  <h3>4. Music Selection & Requests</h3>\n'
                    '  <p>Client may submit special music requests and "Do Not Play" lists up to 14 days prior to event date.</p>\n'
                    '  <br/><p style="font-style: italic;">By signing below, Client accepts all terms of this agreement.</p>\n'
                    '</div>'
                ),
            }
        ],
        "notifications": [
            {
                "key": "dj_booking_confirmation",
                "title": "DJ Booking Confirmation & Music Questionnaire",
                "subject": "Booking Confirmed: DJ & MC Services for {{ doc.customer_name }}",
                "channels": "email",
                "priority": "transactional",
                "body": (
                    '<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">\n'
                    '  <h2 style="color: #0f766e;">Your DJ & MC Booking is Confirmed!</h2>\n'
                    '  <p>Hi {{ doc.customer_name }},</p>\n'
                    '  <p>Thank you for choosing {{ owner.company_name }} for your upcoming event on <strong>{{ doc.event_date }}</strong>!</p>\n'
                    '  <p>We are excited to bring an unforgettable music experience to your celebration. You can submit your special dance songs and favorite playlist requests anytime via your online portal.</p>\n'
                    '  <p>If you have any questions, reply directly to this email.</p>\n'
                    '</div>'
                ),
            }
        ],
    },
    "inflatables": {
        "label": "Inflatables & Party Rentals",
        "contracts": [
            {
                "template_name": "Inflatable Equipment Rental & Safety Waiver Agreement",
                "active": 1,
                "body": (
                    '<div style="font-family: sans-serif; max-width: 650px; margin: 0 auto; padding: 24px; color: #1e293b;">\n'
                    '  <h2 style="color: #0f766e; border-bottom: 2px solid #0f766e; padding-bottom: 8px;">INFLATABLE RENTAL & SAFETY WAIVER AGREEMENT</h2>\n'
                    '  <p>This agreement is entered into by <strong>{{ company_name }}</strong> ("Lessor") and <strong>{{ customer_name }}</strong> ("Lessee").</p>\n'
                    '  <h3>1. Equipment & Event Details</h3>\n'
                    '  <p><strong>Event Date:</strong> {{ event_date }}<br/>'
                    '<strong>Delivery Address:</strong> {{ venue_address }}<br/>'
                    '<strong>Total Rental Fee:</strong> {{ grand_total }} (Deposit: {{ deposit_amount }})</p>\n'
                    '  <h3>2. Safety Rules & Adult Supervision</h3>\n'
                    '  <p>Lessee agrees that a responsible adult must supervise the inflatable unit AT ALL TIMES. No shoes, sharp objects, food, drink, or silly string inside the unit.</p>\n'
                    '  <h3>3. Severe Weather & Wind Shutdown Policy</h3>\n'
                    '  <p>Units MUST be powered off immediately if wind speeds exceed 15 mph or in cases of severe rain/lightning. Lessor reserves the right to cancel delivery for unsafe wind/weather conditions.</p>\n'
                    '  <h3>4. Liability Release</h3>\n'
                    '  <p>Lessee assumes full responsibility for any injury or property damage arising from operation during the rental period and agrees to hold Lessor harmless.</p>\n'
                    '</div>'
                ),
            }
        ],
        "notifications": [
            {
                "key": "inflatable_safety_checklist",
                "title": "Inflatable Delivery & Site Setup Notice",
                "subject": "Important Delivery & Site Prep Info for {{ doc.customer_name }}",
                "channels": "email",
                "priority": "transactional",
                "body": (
                    '<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">\n'
                    '  <h2 style="color: #0f766e;">Preparing for Your Inflatable Delivery!</h2>\n'
                    '  <p>Hello {{ doc.customer_name }},</p>\n'
                    '  <p>Your rental is scheduled for <strong>{{ doc.event_date }}</strong>! Please ensure the setup area is clean, flat, free of animal waste/sticks, and within 50 feet of a standard electrical outlet.</p>\n'
                    '</div>'
                ),
            }
        ],
    },
    "photo_booths": {
        "label": "Photo Booths & 360 Video Spinners",
        "contracts": [
            {
                "template_name": "Photo Booth Rental & Digital Media Release Agreement",
                "active": 1,
                "body": (
                    '<div style="font-family: sans-serif; max-width: 650px; margin: 0 auto; padding: 24px; color: #1e293b;">\n'
                    '  <h2 style="color: #0f766e; border-bottom: 2px solid #0f766e; padding-bottom: 8px;">PHOTO BOOTH RENTAL & MEDIA AGREEMENT</h2>\n'
                    '  <p>Agreement between <strong>{{ company_name }}</strong> and <strong>{{ customer_name }}</strong> for event date <strong>{{ event_date }}</strong>.</p>\n'
                    '  <h3>1. Footprint & Power</h3>\n'
                    '  <p>Client agrees to provide a 10\'x10\' level space and a standard 120V outlet within 20 feet of booth setup.</p>\n'
                    '  <h3>2. Print Customization & Media Release</h3>\n'
                    '  <p>Custom print strip graphics will be submitted for approval 7 days prior. Client grants permission for digital photo gallery hosting.</p>\n'
                    '</div>'
                ),
            }
        ],
        "notifications": [
            {
                "key": "photobooth_gallery_alert",
                "title": "Photo Booth Online Gallery Notification",
                "subject": "Your Photo Booth Digital Gallery is Ready! ({{ doc.customer_name }})",
                "channels": "email",
                "priority": "transactional",
                "body": (
                    '<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">\n'
                    '  <h2 style="color: #0f766e;">Your Event Photo Gallery is Ready!</h2>\n'
                    '  <p>Hi {{ doc.customer_name }},</p>\n'
                    '  <p>Thank you for partying with {{ owner.company_name }}! All photos and videos from your event are now live online.</p>\n'
                    '</div>'
                ),
            }
        ],
    },
    "game_trucks": {
        "label": "Mobile Game Trucks & Laser Tag",
        "contracts": [
            {
                "template_name": "Mobile Game Theater Rental & Liability Agreement",
                "active": 1,
                "body": (
                    '<div style="font-family: sans-serif; max-width: 650px; margin: 0 auto; padding: 24px; color: #1e293b;">\n'
                    '  <h2 style="color: #0f766e; border-bottom: 2px solid #0f766e; padding-bottom: 8px;">MOBILE GAME THEATER RENTAL AGREEMENT</h2>\n'
                    '  <p>Agreement between <strong>{{ company_name }}</strong> and <strong>{{ customer_name }}</strong> for event on <strong>{{ event_date }}</strong>.</p>\n'
                    '  <h3>1. Parking & Access</h3>\n'
                    '  <p>Client guarantees 55 feet of level parking space (street or driveway) with no blocking overhead tree branches or low wires.</p>\n'
                    '  <h3>2. Supervision & Food Policy</h3>\n'
                    '  <p>No food, drinks, or candy inside the mobile game theater. One parent/adult must remain present during party duration.</p>\n'
                    '</div>'
                ),
            }
        ],
        "notifications": [
            {
                "key": "gametruck_parking_alert",
                "title": "Game Truck Parking & Arrival Notice",
                "subject": "Game Truck Arrival Prep for {{ doc.customer_name }}",
                "channels": "email",
                "priority": "transactional",
                "body": (
                    '<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">\n'
                    '  <h2 style="color: #0f766e;">Get Ready to Game!</h2>\n'
                    '  <p>Hi {{ doc.customer_name }},</p>\n'
                    '  <p>Our Mobile Game Theater is heading your way on <strong>{{ doc.event_date }}</strong>! Please reserve 55ft of clear parking space in front of your home.</p>\n'
                    '</div>'
                ),
            }
        ],
    },
    "general": {
        "label": "General Event Entertainment & Production",
        "contracts": [
            {
                "template_name": "General Event Entertainment Services Contract",
                "active": 1,
                "body": (
                    '<div style="font-family: sans-serif; max-width: 650px; margin: 0 auto; padding: 24px; color: #1e293b;">\n'
                    '  <h2 style="color: #0f766e; border-bottom: 2px solid #0f766e; padding-bottom: 8px;">EVENT ENTERTAINMENT SERVICES CONTRACT</h2>\n'
                    '  <p>This contract is between <strong>{{ company_name }}</strong> ("Provider") and <strong>{{ customer_name }}</strong> ("Client").</p>\n'
                    '  <h3>1. Services & Compensation</h3>\n'
                    '  <p>Provider agrees to furnish event production and entertainment services for the event on <strong>{{ event_date }}</strong> at <strong>{{ venue_address }}</strong>.</p>\n'
                    '  <p>Total Contract Amount: <strong>{{ grand_total }}</strong> (Deposit Due: {{ deposit_amount }}).</p>\n'
                    '  <h3>2. Cancellation & Force Majeure</h3>\n'
                    '  <p>Neither party shall be liable for failure to perform due to severe acts of nature or unsafe conditions beyond reasonable control.</p>\n'
                    '</div>'
                ),
            }
        ],
        "notifications": [
            {
                "key": "general_booking_confirmation",
                "title": "General Event Entertainment Receipt",
                "subject": "Event Booking Confirmed — {{ doc.customer_name }}",
                "channels": "email",
                "priority": "transactional",
                "body": (
                    '<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">\n'
                    '  <h2 style="color: #0f766e;">Booking Confirmation</h2>\n'
                    '  <p>Hello {{ doc.customer_name }},</p>\n'
                    '  <p>Your event booking for {{ doc.event_date }} is confirmed! We look forward to serving you.</p>\n'
                    '</div>'
                ),
            }
        ],
    },
}


def _check_owner() -> None:
    if frappe.session.user == "Guest":
        frappe.throw("Authentication required.", frappe.PermissionError)
    roles = set(frappe.get_roles(frappe.session.user) or [])
    if not roles.intersection({"EE Tenant Admin", "EE Sales", "EE Manager", "System Manager"}):
        frappe.throw("Insufficient permissions to seed vertical bundles.", frappe.PermissionError)


@frappe.whitelist()
def list_available_bundles() -> list[dict]:
    """Return list of available industry vertical bundles with counts."""
    out = []
    for code, bundle in VERTICAL_BUNDLES.items():
        out.append({
            "code": code,
            "label": bundle["label"],
            "contract_count": len(bundle["contracts"]),
            "notification_count": len(bundle["notifications"])
        })
    return out


@frappe.whitelist()
def seed_vertical_bundle(vertical: str = "general") -> dict:
    """
    Import vertical-specific starter contracts & notification templates into tenant workspace.
    Safe & idempotent: updates existing docs or inserts new ones without duplicating.
    """
    _check_owner()
    code = (vertical or "general").strip().lower()
    bundle = VERTICAL_BUNDLES.get(code) or VERTICAL_BUNDLES["general"]

    contracts_added = 0
    notifications_added = 0

    # 1. Seed Contract Templates
    for c_def in bundle["contracts"]:
        tmpl_name = c_def["template_name"]
        if frappe.db.exists("EE Contract Template", {"template_name": tmpl_name}):
            # Update existing
            doc_name = frappe.db.get_value("EE Contract Template", {"template_name": tmpl_name}, "name")
            doc = frappe.get_doc("EE Contract Template", doc_name)
            doc.body = c_def["body"]
            doc.active = c_def["active"]
            doc.save(ignore_permissions=True)
        else:
            doc = frappe.get_doc({
                "doctype": "EE Contract Template",
                "naming_series": "EE-CT-.####",
                "template_name": tmpl_name,
                "active": c_def["active"],
                "body": c_def["body"],
            })
            doc.insert(ignore_permissions=True)
            contracts_added += 1

    # 2. Seed Notification Templates
    for n_def in bundle["notifications"]:
        key = n_def["key"]
        if frappe.db.exists("Notification Template", {"template_key": key}):
            doc_name = frappe.db.get_value("Notification Template", {"template_key": key}, "name")
            doc = frappe.get_doc("Notification Template", doc_name)
            doc.subject = n_def["subject"]
            doc.body_html = n_def["body"]
            doc.channels = n_def["channels"]
            doc.priority = n_def["priority"]
            doc.active = 1
            doc.save(ignore_permissions=True)
        else:
            doc = frappe.get_doc({
                "doctype": "Notification Template",
                "name": key,
                "template_key": key,
                "subject": n_def["subject"],
                "body_html": n_def["body"],
                "channels": n_def["channels"],
                "fallback_channel": "email",
                "priority": n_def["priority"],
                "active": 1,
            })
            doc.insert(ignore_permissions=True)
            notifications_added += 1

    frappe.db.commit()

    return {
        "ok": True,
        "vertical": code,
        "label": bundle["label"],
        "contracts_imported": len(bundle["contracts"]),
        "notifications_imported": len(bundle["notifications"]),
    }
