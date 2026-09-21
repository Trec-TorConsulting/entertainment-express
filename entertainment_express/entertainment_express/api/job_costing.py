# Copyright (c) 2026, Trec-Tor Consulting and contributors
# For license information, please see license.txt

import json
import frappe
from frappe.utils import flt, cint
from entertainment_express.job_costing.cost_engine import recompute_event_cost_sheet
from entertainment_express.job_costing.provisioning import ensure_event_cost_center_and_project


def _check_access():
    roles = frappe.get_roles()
    allowed = {"EE Tenant Admin", "EE Accounting", "EE Sales", "System Manager"}
    if not any(r in allowed for r in roles):
        frappe.throw("Not permitted to view job costing and margin intelligence.", frappe.PermissionError)


@frappe.whitelist()
def get_event_pl(booking_name: str) -> dict:
    """
    Returns structured P&L analysis, categorized costs, margin indicators,
    and itemized ledger audit lines for a specific Event Booking.
    """
    _check_access()

    if not booking_name or not frappe.db.exists("Event Booking", booking_name):
        frappe.throw(f"Event Booking {booking_name} not found.", frappe.DoesNotExistError)

    # Ensure provisioning
    ensure_event_cost_center_and_project(booking_name)

    # Recompute fresh totals
    recomputed = recompute_event_cost_sheet(booking_name)

    booking = frappe.get_doc("Event Booking", booking_name)
    cust = getattr(booking, "customer", "")
    customer_name = cust
    if cust and frappe.db.table_exists("Customer"):
        customer_name = frappe.db.get_value("Customer", cust, "customer_name") or cust

    return {
        "booking_name": getattr(booking, "name", booking_name),
        "event_name": getattr(booking, "event_name", ""),
        "customer": cust,
        "customer_name": customer_name,
        "event_date": str(getattr(booking, "event_date", "") or ""),
        "booking_status": getattr(booking, "status", ""),
        "cost_center": recomputed.get("cost_center") or getattr(booking, "cost_center", ""),
        "project": recomputed.get("project") or getattr(booking, "project", ""),
        "currency": getattr(booking, "currency", None) or "USD",
        "gross_revenue": recomputed.get("gross_revenue", 0.0),
        "labor_cost": recomputed.get("labor_cost", 0.0),
        "subcontractor_cost": recomputed.get("subcontractor_cost", 0.0),
        "consumable_cost": recomputed.get("consumable_cost", 0.0),
        "equipment_wear_cost": recomputed.get("equipment_wear_cost", 0.0),
        "gateway_fees": recomputed.get("gateway_fees", 0.0),
        "total_cogs": recomputed.get("total_cogs", 0.0),
        "net_profit": recomputed.get("net_profit", 0.0),
        "margin_percent": recomputed.get("margin_percent", 0.0),
        "target_margin_percent": recomputed.get("target_margin_percent", 40.0),
        "margin_status": recomputed.get("margin_status", "healthy"),
        "ledger_lines": recomputed.get("ledger_lines", []),
    }


@frappe.whitelist()
def list_events_margin_summary(from_date: str = None, to_date: str = None, status: str = None, sort_by: str = None, limit: int = 50) -> dict:
    """
    List bookings with their current margin status and P&L metrics.
    Supports filtering by event_date, status, and sorting (e.g. low-margin first).
    """
    _check_access()

    limit = cint(limit) or 50
    filters = {"status": ["not in", ["canceled"]]}

    if status and status in ("healthy", "warning", "critical"):
        sheet_names = frappe.db.get_all("Event Cost Sheet", filters={"margin_status": status}, pluck="event_booking")
        filters["name"] = ["in", sheet_names] if sheet_names else ["=", "NONE"]

    if from_date and to_date:
        filters["event_date"] = ["between", [from_date, to_date]]
    elif from_date:
        filters["event_date"] = [">=", from_date]
    elif to_date:
        filters["event_date"] = ["<=", to_date]

    bookings = frappe.db.get_all(
        "Event Booking",
        filters=filters,
        fields=["name", "event_name", "customer", "event_date", "status", "grand_total", "cost_sheet", "target_margin_percent"],
        limit=limit,
        order_by="event_date desc",
    )

    results = []
    total_rev = 0.0
    total_profit = 0.0
    healthy_count = 0
    warning_count = 0
    critical_count = 0

    for b in bookings:
        sheet_data = None
        if b.get("cost_sheet") and frappe.db.exists("Event Cost Sheet", b["cost_sheet"]):
            sheet = frappe.get_doc("Event Cost Sheet", b["cost_sheet"])
            sheet_data = {
                "gross_revenue": flt(sheet.gross_revenue),
                "total_cogs": flt(sheet.total_cogs),
                "net_profit": flt(sheet.net_profit),
                "margin_percent": flt(sheet.margin_percent),
                "target_margin_percent": flt(sheet.target_margin_percent),
                "margin_status": sheet.margin_status or "healthy",
            }
        else:
            # Quick estimate
            gross = flt(b.get("grand_total", 0.0))
            sheet_data = {
                "gross_revenue": gross,
                "total_cogs": 0.0,
                "net_profit": gross,
                "margin_percent": 100.0 if gross > 0 else 0.0,
                "target_margin_percent": flt(b.get("target_margin_percent") or 40.0),
                "margin_status": "healthy",
            }

        total_rev += sheet_data["gross_revenue"]
        total_profit += sheet_data["net_profit"]
        if sheet_data["margin_status"] == "healthy":
            healthy_count += 1
        elif sheet_data["margin_status"] == "warning":
            warning_count += 1
        elif sheet_data["margin_status"] == "critical":
            critical_count += 1

        results.append({
            "booking_name": b["name"],
            "event_name": b.get("event_name"),
            "customer": b.get("customer"),
            "event_date": str(b.get("event_date") or ""),
            "status": b.get("status"),
            **sheet_data,
        })

    # Sort if requested
    if sort_by == "margin_asc":
        results.sort(key=lambda x: x["margin_percent"])
    elif sort_by == "margin_desc":
        results.sort(key=lambda x: x["margin_percent"], reverse=True)
    elif sort_by == "profit_desc":
        results.sort(key=lambda x: x["net_profit"], reverse=True)

    avg_margin = flt((total_profit / total_rev * 100.0), 2) if total_rev > 0 else 0.0

    return {
        "summary": {
            "total_events": len(results),
            "total_revenue": flt(total_rev, 2),
            "total_profit": flt(total_profit, 2),
            "average_margin_percent": avg_margin,
            "healthy_count": healthy_count,
            "warning_count": warning_count,
            "critical_count": critical_count,
        },
        "events": results,
    }


@frappe.whitelist()
def set_event_margin_target(booking_name: str, target_percent: float) -> dict:
    """
    Tenant Admin method to configure custom margin target for a specific booking.
    """
    roles = frappe.get_roles()
    if "EE Tenant Admin" not in roles and "System Manager" not in roles:
        frappe.throw("Only EE Tenant Admin can adjust event margin targets.", frappe.PermissionError)

    if not booking_name or not frappe.db.exists("Event Booking", booking_name):
        frappe.throw(f"Event Booking {booking_name} not found.", frappe.DoesNotExistError)

    target = flt(target_percent)
    if target < 0 or target > 100:
        frappe.throw("Target margin percent must be between 0 and 100.", frappe.ValidationError)

    frappe.db.set_value("Event Booking", booking_name, "target_margin_percent", target)

    # If sheet exists, update and recalculate status
    sheet_name = frappe.db.get_value("Event Cost Sheet", {"event_booking": booking_name}, "name")
    new_status = "healthy"
    if sheet_name:
        sheet = frappe.get_doc("Event Cost Sheet", sheet_name)
        sheet.target_margin_percent = target
        sheet.calculate_totals()
        sheet.save(ignore_permissions=True)
        new_status = sheet.margin_status

    return {
        "booking_name": booking_name,
        "target_margin_percent": target,
        "margin_status": new_status,
    }


@frappe.whitelist()
def get_event_pl_drawer_data(booking: str) -> dict:
    """Task 2.4 API: Compiles live General Ledger entries into a structured P&L waterfall breakdown."""
    pl_data = get_event_pl(booking_name=booking)
    return {
        "booking_id": booking,
        "event_name": pl_data.get("event_name"),
        "customer": pl_data.get("customer_name"),
        "gross_revenue": pl_data.get("gross_revenue", 0.0),
        "waterfall": {
            "labor": pl_data.get("labor_cost", 0.0),
            "subcontractor": pl_data.get("subcontractor_cost", 0.0),
            "consumables": pl_data.get("consumable_cost", 0.0),
            "equipment_wear": pl_data.get("equipment_wear_cost", 0.0),
            "gateway_fees": pl_data.get("gateway_fees", 0.0),
            "total_cogs": pl_data.get("total_cogs", 0.0),
            "net_profit": pl_data.get("net_profit", 0.0),
        },
        "margin_percent": pl_data.get("margin_percent", 0.0),
        "target_margin_percent": pl_data.get("target_margin_percent", 40.0),
        "margin_status": pl_data.get("margin_status", "healthy"),
        "ledger_lines": pl_data.get("ledger_lines", []),
    }


