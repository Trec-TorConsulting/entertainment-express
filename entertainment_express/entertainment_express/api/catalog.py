"""
Service Catalog API — CRUD for Service Items, Packages, Assets, Areas.
Also exposes public catalog listing for the booking site.
"""

import frappe
from frappe.utils import flt


@frappe.whitelist()
def list_service_items(event_type: str = "", self_bookable_only: bool = False) -> list:
    """List active Service Items, optionally filtered by event type."""
    filters = {"disabled": 0}
    items = frappe.get_all(
        "Item",
        filters=filters,
        fields=["name", "item_name", "ee_item_type", "ee_vertical_tag",
                "ee_unit", "standard_rate", "ee_event_types", "ee_self_bookable",
                "ee_duration_minutes", "description"],
        ignore_permissions=False,
    )
    if event_type:
        items = [
            i for i in items
            if not i.get("ee_event_types") or event_type in (i["ee_event_types"] or "")
        ]
    if self_bookable_only:
        items = [i for i in items if i.get("ee_self_bookable")]
    return items


@frappe.whitelist()
def list_packages(event_type: str = "") -> list:
    """List active Service Packages, optionally filtered by event type."""
    pkgs = frappe.get_all(
        "Service Package",
        filters={"active": 1},
        fields=["name", "package_name", "package_price", "vertical_tag",
                "event_types", "description"],
        ignore_permissions=False,
    )
    if event_type:
        pkgs = [
            p for p in pkgs
            if not p.get("event_types") or event_type in (p["event_types"] or "")
        ]
    return pkgs


@frappe.whitelist()
def check_availability(asset_name: str, event_start: str, event_end: str) -> dict:
    """Public availability check for a single asset."""
    from entertainment_express.booking.availability import check
    start = frappe.utils.get_datetime(event_start)
    end = frappe.utils.get_datetime(event_end)
    return check(asset_name, start, end)


@frappe.whitelist()
def resolve_service_area(venue_zip: str = "", venue_geo: str = "") -> dict:
    """
    Find the best matching Service Area for a venue.
    Returns the area and computed travel fee, or flagging if out-of-area.
    """
    areas = frappe.get_all(
        "Service Area",
        filters={"active": 1},
        fields=["name", "area_name", "match_type", "zips", "travel_fee",
                "center_geo", "radius_km", "out_of_area_policy"],
    )
    for area in areas:
        if area["match_type"] == "zip_list" and venue_zip:
            zips = [z.strip() for z in (area["zips"] or "").split(",") if z.strip()]
            if venue_zip in zips:
                return {
                    "area": area["name"],
                    "travel_fee": flt(area["travel_fee"]),
                    "in_area": True,
                }
        elif area["match_type"] == "radius" and venue_geo and area["center_geo"] and area["radius_km"]:
            if _within_radius(venue_geo, area["center_geo"], float(area["radius_km"] or 0)):
                return {
                    "area": area["name"],
                    "travel_fee": flt(area["travel_fee"]),
                    "in_area": True,
                }

    # Out of area
    policy = areas[0]["out_of_area_policy"] if areas else "flag_for_review"
    return {"area": None, "travel_fee": 0, "in_area": False, "policy": policy}


def _within_radius(venue_geo: str, center_geo: str, radius_km: float) -> bool:
    """Simple Haversine distance check."""
    import math
    try:
        vlat, vlon = map(float, venue_geo.split(","))
        clat, clon = map(float, center_geo.split(","))
    except (ValueError, AttributeError):
        return False

    R = 6371.0
    dlat = math.radians(vlat - clat)
    dlon = math.radians(vlon - clon)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(clat)) * math.cos(math.radians(vlat)) * math.sin(dlon / 2) ** 2
    distance_km = R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return distance_km <= radius_km
