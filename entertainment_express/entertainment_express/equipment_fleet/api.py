"""
Equipment Fleet API — Temporal Availability, Buffer Rules, Equipment Quarantine, and Reservation Sync.
"""

from datetime import datetime
import json
import frappe
from frappe.utils import add_to_date, get_datetime, flt, now_datetime


DEFAULT_PREP_MINUTES = 60
DEFAULT_TEARDOWN_MINUTES = 60
DEFAULT_TURNAROUND_MINUTES = 180


@frappe.whitelist()
def check_temporal_availability(items_json, start_datetime, end_datetime, warehouse=None):
    """
    items_json: list of dicts [{"item_code": "BH-01", "qty": 1}] or json string
    start_datetime: ISO string or datetime
    end_datetime: ISO string or datetime
    warehouse: optional warehouse name filter

    Returns: {"available": bool, "details": [...], "conflicts": [...]}
    """
    if isinstance(items_json, str):
        try:
            items = json.loads(items_json)
        except Exception:
            items = []
    else:
        items = items_json or []

    event_start = get_datetime(start_datetime)
    event_end = get_datetime(end_datetime)

    if event_end <= event_start:
        return {"available": False, "details": [], "conflicts": ["Invalid event datetime range: end_datetime must be after start_datetime."]}

    details = []
    conflicts = []

    for entry in items:
        item_code = entry.get("item_code")
        req_qty = int(entry.get("qty", 1))
        if not item_code:
            continue

        buffer_rules = get_item_buffer_rules(item_code)
        prep_mins = buffer_rules["prep_minutes"]
        teardown_mins = buffer_rules["teardown_minutes"]
        turnaround_mins = buffer_rules["turnaround_sanitization_minutes"]

        req_buffer_start = add_to_date(event_start, minutes=-prep_mins)
        req_buffer_end = add_to_date(event_end, minutes=(teardown_mins + turnaround_mins))

        total_stock = get_total_item_capacity(item_code, warehouse)

        # Check overlapping reservations
        reservation_filters = [
            ["item_code", "=", item_code],
            ["status", "in", ["Reserved", "Dispatched", "Quarantined"]],
            ["buffer_start", "<", req_buffer_end],
            ["buffer_end", ">", req_buffer_start],
        ]
        if warehouse:
            reservation_filters.append(["warehouse", "=", warehouse])

        overlapping_res = frappe.get_all(
            "EE Equipment Reservation",
            filters=reservation_filters,
            fields=["name", "booking", "reserved_qty", "buffer_start", "buffer_end", "status"],
        )

        reserved_qty = sum(flt(r["reserved_qty"]) for r in overlapping_res)

        # Check active quarantines
        quarantine_filters = [
            ["item_code", "=", item_code],
            ["quarantine_status", "in", ["Quarantined", "In Repair"]],
        ]
        active_quarantines = frappe.get_all(
            "EE Equipment Quarantine",
            filters=quarantine_filters,
            fields=["name", "asset", "reason"],
        )
        quarantined_qty = len(active_quarantines)

        available_capacity = max(0, total_stock - reserved_qty - quarantined_qty)

        item_detail = {
            "item_code": item_code,
            "requested_qty": req_qty,
            "total_stock": total_stock,
            "reserved_qty": reserved_qty,
            "quarantined_qty": quarantined_qty,
            "available_capacity": available_capacity,
            "req_buffer_start": str(req_buffer_start),
            "req_buffer_end": str(req_buffer_end),
            "available": available_capacity >= req_qty,
        }
        details.append(item_detail)

        if available_capacity < req_qty:
            conflict_msg = (
                f"Item '{item_code}' has insufficient capacity for range "
                f"({req_buffer_start} to {req_buffer_end}). Required: {req_qty}, "
                f"Available: {available_capacity} (Stock: {total_stock}, Reserved: {reserved_qty}, Quarantined: {quarantined_qty})."
            )
            conflicts.append(conflict_msg)

    return {
        "available": len(conflicts) == 0,
        "details": details,
        "conflicts": conflicts,
    }


def get_item_buffer_rules(item_code):
    """Retrieve category buffer rule or fallback defaults."""
    item_group = frappe.db.get_value("Item", item_code, "item_group")
    if item_group:
        rule = frappe.db.get_value(
            "EE Category Buffer Rule",
            {"category": item_group},
            ["prep_minutes", "teardown_minutes", "turnaround_sanitization_minutes", "requires_post_gig_inspection"],
            as_dict=True,
        )
        if rule:
            return rule

    return {
        "prep_minutes": DEFAULT_PREP_MINUTES,
        "teardown_minutes": DEFAULT_TEARDOWN_MINUTES,
        "turnaround_sanitization_minutes": DEFAULT_TURNAROUND_MINUTES,
        "requires_post_gig_inspection": 0,
    }


def get_total_item_capacity(item_code, warehouse=None):
    """Returns owned stock capacity for an item_code."""
    if frappe.db.exists("DocType", "Service Asset"):
        asset_filters = [["item_code", "=", item_code], ["status", "!=", "Scrapped"]]
        count = frappe.db.count("Service Asset", filters=asset_filters)
        if count > 0:
            return count

    # Default to 1 if item exists, else count stock balance if any
    if frappe.db.exists("Item", item_code):
        return 1
    return 1


@frappe.whitelist()
def quarantine_asset(item_code=None, asset=None, reason="Damage", notes=None):
    """
    Creates EE Equipment Quarantine record and updates Asset status if applicable.
    """
    if not item_code and asset:
        item_code = frappe.db.get_value("Service Asset", asset, "item_code") or asset

    if not item_code:
        frappe.throw("item_code or asset is required to quarantine equipment.")

    quarantine_doc = frappe.get_doc({
        "doctype": "EE Equipment Quarantine",
        "item_code": item_code,
        "asset": asset,
        "quarantine_status": "Quarantined",
        "reason": reason,
        "notes": notes,
        "flagged_by": frappe.session.user,
        "flagged_datetime": now_datetime(),
    })
    quarantine_doc.insert(ignore_permissions=True)

    if asset and frappe.db.exists("DocType", "Service Asset") and frappe.db.exists("Service Asset", asset):
        frappe.db.set_value("Service Asset", asset, "status", "In Maintenance")

    frappe.db.commit()
    return {"status": "quarantined", "name": quarantine_doc.name}


@frappe.whitelist()
def release_asset_quarantine(quarantine_id, resolution_notes=None):
    """
    Releases the quarantine and restores asset to available pool.
    """
    if not frappe.db.exists("EE Equipment Quarantine", quarantine_id):
        frappe.throw(f"Quarantine record '{quarantine_id}' does not exist.")

    doc = frappe.get_doc("EE Equipment Quarantine", quarantine_id)
    doc.quarantine_status = "Inspected & Cleared"
    doc.resolved_by = frappe.session.user
    doc.resolved_datetime = now_datetime()
    if resolution_notes:
        doc.notes = (doc.notes or "") + f"\nResolution: {resolution_notes}"
    doc.save(ignore_permissions=True)

    if doc.asset and frappe.db.exists("DocType", "Service Asset") and frappe.db.exists("Service Asset", doc.asset):
        frappe.db.set_value("Service Asset", doc.asset, "status", "Available")

    frappe.db.commit()
    return {"status": "released", "name": quarantine_id}


@frappe.whitelist()
def get_timeline_availability_matrix(start_date, end_date, item_group=None):
    """
    Aggregates reservations, maintenance locks, and total capacity per day/hour for React grid.
    """
    start_dt = get_datetime(start_date)
    end_dt = get_datetime(end_date)

    item_filters = {}
    if item_group:
        item_filters["item_group"] = item_group

    items = frappe.get_all("Item", filters=item_filters, fields=["name", "item_name", "item_group"])

    reservations = frappe.get_all(
        "EE Equipment Reservation",
        filters=[
            ["buffer_start", "<=", end_dt],
            ["buffer_end", ">=", start_dt],
            ["status", "in", ["Reserved", "Dispatched", "Quarantined"]],
        ],
        fields=["name", "booking", "item_code", "asset", "reserved_qty", "event_start", "event_end", "buffer_start", "buffer_end", "status"],
    )

    quarantines = frappe.get_all(
        "EE Equipment Quarantine",
        filters=[
            ["quarantine_status", "in", ["Quarantined", "In Repair"]],
        ],
        fields=["name", "item_code", "asset", "reason", "quarantine_status", "flagged_datetime"],
    )

    return {
        "items": items,
        "reservations": reservations,
        "quarantines": quarantines,
        "start_date": str(start_dt),
        "end_date": str(end_dt),
    }


def sync_booking_reservations(doc, method=None):
    """
    Hook called on Event Booking change. Automatically manages EE Equipment Reservation rows.
    """
    if not doc or getattr(doc, "doctype", None) != "Event Booking":
        return

    status = (doc.status or "").lower()

    if status in ("canceled", "cancelled", "refunded"):
        # Release reservations for this booking
        res_list = frappe.get_all("EE Equipment Reservation", filters={"booking": doc.name}, fields=["name"])
        for r in res_list:
            frappe.db.set_value("EE Equipment Reservation", r["name"], "status", "Released")
        frappe.db.commit()
        return

    if status in ("confirmed", "booked", "in_progress", "tentative"):
        # Calculate start and end datetime
        event_date = getattr(doc, "event_date", None)
        start_time = getattr(doc, "start_time", None)
        end_time = getattr(doc, "end_time", None)

        if not event_date:
            return

        event_start = get_datetime(f"{event_date} {start_time or '09:00:00'}")
        event_end = get_datetime(f"{event_date} {end_time or '17:00:00'}")

        service_items = getattr(doc, "service_items", []) or []

        # Remove stale reservations for items no longer in booking
        existing_res = frappe.get_all("EE Equipment Reservation", filters={"booking": doc.name}, fields=["name", "item_code"])
        item_codes = [i.item or i.item_code for i in service_items if getattr(i, "item", None) or getattr(i, "item_code", None)]

        for res in existing_res:
            if res["item_code"] not in item_codes:
                frappe.db.set_value("EE Equipment Reservation", res["name"], "status", "Released")

        for line in service_items:
            item_code = getattr(line, "item", None) or getattr(line, "item_code", None)
            qty = int(flt(getattr(line, "qty", 1)))
            if not item_code:
                continue

            buffer_rules = get_item_buffer_rules(item_code)
            prep_mins = buffer_rules["prep_minutes"]
            teardown_mins = buffer_rules["teardown_minutes"]
            turnaround_mins = buffer_rules["turnaround_sanitization_minutes"]

            buffer_start = add_to_date(event_start, minutes=-prep_mins)
            buffer_end = add_to_date(event_end, minutes=(teardown_mins + turnaround_mins))

            existing = frappe.get_all(
                "EE Equipment Reservation",
                filters={"booking": doc.name, "item_code": item_code, "status": ["!=", "Released"]},
                fields=["name"],
            )

            if existing:
                res_doc = frappe.get_doc("EE Equipment Reservation", existing[0]["name"])
                res_doc.reserved_qty = qty
                res_doc.event_start = event_start
                res_doc.event_end = event_end
                res_doc.buffer_start = buffer_start
                res_doc.buffer_end = buffer_end
                res_doc.save(ignore_permissions=True)
            else:
                res_doc = frappe.get_doc({
                    "doctype": "EE Equipment Reservation",
                    "booking": doc.name,
                    "item_code": item_code,
                    "reserved_qty": qty,
                    "event_start": event_start,
                    "event_end": event_end,
                    "buffer_start": buffer_start,
                    "buffer_end": buffer_end,
                    "status": "Reserved",
                })
                res_doc.insert(ignore_permissions=True)

        frappe.db.commit()
