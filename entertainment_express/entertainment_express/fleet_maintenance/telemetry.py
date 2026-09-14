# Copyright (c) 2026, Trec-Tor Consulting and contributors
# For license information, please see license.txt

from __future__ import annotations

import frappe
from frappe.utils import cint, flt, getdate, nowdate, time_diff_in_hours


def increment_asset_usage(booking) -> list[str]:
    """
    Increment operating hours and event count for all Service Assets
    assigned to the completed booking. Evaluates maintenance rules.
    """
    if isinstance(booking, str):
        booking = frappe.get_doc("Event Booking", booking)

    assigned_assets = getattr(booking, "assigned_assets", []) or []
    if not assigned_assets:
        return []

    # Calculate hours
    hours = 4.0  # Default 4 hours if not determinable
    try:
        if getattr(booking, "start_time", None) and getattr(booking, "end_time", None):
            # Time objects or strings
            diff = time_diff_in_hours(str(booking.end_time), str(booking.start_time))
            if diff > 0:
                hours = flt(diff, 2)
    except Exception:
        hours = 4.0

    updated_assets = []
    for row in assigned_assets:
        asset_name = getattr(row, "asset", None)
        if not asset_name or not frappe.db.exists("Service Asset", asset_name):
            continue

        asset = frappe.get_doc("Service Asset", asset_name)
        asset.operating_hours = flt(asset.operating_hours or 0.0) + hours
        asset.event_count = cint(asset.event_count or 0) + 1

        # If asset was dispatched or in use, return to Available unless Quarantined / In Repair
        if asset.condition_status in ("Dispatched", "In Use"):
            asset.condition_status = "Available"

        asset.save(ignore_permissions=True)
        updated_assets.append(asset.name)

        # Trigger maintenance rule evaluations
        evaluate_asset_maintenance_rules(asset)

    return updated_assets


def evaluate_asset_maintenance_rules(asset) -> list[str]:
    """
    Compare cumulative telemetry meters against Equipment Maintenance Schedule rules.
    Creates Maintenance Record (and ERPNext Asset Maintenance Log if present) when triggered.
    """
    if isinstance(asset, str):
        asset = frappe.get_doc("Service Asset", asset)

    filters = {"is_active": 1}
    schedules = frappe.get_all(
        "Equipment Maintenance Schedule",
        filters=filters,
        fields=["name", "rule_name", "asset_category", "trigger_type", "interval_value", "service_checklist"],
    )

    triggered_records = []
    today = nowdate()

    for sched in schedules:
        # Check if schedule applies to this asset category
        sched_cat = sched.get("asset_category")
        if sched_cat and sched_cat != "All" and sched_cat != getattr(asset, "asset_type", None):
            continue

        trigger_type = sched.get("trigger_type")
        interval = flt(sched.get("interval_value") or 0)
        if interval <= 0:
            continue

        triggered = False
        if trigger_type == "operating_hours":
            current_hours = flt(getattr(asset, "operating_hours", 0.0))
            if current_hours >= interval:
                triggered = True
        elif trigger_type == "event_count":
            current_events = cint(getattr(asset, "event_count", 0))
            if current_events >= interval:
                triggered = True
        elif trigger_type == "mileage":
            current_mileage = flt(getattr(asset, "current_mileage", 0.0))
            if current_mileage >= interval:
                triggered = True
        elif trigger_type == "calendar":
            last_date = getattr(asset, "last_inspection_date", None) or getattr(asset, "creation", None)
            if last_date:
                days_elapsed = (getdate(today) - getdate(last_date)).days
                if days_elapsed >= interval:
                    triggered = True

        if triggered:
            rule_name = sched.get("rule_name") if isinstance(sched, dict) else getattr(sched, "rule_name", "")
            checklist = sched.get("service_checklist") if isinstance(sched, dict) else getattr(sched, "service_checklist", "N/A")
            # Check if there is already an active (open/scheduled) maintenance record
            existing = frappe.db.exists(
                "Maintenance Record",
                {
                    "asset": asset.name,
                    "status": ["in", ["open", "scheduled", "in_progress"]],
                    "notes": ["like", f"%{rule_name}%"],
                },
            )
            if not existing:
                rec = frappe.get_doc({
                    "doctype": "Maintenance Record",
                    "resource_type": "asset",
                    "asset": asset.name,
                    "mtype": "scheduled",
                    "due_on": today,
                    "status": "open",
                    "blocks_booking": 1,
                    "notes": f"Triggered by schedule: {rule_name}. Checklist: {checklist or 'N/A'}",
                })
                rec.insert(ignore_permissions=True)
                triggered_records.append(rec.name)

                # Flag asset as Pending Inspection
                if getattr(asset, "condition_status", None) != "Quarantined":
                    asset.condition_status = "Pending Inspection"
                    asset.save(ignore_permissions=True)

                # If ERPNext Asset Maintenance Log exists, mirror record
                if frappe.db.exists("DocType", "Asset Maintenance Log"):
                    try:
                        erp_log = frappe.get_doc({
                            "doctype": "Asset Maintenance Log",
                            "asset_name": getattr(asset, "asset_name", asset.name),
                            "maintenance_status": "Planned",
                            "due_date": today,
                            "description": f"Schedule {rule_name} triggered",
                        })
                        erp_log.insert(ignore_permissions=True)
                    except Exception:
                        pass

    return triggered_records


def on_booking_update(doc, method=None):
    """Doc event hook on Event Booking update."""
    if doc.get("status") == "completed" and not getattr(doc.flags, "telemetry_recorded", False):
        increment_asset_usage(doc)
        doc.flags.telemetry_recorded = True
