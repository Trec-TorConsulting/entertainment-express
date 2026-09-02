"""Gear fleet for /owner and /employee. Gear/truck language, never DocType names."""

from __future__ import annotations

import frappe
from frappe.utils import add_days, cint, flt, getdate

from entertainment_express.api import fleet_ops
from entertainment_express.api.portal_employee import EMPLOYEE_ROLES
from entertainment_express.api.portal_owner import OWNER_ROLES

MANAGE_ROLES = OWNER_ROLES | {"EE Dispatcher", "System Manager"}
FIELD_ROLES = MANAGE_ROLES | {"EE Crew", "EE Entertainer"} | EMPLOYEE_ROLES


def _roles() -> set[str]:
    return set(frappe.get_roles(frappe.session.user) or [])


def _require_field() -> set[str]:
    roles = _roles()
    if not roles.intersection(FIELD_ROLES):
        frappe.throw("Gear access denied.", frappe.PermissionError)
    return roles


def _require_manage() -> None:
    if not _roles().intersection(MANAGE_ROLES):
        frappe.throw("Fleet access denied.", frappe.PermissionError)


def _values(values) -> dict:
    values = values or frappe.form_dict.get("values") or {}
    if isinstance(values, str):
        values = frappe.parse_json(values) if hasattr(frappe, "parse_json") else {}
    return values or {}


def _expiry_alert(row: dict) -> str:
    today = getdate()
    soon = add_days(today, 30)
    notes = []
    for field, label in (("registration_expiry", "registration"), ("insurance_expiry", "insurance")):
        val = row.get(field)
        if not val:
            continue
        due = getdate(val)
        if due and due <= soon:
            notes.append(f"{label} {due}")
    return "; ".join(notes)


@frappe.whitelist()
def packing_status(booking_name: str) -> dict:
    _require_field()
    return fleet_ops.packing_status(booking_name)


@frappe.whitelist()
def generate_packing_list(booking_name: str) -> dict:
    _require_field()
    return fleet_ops.generate_packing_list(booking_name)


@frappe.whitelist()
def mark_packed(booking_name: str, idx: int = None, code: str = None, packed: int = 1) -> dict:
    _require_field()
    return fleet_ops.mark_packed(booking_name, idx=idx, code=code, packed=packed)


@frappe.whitelist()
def resolve_code(code: str) -> dict:
    _require_field()
    return fleet_ops.resolve_code(code)


@frappe.whitelist()
def checkout(booking_name: str, code: str = None, asset: str = None, vehicle: str = None, condition: str = None) -> dict:
    _require_field()
    return fleet_ops.checkout(booking_name, code=code, asset=asset, vehicle=vehicle, condition=condition)


@frappe.whitelist()
def checkin(
    booking_name: str,
    code: str = None,
    asset: str = None,
    vehicle: str = None,
    condition: str = None,
    damage_notes: str = "",
) -> dict:
    _require_field()
    return fleet_ops.checkin(
        booking_name, code=code, asset=asset, vehicle=vehicle, condition=condition, damage_notes=damage_notes
    )


@frappe.whitelist()
def report_damage(
    booking_name: str,
    description: str,
    asset: str = None,
    vehicle: str = None,
    severity: str = "minor",
    condition: str = "damaged",
    photos: str = None,
) -> dict:
    _require_field()
    return fleet_ops.report_damage(
        booking_name,
        description,
        asset=asset,
        vehicle=vehicle,
        severity=severity,
        condition=condition,
        photos=photos,
    )


@frappe.whitelist()
def utilization(asset_name: str, days: int = 90) -> dict:
    _require_manage()
    return fleet_ops.utilization(asset_name, days=days)


@frappe.whitelist()
def list_vehicles() -> list[dict]:
    _require_manage()
    rows = frappe.get_all(
        "Vehicle",
        fields=[
            "name",
            "vehicle_name",
            "plate",
            "vehicle_type",
            "status",
            "barcode",
            "odometer",
            "fuel_level",
            "registration_expiry",
            "insurance_expiry",
        ],
        order_by="vehicle_name asc",
        limit_page_length=200,
    )
    out = []
    for row in rows:
        item = dict(row)
        item["alert"] = _expiry_alert(item)
        out.append(item)
    return out


@frappe.whitelist()
def save_vehicle(name: str = None, values: dict | None = None) -> dict:
    _require_manage()
    values = _values(values)
    allowed = {
        "vehicle_name": values.get("vehicle_name"),
        "plate": values.get("plate"),
        "vin": values.get("vin"),
        "vehicle_type": values.get("vehicle_type") or "van",
        "status": values.get("status") or "active",
        "capacity": values.get("capacity"),
        "max_payload_lb": values.get("max_payload_lb"),
        "odometer": values.get("odometer"),
        "fuel_level": values.get("fuel_level"),
        "home_location": values.get("home_location"),
        "registration_expiry": values.get("registration_expiry"),
        "insurance_expiry": values.get("insurance_expiry"),
    }
    if not (allowed["vehicle_name"] or "").strip() and not name:
        frappe.throw("Name the truck.")
    if name:
        doc = frappe.get_doc("Vehicle", name)
        for field, value in allowed.items():
            if value is None:
                continue
            doc.set(field, value)
        if not getattr(doc, "barcode", None):
            fleet_ops._ensure_barcode("Vehicle", doc.name)
        doc.save(ignore_permissions=True)
    else:
        payload = {"doctype": "Vehicle", **{k: v for k, v in allowed.items() if v is not None}}
        doc = frappe.get_doc(payload)
        doc.insert(ignore_permissions=True)
        fleet_ops._ensure_barcode("Vehicle", doc.name)
    frappe.db.commit()
    return {"name": doc.name}


@frappe.whitelist()
def assign_vehicle(booking_name: str, vehicle_name: str) -> dict:
    _require_manage()
    return fleet_ops.assign_vehicle(booking_name, vehicle_name)


@frappe.whitelist()
def list_stock() -> list[dict]:
    _require_manage()
    return frappe.get_all(
        "Stock Balance",
        fields=["name", "location", "item_code", "item_name", "qty", "reorder_level"],
        order_by="location, item_code",
        limit_page_length=400,
    )


@frappe.whitelist()
def list_locations() -> list[dict]:
    _require_manage()
    return frappe.get_all(
        "EE Location",
        fields=["name", "location_name", "location_type"],
        order_by="location_name asc",
        limit_page_length=100,
    )


@frappe.whitelist()
def transfer_stock(from_location: str, to_location: str, item_code: str, qty: float) -> dict:
    _require_manage()
    return fleet_ops.transfer_stock(from_location, to_location, item_code, qty)


@frappe.whitelist()
def consume_for_booking(booking_name: str, location: str, item_code: str, qty: float) -> dict:
    _require_manage()
    return fleet_ops.consume_for_booking(booking_name, location, item_code, qty)


@frappe.whitelist()
def create_sub_rental(booking_name: str, item_name: str, qty: int, supplier: str, cost: float = 0) -> dict:
    _require_manage()
    return fleet_ops.create_sub_rental(booking_name, item_name, qty, supplier, cost)


@frappe.whitelist()
def list_jobs() -> list[dict]:
    _require_manage()
    return frappe.get_all(
        "Event Booking",
        filters={"status": ["in", ["confirmed", "in_progress", "tentative", "quoted"]]},
        fields=["name", "event_name", "event_date", "status"],
        order_by="event_date desc",
        limit_page_length=80,
    )


@frappe.whitelist()
def list_maintenance() -> list[dict]:
    _require_manage()
    return frappe.get_all(
        "Maintenance Record",
        filters={"status": ["in", ["open", "scheduled", "in_progress"]]},
        fields=["name", "resource_type", "asset", "vehicle", "mtype", "due_on", "status", "blocks_booking"],
        order_by="due_on asc",
        limit_page_length=80,
    )


@frappe.whitelist()
def save_maintenance(values: dict | None = None) -> dict:
    _require_manage()
    values = _values(values)
    resource = values.get("resource_type") or ("vehicle" if values.get("vehicle") else "asset")
    doc = frappe.get_doc(
        {
            "doctype": "Maintenance Record",
            "resource_type": resource,
            "asset": values.get("asset"),
            "vehicle": values.get("vehicle"),
            "mtype": values.get("mtype") or "scheduled",
            "due_on": values.get("due_on"),
            "window_start": values.get("window_start"),
            "window_end": values.get("window_end"),
            "status": values.get("status") or "scheduled",
            "blocks_booking": cint(values.get("blocks_booking") if values.get("blocks_booking") is not None else 1),
            "notes": values.get("notes") or "",
        }
    )
    doc.insert(ignore_permissions=True)
    frappe.db.commit()
    return {"name": doc.name}
