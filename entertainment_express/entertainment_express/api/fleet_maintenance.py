# Copyright (c) 2026, Trec-Tor Consulting and contributors
# For license information, please see license.txt

from __future__ import annotations

import json
import frappe
from frappe.utils import add_days, cint, flt, getdate, now_datetime, nowdate

from entertainment_express.fleet_maintenance.quarantine import quarantine_asset, release_quarantine
from entertainment_express.fleet_maintenance.safety import (
    check_expiring_safety_certificates,
    get_asset_safety_certificate_status,
)
from entertainment_express.fleet_maintenance.telemetry import (
    evaluate_asset_maintenance_rules,
    increment_asset_usage,
)


def _check_fleet_role(allowed_roles=None):
    if not allowed_roles:
        allowed_roles = ["EE Tenant Admin", "EE Manager", "EE Dispatcher", "System Manager", "EE Crew", "EE Entertainer"]
    user_roles = frappe.get_roles(frappe.session.user) if hasattr(frappe, "session") else []
    if not any(r in user_roles for r in allowed_roles) and frappe.session.user != "Administrator":
        frappe.throw("Not permitted to access fleet maintenance operations.", frappe.PermissionError)


@frappe.whitelist()
def report_damage(
    asset_ref: str,
    defect_description: str,
    severity: str = "Major",
    booking_ref: str | None = None,
    reported_by: str | None = None,
    photos=None,
    offline_timestamp: str | None = None,
) -> dict:
    """
    Crew or dispatcher damage reporting endpoint.
    Creates an Equipment Defect Report and auto-quarantines on Major/Critical severity.
    """
    _check_fleet_role()

    if not asset_ref or not frappe.db.exists("Service Asset", asset_ref):
        frappe.throw(f"Service Asset '{asset_ref}' not found.", frappe.DoesNotExistError)

    user = reported_by or getattr(frappe.session, "user", "Administrator")

    # Serialize photos if provided as list or dict
    photos_str = ""
    if photos:
        if isinstance(photos, (list, dict)):
            photos_str = json.dumps(photos)
        else:
            photos_str = str(photos)

    reported_at = offline_timestamp or now_datetime()

    # Create defect report
    defect_doc = frappe.get_doc({
        "doctype": "Equipment Defect Report",
        "reported_by": user,
        "booking_ref": booking_ref,
        "asset_ref": asset_ref,
        "severity": severity,
        "defect_description": defect_description,
        "photos": photos_str,
        "reported_at": reported_at,
        "resolution_status": "Open",
    })
    defect_doc.insert(ignore_permissions=True)

    quarantine_result = None
    is_quarantined = False

    # Auto-quarantine on Major or Critical severity
    if severity in ("Major", "Critical"):
        reason = f"[{severity} Defect] {defect_description}"
        quarantine_result = quarantine_asset(asset_ref, reason=reason, defect_report_id=defect_doc.name)
        is_quarantined = True

    frappe.db.commit()

    return {
        "success": True,
        "defect_report": defect_doc.name,
        "asset": asset_ref,
        "severity": severity,
        "quarantined": is_quarantined,
        "quarantine_result": quarantine_result,
    }


@frappe.whitelist()
def get_fleet_health_summary() -> dict:
    """
    Return fleet readiness, count of quarantined units, overdue maintenance,
    and expiring safety certificates.
    """
    _check_fleet_role(["EE Tenant Admin", "EE Manager", "EE Dispatcher", "System Manager"])

    # Count assets
    total_assets = frappe.db.count("Service Asset", {"status": ["!=", "retired"]})
    available_count = frappe.db.count("Service Asset", {"condition_status": "Available", "status": "available"})
    quarantined_count = frappe.db.count("Service Asset", {"condition_status": "Quarantined"})
    in_repair_count = frappe.db.count("Service Asset", {"condition_status": "In Repair"})
    pending_inspection_count = frappe.db.count("Service Asset", {"condition_status": "Pending Inspection"})

    readiness = 100.0 if total_assets == 0 else round((available_count / total_assets) * 100.0, 1)

    today = nowdate()
    # Overdue maintenance
    overdue_maintenance = frappe.db.count(
        "Maintenance Record",
        {"status": ["in", ["open", "scheduled"]], "due_on": ["<", today]},
    )

    # Expiring certificates (<= 30 days)
    horizon_30 = add_days(today, 30)
    expiring_certificates = frappe.db.count(
        "Safety Certificate",
        {"expiry_date": ["<=", horizon_30]},
    )

    # Recent defects
    recent_defects = frappe.get_all(
        "Equipment Defect Report",
        fields=["name", "asset_ref", "booking_ref", "severity", "defect_description", "reported_by", "reported_at", "resolution_status"],
        order_by="creation desc",
        limit=10,
    )

    return {
        "readiness_percentage": readiness,
        "total_assets": total_assets,
        "available_count": available_count,
        "quarantined_count": quarantined_count,
        "in_repair_count": in_repair_count,
        "pending_inspection_count": pending_inspection_count,
        "overdue_maintenance_count": overdue_maintenance,
        "expiring_certificates_count": expiring_certificates,
        "recent_defects": recent_defects,
    }


@frappe.whitelist()
def list_quarantined_assets() -> list[dict]:
    """
    List all quarantined or out-of-service assets with their defect history and repair status.
    """
    _check_fleet_role(["EE Tenant Admin", "EE Manager", "EE Dispatcher", "System Manager"])

    assets = frappe.get_all(
        "Service Asset",
        filters={"condition_status": ["in", ["Quarantined", "In Repair", "Pending Inspection"]]},
        fields=[
            "name", "asset_name", "asset_type", "condition_status", "quarantine_reason",
            "condition", "last_inspection_date", "operating_hours", "event_count", "home_location",
        ],
    )

    result = []
    for a in assets:
        defects = frappe.get_all(
            "Equipment Defect Report",
            filters={"asset_ref": a["name"]},
            fields=["name", "severity", "defect_description", "reported_by", "reported_at", "resolution_status"],
            order_by="creation desc",
            limit=5,
        )
        maintenance = frappe.get_all(
            "Maintenance Record",
            filters={"asset": a["name"], "status": ["in", ["open", "scheduled", "in_progress"]]},
            fields=["name", "due_on", "mtype", "status", "notes"],
            limit=3,
        )
        result.append({
            **a,
            "defects": defects,
            "maintenance": maintenance,
        })

    return result


@frappe.whitelist()
def quarantine_asset_api(asset_id: str, reason: str) -> dict:
    """Manual quarantine trigger from owner/dispatcher dashboard."""
    _check_fleet_role(["EE Tenant Admin", "EE Manager", "EE Dispatcher", "System Manager"])
    return quarantine_asset(asset_id, reason)


@frappe.whitelist()
def release_quarantine_api(asset_id: str, repair_cost: float = 0.0, technician_notes: str = "") -> dict:
    """Manual release from quarantine with technician repair notes."""
    _check_fleet_role(["EE Tenant Admin", "EE Manager", "EE Dispatcher", "System Manager"])
    return release_quarantine(asset_id, flt(repair_cost), technician_notes)
