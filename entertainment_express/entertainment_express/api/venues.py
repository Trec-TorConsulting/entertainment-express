"""Reusable venues. Snapshots copy onto Event Booking. No maps OAuth."""

from __future__ import annotations

import frappe
from frappe.utils import cint

from entertainment_express.api.portal_owner import OWNER_ROLES

STAFF = OWNER_ROLES | {"EE Sales", "EE Dispatcher", "System Manager"}
GUEST_ROLE = "EE Event Guest"
PAYER_ROLE = "EE Customer"


def _require_staff() -> None:
    roles = set(frappe.get_roles() or [])
    if GUEST_ROLE in roles and PAYER_ROLE not in roles:
        frappe.throw("Not allowed.", frappe.PermissionError)
    if not roles.intersection(STAFF):
        frappe.throw("Not allowed.", frappe.PermissionError)


def _contacts(doc) -> list[dict]:
    rows = []
    for row in doc.get("contacts") or []:
        rows.append(
            {
                "name": row.contact_name,
                "role": row.role or "",
                "phone": row.phone or "",
                "email": row.email or "",
            }
        )
    return rows


def _serialize(doc) -> dict:
    return {
        "id": doc.name,
        "name": doc.venue_name,
        "type": doc.venue_type or "",
        "preferred": bool(cint(doc.preferred)),
        "coi_required": bool(cint(doc.coi_required)),
        "address": doc.address or "",
        "geo": doc.geo or "",
        "capacity": cint(doc.capacity),
        "maps_link": doc.maps_link or "",
        "load_in": doc.load_in_notes or "",
        "parking": doc.parking_notes or "",
        "power": doc.power_notes or "",
        "curfew": doc.noise_curfew or "",
        "setup": doc.setup_restrictions or "",
        "wifi": doc.wifi or "",
        "notes": doc.notes or "",
        "contacts": _contacts(doc),
    }


@frappe.whitelist()
def list_venues() -> list[dict]:
    _require_staff()
    if not frappe.db.table_exists("EE Venue"):
        return []
    rows = []
    for row in frappe.get_all("EE Venue", fields=["name"], order_by="venue_name asc", limit_page_length=200):
        rows.append(_serialize(frappe.get_doc("EE Venue", row.name)))
    return rows


@frappe.whitelist()
def save_venue(values: dict | str | None = None, name: str | None = None) -> dict:
    _require_staff()
    if isinstance(values, str):
        values = frappe.parse_json(values) or {}
    values = values or {}
    payload = {
        "venue_name": (values.get("name") or values.get("venue_name") or "").strip(),
        "venue_type": values.get("type") or "",
        "preferred": 1 if cint(values.get("preferred")) else 0,
        "coi_required": 1 if cint(values.get("coi_required")) else 0,
        "address": values.get("address") or "",
        "geo": values.get("geo") or "",
        "capacity": cint(values.get("capacity")),
        "maps_link": values.get("maps_link") or "",
        "load_in_notes": values.get("load_in") or "",
        "parking_notes": values.get("parking") or "",
        "power_notes": values.get("power") or "",
        "noise_curfew": values.get("curfew") or "",
        "setup_restrictions": values.get("setup") or "",
        "wifi": values.get("wifi") or "",
        "notes": values.get("notes") or "",
    }
    if not payload["venue_name"]:
        frappe.throw("Name is required.")
    if name:
        doc = frappe.get_doc("EE Venue", name)
        doc.update(payload)
    else:
        doc = frappe.get_doc({"doctype": "EE Venue", **payload})
    doc.set("contacts", [])
    for row in values.get("contacts") or []:
        if not row.get("name"):
            continue
        doc.append(
            "contacts",
            {
                "contact_name": row.get("name"),
                "role": row.get("role") or "",
                "phone": row.get("phone") or "",
                "email": row.get("email") or "",
            },
        )
    if name:
        doc.save()
    else:
        doc.insert()
    return _serialize(doc)


def apply_venue_to_booking(booking, venue_name: str) -> None:
    if not venue_name or not frappe.db.exists("EE Venue", venue_name):
        return
    venue = frappe.get_doc("EE Venue", venue_name)
    booking.venue = venue.name
    booking.venue_address = venue.address or booking.venue_address
    booking.venue_geo = venue.geo or booking.venue_geo
    if booking.meta.has_field("load_in_notes"):
        booking.load_in_notes = venue.load_in_notes
        booking.parking_notes = venue.parking_notes
        booking.power_notes = venue.power_notes
        booking.noise_curfew = venue.noise_curfew


@frappe.whitelist()
def attach_to_booking(booking: str, venue: str) -> dict:
    _require_staff()
    doc = frappe.get_doc("Event Booking", booking)
    apply_venue_to_booking(doc, venue)
    doc.save()
    return {"ok": True, "address": doc.venue_address or ""}


@frappe.whitelist()
def venue_jobs(name: str) -> list[dict]:
    _require_staff()
    if not frappe.db.table_exists("Event Booking"):
        return []
    rows = []
    for row in frappe.get_all(
        "Event Booking",
        filters={"venue": name},
        fields=["name", "event_name", "event_date", "status"],
        order_by="event_date desc",
        limit_page_length=40,
    ):
        rows.append(
            {
                "id": row.name,
                "title": row.event_name or row.name,
                "date": str(row.event_date or ""),
                "status": row.status,
            }
        )
    return rows
