# Copyright (c) 2026, Trec-Tor Consulting and contributors
# For license information, please see license.txt

from __future__ import annotations

import frappe
from frappe.utils import add_days, flt, getdate, nowdate


def quarantine_asset(asset_id: str, reason: str, defect_report_id: str | None = None) -> dict:
    """
    Quarantine an asset, revoke its availability, scan future bookings within 14 days,
    and generate dispatcher replacement alerts.
    """
    if not frappe.db.exists("Service Asset", asset_id):
        frappe.throw(f"Service Asset {asset_id} does not exist.", frappe.DoesNotExistError)

    asset = frappe.get_doc("Service Asset", asset_id)
    asset.condition_status = "Quarantined"
    asset.quarantine_reason = reason
    asset.status = "maintenance"
    asset.condition = "damaged"
    asset.save(ignore_permissions=True)

    today = nowdate()
    horizon = add_days(today, 14)

    # Find candidate available replacements of the same asset type
    replacements = frappe.get_all(
        "Service Asset",
        filters={
            "asset_type": asset.asset_type,
            "status": "available",
            "condition_status": "Available",
            "name": ["!=", asset.name],
        },
        fields=["name", "asset_name", "asset_type", "home_location"],
        limit=5,
    )

    # Scan future bookings containing this asset within 14 days
    affected_bookings = []
    future_booking_assets = frappe.db.sql(
        """
        SELECT eba.parent as booking_name, eb.event_date, eb.event_name, eb.customer
        FROM `tabEvent Booking Asset` eba
        JOIN `tabEvent Booking` eb ON eb.name = eba.parent
        WHERE eba.asset = %(asset)s
          AND eb.event_date BETWEEN %(today)s AND %(horizon)s
          AND eb.status NOT IN ('canceled', 'completed')
        ORDER BY eb.event_date ASC
        """,
        {"asset": asset_id, "today": today, "horizon": horizon},
        as_dict=True,
    )

    emails = []
    try:
        from entertainment_express.api.fleet_ops import _admin_emails
        emails = _admin_emails()
    except Exception:
        emails = []

    for row in future_booking_assets:
        affected_bookings.append({
            "booking": row["booking_name"],
            "event_date": str(row["event_date"]),
            "event_name": row["event_name"],
            "customer": row["customer"],
        })

        # Send dispatcher swap alert
        replacement_names = [r["asset_name"] if isinstance(r, dict) else getattr(r, "asset_name", "") for r in replacements]
        repl_str = ", ".join(replacement_names) if replacement_names else "No identical units available!"
        alert_title = f"EMERGENCY GEAR CONFLICT: {asset.asset_name} Quarantined"
        alert_detail = (
            f"Asset {asset.asset_name} ({asset.name}) was quarantined ('{reason}'). "
            f"Booking {row['booking_name']} ('{row['event_name']}' on {row['event_date']}) "
            f"requires replacement gear! Suggested replacements: {repl_str}"
        )
        if emails:
            try:
                from entertainment_express.notifications import send
                for email in emails:
                    send("fleet_alert", email, {"title": alert_title, "detail": alert_detail})
            except Exception:
                pass

    return {
        "status": "quarantined",
        "asset": asset_id,
        "asset_name": asset.asset_name,
        "reason": reason,
        "affected_bookings": affected_bookings,
        "suggested_replacements": replacements,
    }


def release_quarantine(asset_id: str, repair_cost: float = 0.0, technician_notes: str = "") -> dict:
    """
    Release an asset from quarantine, restoring its status to Available.
    Records repair details and resolves defect reports.
    """
    if not frappe.db.exists("Service Asset", asset_id):
        frappe.throw(f"Service Asset {asset_id} does not exist.", frappe.DoesNotExistError)

    today = nowdate()
    asset = frappe.get_doc("Service Asset", asset_id)
    asset.condition_status = "Available"
    asset.quarantine_reason = None
    asset.status = "available"
    asset.condition = "good"
    asset.last_inspection_date = today
    asset.save(ignore_permissions=True)

    # Record maintenance/repair history if details provided
    if repair_cost or technician_notes:
        rec = frappe.get_doc({
            "doctype": "Maintenance Record",
            "resource_type": "asset",
            "asset": asset_id,
            "mtype": "repair",
            "due_on": today,
            "performed_on": today,
            "cost": flt(repair_cost),
            "status": "complete",
            "blocks_booking": 0,
            "notes": f"Quarantine release repair: {technician_notes}",
        })
        rec.insert(ignore_permissions=True)

    # Mark open defect reports as resolved
    open_defects = frappe.get_all(
        "Equipment Defect Report",
        filters={"asset_ref": asset_id, "resolution_status": ["in", ["Open", "Investigating"]]},
        fields=["name"],
    )
    for defect in open_defects:
        d_name = defect.get("name") if isinstance(defect, dict) else getattr(defect, "name", None)
        if d_name:
            frappe.db.set_value("Equipment Defect Report", d_name, "resolution_status", "Resolved")

    return {
        "status": "released",
        "asset": asset_id,
        "asset_name": asset.asset_name,
        "last_inspection_date": str(today),
    }
