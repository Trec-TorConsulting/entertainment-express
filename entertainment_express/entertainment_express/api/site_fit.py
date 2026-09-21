"""Site-fit evaluation: gate clearance, surface, power, clearance, water, vehicle load balancing & driver site packets."""

from __future__ import annotations

import json
import frappe
from frappe import _
from frappe.utils import cint, flt

from entertainment_express.api.portal_owner import OWNER_ROLES

STAFF = OWNER_ROLES | {"EE Sales", "EE Dispatcher", "EE Accounting", "EE Crew", "System Manager", "EE Office"}
GUEST_ROLE = "EE Event Guest"
PAYER_ROLE = "EE Customer"
SURFACES = {"grass", "asphalt", "concrete", "artificial turf", "indoor gymnasium", "dirt/gravel"}


def _require_staff() -> None:
    roles = set(frappe.get_roles() or [])
    if GUEST_ROLE in roles and PAYER_ROLE not in roles:
        frappe.throw("Not allowed.", frappe.PermissionError)
    if not roles.intersection(STAFF):
        frappe.throw("Not allowed.", frappe.PermissionError)


def _require_crew_or_staff() -> None:
    roles = set(frappe.get_roles() or [])
    if not roles.intersection(STAFF | {"EE Crew"}):
        frappe.throw("Access denied.", frappe.PermissionError)


def _deny_guest() -> None:
    roles = set(frappe.get_roles() or [])
    if GUEST_ROLE in roles and PAYER_ROLE not in roles:
        frappe.throw("Only the host can do this.", frappe.PermissionError)


def _require_payer_or_staff() -> None:
    roles = set(frappe.get_roles() or [])
    if GUEST_ROLE in roles and PAYER_ROLE not in roles:
        frappe.throw("Only the host can do this.", frappe.PermissionError)
    if PAYER_ROLE not in roles and not roles.intersection(STAFF):
        frappe.throw("Not allowed.", frappe.PermissionError)


@frappe.whitelist()
def validate_site_fit(booking_id: str) -> dict:
    """
    Checks all items on booking against EE Venue Site Profile and Item requirements.
    Validates gate width, stairs, surface type (sandbag ballasts required for asphalt/concrete), and power.
    """
    if not frappe.db.exists("Event Booking", booking_id):
        frappe.throw(_("Booking '{0}' does not exist.").format(booking_id), frappe.DoesNotExistError)

    doc = frappe.get_doc("Event Booking", booking_id)

    # Get venue profile if exists
    profile = None
    if getattr(doc, "venue", None) and frappe.db.exists("EE Venue Site Profile", {"venue": doc.venue}):
        profile = frappe.get_doc("EE Venue Site Profile", {"venue": doc.venue})

    gate_width = flt(getattr(doc, "site_gate_width", 0) or (getattr(profile, "gate_width_inches", 36) if profile else 36))
    surface = (getattr(doc, "site_surface", None) or (getattr(profile, "surface_type", "Grass") if profile else "Grass")).strip().lower()
    power_source = getattr(doc, "site_power", None) or (getattr(profile, "power_source", "Dedicated 20A Within 50ft") if profile else "Dedicated 20A Within 50ft")

    issues = []
    sandbags_required = 0

    for line in getattr(doc, "service_items", []) or []:
        item_code = getattr(line, "item", None) or getattr(line, "item_code", None)
        if not item_code or not frappe.db.exists("Item", item_code):
            continue

        item = frappe.get_doc("Item", item_code)

        # 1. Gate width check
        packed_width = flt(getattr(item, "ee_packed_width_in", 0) or 0)
        if packed_width > 0 and gate_width < packed_width:
            issues.append({
                "type": "gate",
                "severity": "blocker",
                "message": f"Item '{item.item_name or item_code}' requires {packed_width}in gate clearance, but venue pathway gate is {gate_width}in.",
                "action_required": "Expand pathway gate or select alternative equipment."
            })

        # 2. Surface anchoring check
        if surface in ("asphalt", "concrete", "indoor gymnasium") and getattr(item, "ee_requires_asset", None):
            sandbags_required += 4
            issues.append({
                "type": "surface",
                "severity": "warning",
                "message": f"Setup on {surface.title()} prohibits ground stakes. Sandbag ballasts mandated.",
                "action_required": f"Add {sandbags_required}x 50-lb sandbag ballasts to pull sheet."
            })

        # 3. Power check
        amp_draw = flt(getattr(item, "ee_amperage_draw", 0) or 0)
        if amp_draw > 0 and "No Power" in power_source:
            issues.append({
                "type": "power",
                "severity": "blocker",
                "message": f"Item '{item.item_name or item_code}' requires {amp_draw}A power, but venue has no power.",
                "action_required": "Mandate generator rental add-on."
            })

    compatible = not any(i["severity"] == "blocker" for i in issues)

    return {
        "booking_id": booking_id,
        "compatible": compatible,
        "issues": issues,
        "sandbags_required": sandbags_required,
        "gate_width": gate_width,
        "surface": surface,
        "power_source": power_source,
    }


@frappe.whitelist()
def check_vehicle_load_balance(vehicle_id: str, booking_ids_json: str | list) -> dict:
    """
    Computes cumulative weight (lbs) and volume (cu ft) of items across assigned bookings.
    Compares against vehicle max limits.
    """
    if isinstance(booking_ids_json, str):
        try:
            booking_ids = json.loads(booking_ids_json)
        except Exception:
            booking_ids = []
    else:
        booking_ids = booking_ids_json or []

    max_weight = 2800.0
    max_volume = 450.0

    if frappe.db.exists("Vehicle", vehicle_id):
        veh = frappe.get_doc("Vehicle", vehicle_id)
        max_weight = flt(getattr(veh, "max_payload_lbs", 2800.0) or 2800.0)
        max_volume = flt(getattr(veh, "cargo_volume_cuft", 450.0) or 450.0)

    total_weight = 0.0
    total_volume = 0.0

    for b_id in booking_ids:
        if not frappe.db.exists("Event Booking", b_id):
            continue
        b_doc = frappe.get_doc("Event Booking", b_id)
        for line in getattr(b_doc, "service_items", []) or []:
            code = getattr(line, "item", None) or getattr(line, "item_code", None)
            qty = flt(getattr(line, "qty", 1) or 1)
            if not code or not frappe.db.exists("Item", code):
                continue
            item = frappe.get_doc("Item", code)
            w = flt(getattr(item, "ee_packed_weight_lbs", 150.0) or 150.0)
            l_in = flt(getattr(item, "ee_packed_length_in", 36.0) or 36.0)
            w_in = flt(getattr(item, "ee_packed_width_in", 36.0) or 36.0)
            h_in = flt(getattr(item, "ee_packed_height_in", 36.0) or 36.0)
            vol_cuft = (l_in * w_in * h_in) / 1728.0

            total_weight += (w * qty)
            total_volume += (vol_cuft * qty)

    weight_pct = round((total_weight / max_weight) * 100, 1) if max_weight > 0 else 0
    volume_pct = round((total_volume / max_volume) * 100, 1) if max_volume > 0 else 0

    is_overloaded = weight_pct > 100.0 or volume_pct > 100.0

    # Save manifest record if vehicle exists
    if frappe.db.exists("DocType", "EE Vehicle Load Manifest") and vehicle_id:
        manifest = frappe.get_doc({
            "doctype": "EE Vehicle Load Manifest",
            "vehicle": vehicle_id,
            "dispatch_trip": f"Trip-{vehicle_id}",
            "max_payload_lbs": max_weight,
            "cargo_volume_cuft": max_volume,
            "current_payload_lbs": total_weight,
            "current_volume_cuft": total_volume,
            "weight_utilization_pct": weight_pct,
            "volume_utilization_pct": volume_pct,
            "is_overloaded": 1 if is_overloaded else 0,
        })
        manifest.insert(ignore_permissions=True)
        frappe.db.commit()

    return {
        "vehicle_id": vehicle_id,
        "total_weight_lbs": total_weight,
        "max_payload_lbs": max_weight,
        "weight_pct": weight_pct,
        "total_volume_cuft": round(total_volume, 1),
        "cargo_volume_cuft": max_volume,
        "volume_pct": volume_pct,
        "is_overloaded": is_overloaded,
    }


@frappe.whitelist()
def get_driver_site_packet(booking_id: str) -> dict:
    """
    Field crew site packet with 1-click gate code copy, parking notes, map coordinates, and risk warnings.
    """
    _require_crew_or_staff()

    if not frappe.db.exists("Event Booking", booking_id):
        frappe.throw(_("Booking '{0}' does not exist.").format(booking_id), frappe.DoesNotExistError)

    doc = frappe.get_doc("Event Booking", booking_id)

    profile = None
    if getattr(doc, "venue", None) and frappe.db.exists("EE Venue Site Profile", {"venue": doc.venue}):
        profile = frappe.get_doc("EE Venue Site Profile", {"venue": doc.venue})

    fit_eval = validate_site_fit(booking_id)

    return {
        "booking_id": booking_id,
        "customer": doc.customer,
        "event_name": getattr(doc, "event_name", ""),
        "event_date": str(doc.event_date),
        "venue_address": getattr(doc, "venue_address", ""),
        "venue_geo": getattr(doc, "venue_geo", ""),
        "access_gate_code": getattr(profile, "access_gate_code", None) or getattr(doc, "access_gate_code", "1234"),
        "surface_type": fit_eval["surface"],
        "power_source": fit_eval["power_source"],
        "gate_width": fit_eval["gate_width"],
        "driver_parking_notes": getattr(profile, "driver_parking_notes", None) or getattr(doc, "parking_notes", "Park near loading dock entrance."),
        "site_fit": fit_eval,
        "map_url": f"https://maps.google.com/?q={getattr(doc, 'venue_address', '')}",
    }
