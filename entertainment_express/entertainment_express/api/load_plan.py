"""Weight-aware vehicle load planning."""

from __future__ import annotations

import frappe
from frappe.utils import cint, flt

from entertainment_express.api.portal_owner import OWNER_ROLES

STAFF = OWNER_ROLES | {"EE Sales", "EE Dispatcher", "EE Accounting", "System Manager", "EE Office"}
GUEST_ROLE = "EE Event Guest"
PAYER_ROLE = "EE Customer"


def _require_staff() -> None:
    roles = set(frappe.get_roles() or [])
    if GUEST_ROLE in roles and PAYER_ROLE not in roles:
        frappe.throw("Not allowed.", frappe.PermissionError)
    if not roles.intersection(STAFF):
        frappe.throw("Not allowed.", frappe.PermissionError)


def _overweight_action() -> str:
    try:
        doc = frappe.get_single("EE Booking Site Config")
        return getattr(doc, "overweight_action", None) or "warn"
    except Exception:
        return "warn"


def check_load(booking_name: str, vehicle: str | None = None) -> dict:
    """
    Sum assigned asset shipping_weight_lb vs vehicle max_payload_lb.
    Default action: warn. Optional block via EE Booking Site Config.
    """
    booking = frappe.get_doc("Event Booking", booking_name)
    lines = []
    total = 0.0
    for row in getattr(booking, "assigned_assets", None) or []:
        weight = flt(frappe.db.get_value("Service Asset", row.asset, "shipping_weight_lb") or 0)
        qty = flt(getattr(row, "quantity_reserved", None) or getattr(row, "qty", None) or 1) or 1
        line_weight = weight * qty
        total += line_weight
        lines.append(
            {
                "asset": row.asset,
                "name": getattr(row, "asset_name", None)
                or frappe.db.get_value("Service Asset", row.asset, "asset_name")
                or row.asset,
                "weight_lb": weight,
                "qty": qty,
                "line_weight_lb": line_weight,
            }
        )

    vehicle_name = vehicle
    if not vehicle_name and frappe.db.table_exists("Vehicle Assignment"):
        vehicle_name = frappe.db.get_value(
            "Vehicle Assignment",
            {"booking": booking_name, "status": ["in", ["assigned", "planned", "active", ""]]},
            "vehicle",
        ) or frappe.db.get_value("Vehicle Assignment", {"booking": booking_name}, "vehicle")

    max_payload = None
    vehicle_label = ""
    if vehicle_name and frappe.db.exists("Vehicle", vehicle_name):
        v = frappe.db.get_value("Vehicle", vehicle_name, ["vehicle_name", "max_payload_lb"], as_dict=True)
        max_payload = flt(v.max_payload_lb) if v else None
        vehicle_label = (v.vehicle_name if v else "") or vehicle_name

    action = _overweight_action()
    overweight = bool(max_payload and total > max_payload)
    if not overweight:
        status = "ok"
    elif action == "block":
        status = "block"
    else:
        status = "warn"

    return {
        "booking": booking_name,
        "vehicle": vehicle_name or "",
        "vehicle_name": vehicle_label,
        "total_weight_lb": total,
        "max_payload_lb": max_payload,
        "overweight": overweight,
        "status": status,
        "action": action,
        "lines": lines,
    }


@frappe.whitelist()
def evaluate(booking: str, vehicle: str | None = None) -> dict:
    _require_staff()
    return check_load(booking, vehicle=vehicle or None)


@frappe.whitelist()
def finalize_allowed(booking: str, vehicle: str | None = None) -> dict:
    """Gate packing/dispatch finalize when overweight under block policy."""
    _require_staff()
    result = check_load(booking, vehicle=vehicle or None)
    if result["status"] == "block":
        return {
            "allowed": False,
            "message": "Load exceeds vehicle payload.",
            "load": result,
        }
    return {"allowed": True, "load": result, "warn": result["status"] == "warn"}
