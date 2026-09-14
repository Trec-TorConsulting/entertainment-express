# Copyright (c) 2026, Trec-Tor Consulting and contributors
"""Logistics whitelisted API endpoints for mobile crew scan-to-truck and owner-portal manifests."""

from __future__ import annotations

import json
import frappe
from frappe.utils import cint, flt
from entertainment_express.logistics.bom_expander import expand_booking_bom
from entertainment_express.logistics.van_transfer import (
    commit_loadout_transfer,
    commit_return_checkin,
    create_loadout_session,
    get_van_manifest,
    scan_item_to_session,
    validate_scanned_barcode,
)
from entertainment_express.logistics.sub_rentals import create_sub_rental_po


def _require_ops_or_crew():
    if not hasattr(frappe, "get_roles"):
        return
    roles = frappe.get_roles()
    allowed = {"EE Tenant Admin", "EE Dispatcher", "EE Crew", "System Manager", "Administrator"}
    if not allowed.intersection(set(roles)):
        frappe.throw("Access denied: Logistics operations require Crew or Dispatcher role.", frappe.PermissionError)


@frappe.whitelist()
def get_booking_pull_sheet(booking_name: str) -> dict:
    """Returns the multi-tier production BOM pull sheet for a booking."""
    _require_ops_or_crew()
    return expand_booking_bom(booking_name)


@frappe.whitelist()
def validate_barcode(barcode: str, booking_name: str = None) -> dict:
    """Validates barcode against inventory and booking requirements."""
    _require_ops_or_crew()
    return validate_scanned_barcode(barcode, booking_name=booking_name)


@frappe.whitelist()
def start_loadout_session(booking_name: str, vehicle_name: str, session_type: str = "loadout") -> dict:
    """Starts a staged scanning session for truck loading or return check-in."""
    _require_ops_or_crew()
    return create_loadout_session(booking_name, vehicle_name, session_type=session_type)


@frappe.whitelist()
def scan_asset(session_id: str, barcode: str) -> dict:
    """Scans and adds an asset to an active loadout or check-in session."""
    _require_ops_or_crew()
    return scan_item_to_session(session_id, barcode)


@frappe.whitelist()
def commit_loadout(session_id: str, allow_incomplete: int = 0) -> dict:
    """Finalizes truck loadout and generates ERPNext Stock Entry."""
    _require_ops_or_crew()
    return commit_loadout_transfer(session_id, allow_incomplete=bool(cint(allow_incomplete)))


@frappe.whitelist()
def commit_checkin(session_id: str) -> dict:
    """Finalizes vehicle return check-in, transfers items back, and flags missing gear."""
    _require_ops_or_crew()
    return commit_return_checkin(session_id)


@frappe.whitelist()
def get_vehicle_manifest(vehicle_name: str) -> dict:
    """Returns rolling manifest and loadout status of a fleet vehicle."""
    _require_ops_or_crew()
    return get_van_manifest(vehicle_name)


@frappe.whitelist()
def create_sub_rental(
    booking_id: str,
    vendor_id: str,
    items: list | str,
    delivery_date: str,
    return_date: str,
    markup_percent: float = 35.0,
    notes: str = "",
) -> dict:
    """Procures sub-rental equipment from vendor with automated Purchase Order."""
    _require_ops_or_crew()
    if isinstance(items, str):
        try:
            items = json.loads(items)
        except Exception:
            items = []
    return create_sub_rental_po(
        booking_id=booking_id,
        vendor_id=vendor_id,
        items=items,
        delivery_date=delivery_date,
        return_date=return_date,
        markup_percent=flt(markup_percent),
        notes=notes,
    )


@frappe.whitelist()
def list_sub_rentals(booking_id: str = None) -> list[dict]:
    """Lists sub-rental orders with status and vendor return deadlines."""
    _require_ops_or_crew()
    filters = {}
    if booking_id:
        filters["booking"] = booking_id

    fields = [
        "name",
        "booking",
        "vendor",
        "delivery_date",
        "return_deadline",
        "total_cost",
        "customer_price",
        "status",
        "purchase_order_ref",
    ]
    if hasattr(frappe, "get_all"):
        try:
            return frappe.get_all("Sub Rental Order", filters=filters, fields=fields, order_by="delivery_date desc")
        except Exception:
            return []
    return []
