"""Equipment, fleet, packing lists, stock, and scan check-out/in."""

from __future__ import annotations

import secrets
from datetime import datetime, timedelta

import frappe
from frappe.utils import flt, now_datetime, getdate, add_days, get_datetime, cint

from entertainment_express.security.access import require_roles


OPS = ["EE Tenant Admin", "EE Dispatcher", "EE Crew", "System Manager"]


def _ops():
    require_roles(*OPS)


def is_warehouse_line(item_code: str) -> bool:
    """Stock/rental/warehouse picks only — pure service catalog rows stay off the pull sheet."""
    if not item_code:
        return False
    is_stock = cint(frappe.db.get_value("Item", item_code, "is_stock_item"))
    ee_type = ""
    if frappe.get_meta("Item").has_field("ee_item_type"):
        ee_type = frappe.db.get_value("Item", item_code, "ee_item_type") or ""
    if ee_type == "service":
        return False
    return bool(is_stock) or ee_type == "rental"


def _ensure_barcode(doctype: str, name: str) -> str:
    current = frappe.db.get_value(doctype, name, "barcode")
    if current:
        return current
    code = secrets.token_hex(6).upper()
    frappe.db.set_value(doctype, name, "barcode", code)
    return code


@frappe.whitelist()
def utilization(asset_name: str, days: int = 90) -> dict:
    _ops()
    asset = frappe.get_doc("Service Asset", asset_name)
    since = add_days(getdate(), -cint(days))
    rows = frappe.db.sql(
        """
        SELECT COUNT(*) AS events,
               COALESCE(SUM(TIMESTAMPDIFF(HOUR, TIMESTAMP(eb.event_date, eb.start_time),
                                          TIMESTAMP(eb.event_date, eb.end_time))), 0) AS hours
        FROM `tabEvent Booking` eb
        JOIN `tabEvent Booking Asset` eba ON eba.parent = eb.name
        WHERE eba.asset = %s AND eb.event_date >= %s
          AND eb.status IN ('confirmed','in_progress','completed')
        """,
        (asset_name, since),
        as_dict=True,
    )[0]
    available_hours = max(cint(days) * 8, 1)
    hours = flt(rows.hours)
    return {
        "asset": asset_name,
        "condition": getattr(asset, "condition", None),
        "status": asset.status,
        "location": getattr(asset, "current_location", None) or asset.home_location,
        "events": int(rows.events or 0),
        "hours_booked": hours,
        "utilization_pct": round(100.0 * hours / available_hours, 1),
        "period_days": cint(days),
    }


@frappe.whitelist()
def resolve_code(code: str) -> dict:
    _ops()
    code = (code or "").strip()
    if not code:
        frappe.throw("Scan a barcode or QR code.")
    asset = frappe.db.get_value("Service Asset", {"barcode": code}, ["name", "asset_name", "status", "condition"], as_dict=True)
    if asset:
        return {"resource_type": "asset", "name": asset.name, **asset}
    veh = frappe.db.get_value("Vehicle", {"barcode": code}, ["name", "vehicle_name", "status"], as_dict=True)
    if veh:
        return {"resource_type": "vehicle", "name": veh.name, **veh}
    frappe.throw("That code is not on file. Print a new label from the asset or vehicle.")


@frappe.whitelist()
def checkout(booking_name: str, code: str = None, asset: str = None, vehicle: str = None, condition: str = None) -> dict:
    _ops()
    return _log_movement(booking_name, "out", code, asset, vehicle, condition)


@frappe.whitelist()
def checkin(booking_name: str, code: str = None, asset: str = None, vehicle: str = None, condition: str = None, damage_notes: str = "") -> dict:
    _ops()
    result = _log_movement(booking_name, "in", code, asset, vehicle, condition)
    if damage_notes or (condition or "").lower() == "damaged":
        report_damage(
            booking_name=booking_name,
            description=damage_notes or "Damage noted at check-in",
            asset=result.get("asset"),
            vehicle=result.get("vehicle"),
            severity="moderate",
            condition="damaged",
        )
        result["damage_report"] = True
    return result


def _log_movement(booking_name, direction, code, asset, vehicle, condition):
    resolved = None
    if code:
        resolved = resolve_code(code)
        if resolved["resource_type"] == "asset":
            asset = resolved["name"]
        else:
            vehicle = resolved["name"]
    if not asset and not vehicle:
        frappe.throw("Identify the asset or vehicle.")
    resource_type = "vehicle" if vehicle and not asset else "asset"
    if direction == "out" and asset:
        open_out = frappe.db.exists(
            "Asset Check Log",
            {"asset": asset, "direction": "out", "name": ["not in", []]},
        )
        # last log for this asset
        last = frappe.get_all(
            "Asset Check Log",
            filters={"asset": asset},
            fields=["direction"],
            order_by="creation desc",
            limit=1,
        )
        if last and last[0].direction == "out":
            frappe.throw("This asset is already checked out. Check it in first.")
    log = frappe.get_doc(
        {
            "doctype": "Asset Check Log",
            "resource_type": resource_type,
            "asset": asset,
            "vehicle": vehicle,
            "booking": booking_name,
            "direction": direction,
            "at": now_datetime(),
            "condition_before": frappe.db.get_value("Service Asset", asset, "condition") if asset else None,
            "condition_after": condition,
            "scanned_code": code,
        }
    )
    log.insert(ignore_permissions=True)
    if asset and condition:
        frappe.db.set_value("Service Asset", asset, "condition", condition)
    frappe.db.commit()
    return {"log": log.name, "asset": asset, "vehicle": vehicle, "direction": direction}


@frappe.whitelist()
def report_damage(booking_name: str, description: str, asset: str = None, vehicle: str = None, severity: str = "minor", condition: str = "damaged", photos: str = None) -> dict:
    _ops()
    doc = frappe.get_doc(
        {
            "doctype": "Damage Report",
            "resource_type": "vehicle" if vehicle and not asset else "asset",
            "asset": asset,
            "vehicle": vehicle,
            "booking": booking_name,
            "description": description,
            "photos": photos,
            "severity": severity,
            "status": "open",
        }
    )
    doc.insert(ignore_permissions=True)
    if asset:
        frappe.db.set_value("Service Asset", asset, {"condition": condition, "status": "maintenance"})
    if vehicle:
        frappe.db.set_value("Vehicle", vehicle, "status", "in_service")
    frappe.db.commit()
    return {"damage_report": doc.name}


@frappe.whitelist()
def generate_packing_list(booking_name: str) -> dict:
    _ops()
    booking = frappe.get_doc("Event Booking", booking_name)
    name = frappe.db.get_value("Packing List", {"booking": booking_name}, "name")
    doc = frappe.get_doc("Packing List", name) if name else frappe.get_doc({"doctype": "Packing List", "booking": booking_name})
    if not name:
        doc.insert(ignore_permissions=True)
    doc.set("items", [])
    for row in booking.assigned_assets or []:
        asset = frappe.get_doc("Service Asset", row.asset)
        if not getattr(asset, "barcode", None):
            _ensure_barcode("Service Asset", asset.name)
            asset.reload()
        doc.append(
            "items",
            {
                "kind": "asset",
                "asset": asset.name,
                "item_name": asset.asset_name,
                "qty": cint(row.quantity_reserved or 1),
            },
        )
    for row in booking.service_items or []:
        if not is_warehouse_line(row.item):
            continue
        doc.append(
            "items",
            {
                "kind": "consumable",
                "item_code": row.item,
                "item_name": getattr(row, "item_name", None) or row.item,
                "qty": cint(row.qty or 1),
            },
        )
    for sub in frappe.get_all("Sub Rental", filters={"booking": booking_name}, fields=["name", "item_name", "qty"]):
        doc.append("items", {"kind": "subrental", "item_name": sub.item_name, "qty": sub.qty})
    doc.status = "ready"
    doc.save()
    frappe.db.commit()
    return packing_status(booking_name)


@frappe.whitelist()
def mark_packed(booking_name: str, idx: int = None, code: str = None, packed: int = 1) -> dict:
    _ops()
    doc = frappe.get_doc("Packing List", booking_name)
    target = None
    if code:
        resolved = resolve_code(code)
        for i, item in enumerate(doc.items):
            if item.asset == resolved["name"]:
                target = item
                item.scanned = 1
                break
        if not target:
            frappe.throw("That scanned item is not on this packing list.")
    elif idx is not None and 0 <= cint(idx) < len(doc.items):
        target = doc.items[cint(idx)]
    if not target:
        frappe.throw("Pick an item to mark packed.")
    target.packed = 1 if cint(packed) else 0
    missing = [i.item_name for i in doc.items if not i.packed]
    doc.status = "missing_items" if missing else "loaded"
    doc.save()
    frappe.db.commit()
    return packing_status(booking_name)


@frappe.whitelist()
def packing_status(booking_name: str) -> dict:
    _ops()
    if not frappe.db.exists("Packing List", booking_name):
        return {"booking": booking_name, "status": "missing", "items": [], "missing": []}
    doc = frappe.get_doc("Packing List", booking_name)
    items = doc.as_dict()["items"]
    missing = [i["item_name"] for i in items if not i.get("packed")]
    return {"name": doc.name, "booking": booking_name, "status": doc.status, "items": items, "missing": missing}


@frappe.whitelist()
def assign_vehicle(booking_name: str, vehicle_name: str) -> dict:
    _ops()
    booking = frappe.get_doc("Event Booking", booking_name)
    veh = frappe.get_doc("Vehicle", vehicle_name)
    if veh.status != "active":
        frappe.throw(f"Vehicle is {veh.status} and cannot be assigned.")
    conflicts = frappe.db.sql(
        """
        SELECT va.name
        FROM `tabVehicle Assignment` va
        JOIN `tabEvent Booking` eb ON eb.name = va.booking
        WHERE va.vehicle = %(veh)s AND va.status IN ('assigned','in_use')
          AND va.booking != %(booking)s
          AND eb.event_date = %(event_date)s
          AND eb.start_time < %(end_time)s AND eb.end_time > %(start_time)s
        """,
        {
            "veh": vehicle_name,
            "booking": booking_name,
            "event_date": booking.event_date,
            "start_time": booking.start_time,
            "end_time": booking.end_time,
        },
        as_dict=True,
    )
    if conflicts:
        frappe.throw("That vehicle is already assigned to an overlapping event.")
    existing = frappe.db.get_value("Vehicle Assignment", {"booking": booking_name, "vehicle": vehicle_name}, "name")
    if existing:
        return {"assignment": existing, "status": "already_assigned"}
    doc = frappe.get_doc(
        {"doctype": "Vehicle Assignment", "vehicle": vehicle_name, "booking": booking_name, "status": "assigned"}
    )
    doc.insert()
    frappe.db.commit()
    return {"assignment": doc.name, "status": "assigned"}


@frappe.whitelist()
def transfer_stock(from_location: str, to_location: str, item_code: str, qty: float) -> dict:
    _ops()
    qty = flt(qty)
    if qty <= 0:
        frappe.throw("Quantity must be greater than zero.")
    if from_location == to_location:
        frappe.throw("Pick two different locations.")
    src = _balance(from_location, item_code, create=False)
    if not src or flt(src.qty) < qty:
        frappe.throw("Not enough stock at the source location.")
    dst = _balance(to_location, item_code, create=True, item_name=src.item_name)
    src.qty = flt(src.qty) - qty
    dst.qty = flt(dst.qty) + qty
    src.save()
    dst.save()
    xfer = frappe.get_doc(
        {
            "doctype": "Stock Transfer",
            "from_location": from_location,
            "to_location": to_location,
            "item_code": item_code,
            "qty": qty,
            "status": "complete",
            "transferred_on": now_datetime(),
        }
    )
    xfer.insert()
    frappe.db.commit()
    return {"transfer": xfer.name, "from_qty": src.qty, "to_qty": dst.qty}


@frappe.whitelist()
def consume_for_booking(booking_name: str, location: str, item_code: str, qty: float) -> dict:
    _ops()
    qty = flt(qty)
    bal = _balance(location, item_code, create=False)
    if not bal or flt(bal.qty) < qty:
        frappe.throw("Not enough stock. Record a sub-rental to cover the shortage.")
    bal.qty = flt(bal.qty) - qty
    bal.save()
    frappe.db.commit()
    _maybe_reorder_alert(bal)
    return {"item_code": item_code, "remaining": bal.qty}


@frappe.whitelist()
def create_sub_rental(booking_name: str, item_name: str, qty: int, supplier: str, cost: float = 0) -> dict:
    _ops()
    doc = frappe.get_doc(
        {
            "doctype": "Sub Rental",
            "booking": booking_name,
            "item_name": item_name,
            "qty": cint(qty),
            "supplier": supplier,
            "cost": flt(cost),
            "status": "ordered",
        }
    )
    doc.insert()
    frappe.db.commit()
    if frappe.db.exists("Packing List", booking_name):
        generate_packing_list(booking_name)
    return {"sub_rental": doc.name}


def _balance(location, item_code, create=False, item_name=None):
    name = frappe.db.get_value("Stock Balance", {"location": location, "item_code": item_code}, "name")
    if name:
        return frappe.get_doc("Stock Balance", name)
    if not create:
        return None
    doc = frappe.get_doc(
        {
            "doctype": "Stock Balance",
            "location": location,
            "item_code": item_code,
            "item_name": item_name or item_code,
            "qty": 0,
            "reorder_level": 0,
        }
    )
    doc.insert()
    return doc


def _maybe_reorder_alert(bal):
    if flt(bal.reorder_level) and flt(bal.qty) <= flt(bal.reorder_level):
        from entertainment_express.notifications import send

        for email in _admin_emails():
            send(
                "fleet_alert",
                email,
                {
                    "title": "Low stock",
                    "detail": f"{bal.item_code} at {bal.location} is {bal.qty} (reorder {bal.reorder_level}).",
                },
            )


def _admin_emails():
    users = frappe.get_all("Has Role", filters={"role": ["in", ["EE Tenant Admin", "EE Dispatcher"]], "parenttype": "User"}, fields=["parent"])
    out = []
    for u in users:
        email = frappe.db.get_value("User", u.parent, "email")
        if email:
            out.append(email)
    return out[:8]


def asset_is_blocked(asset_name: str, window_start: datetime, window_end: datetime) -> str | None:
    """Return a reason if maintenance or an open checkout blocks the window."""
    last = frappe.get_all(
        "Asset Check Log",
        filters={"asset": asset_name},
        fields=["direction", "booking"],
        order_by="creation desc",
        limit=1,
    )
    if last and last[0].direction == "out":
        return f"Asset {asset_name} is checked out on {last[0].booking}"
    rows = frappe.get_all(
        "Maintenance Record",
        filters={
            "asset": asset_name,
            "blocks_booking": 1,
            "status": ["in", ["open", "scheduled", "in_progress"]],
        },
        fields=["name", "window_start", "window_end", "due_on"],
    )
    for row in rows:
        start = get_datetime(row.window_start) if row.window_start else None
        end = get_datetime(row.window_end) if row.window_end else None
        if start and end and start < window_end and end > window_start:
            return f"Asset {asset_name} is in maintenance ({row.name})"
        if row.due_on and not start:
            due = get_datetime(str(row.due_on) + " 00:00:00")
            if due.date() == window_start.date():
                return f"Asset {asset_name} has maintenance due ({row.name})"
    return None
