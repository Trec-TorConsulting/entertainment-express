# Copyright (c) 2026, Trec-Tor Consulting and contributors
# For license information, please see license.txt

import json
import frappe
from frappe.utils import flt, now_datetime


def recompute_event_cost_sheet(booking_name: str) -> dict:
    """
    Recomputes the Event Cost Sheet for an Event Booking by rolling up:
    1. Gross Revenue (from submitted Sales Invoices, or booking grand total fallback)
    2. Direct Labor (approved Timesheets + crew gig fees)
    3. Subcontractors (Purchase Invoices, Purchase Orders, accepted Subcontract Jobs)
    4. Consumables (Material Issue Stock Entries charged to cost center/project)
    5. Equipment Wear (wear rates on booked assets)
    6. Payment Gateway Fees (Stripe/Square card processing fees)
    
    Updates and saves the linked Event Cost Sheet.
    Returns the updated cost sheet dictionary.
    """
    if not frappe.db.exists("Event Booking", booking_name):
        return {}

    booking = frappe.get_doc("Event Booking", booking_name)
    project_name = getattr(booking, "project", None)
    cost_center_name = getattr(booking, "cost_center", None)

    ledger_lines = []

    # -------------------------------------------------------------------------
    # 1. Gross Revenue Rollup
    # -------------------------------------------------------------------------
    gross_revenue = 0.0
    invoiced_revenue = 0.0

    if frappe.db.table_exists("Sales Invoice"):
        # Find submitted sales invoices linked to booking or project
        si_filters = {"docstatus": 1}
        invoices = []
        if frappe.get_meta("Sales Invoice").has_field("ee_booking"):
            invoices = frappe.db.get_all(
                "Sales Invoice",
                filters={"ee_booking": booking_name, "docstatus": 1},
                fields=["name", "grand_total", "posting_date", "customer"],
            )

        if not invoices and project_name and frappe.get_meta("Sales Invoice").has_field("project"):
            invoices = frappe.db.get_all(
                "Sales Invoice",
                filters={"project": project_name, "docstatus": 1},
                fields=["name", "grand_total", "posting_date", "customer"],
            )

        for inv in invoices:
            amt = flt(inv.get("grand_total", 0.0))
            invoiced_revenue += amt
            ledger_lines.append({
                "category": "revenue",
                "source_doctype": "Sales Invoice",
                "source_name": inv["name"],
                "description": f"Sales Invoice {inv['name']}",
                "amount": amt,
                "date": str(inv.get("posting_date") or ""),
            })

    if invoiced_revenue > 0:
        gross_revenue = invoiced_revenue
    else:
        # Fallback to booking contract grand total
        gross_revenue = flt(getattr(booking, "grand_total", 0.0))
        if gross_revenue > 0:
            ledger_lines.append({
                "category": "revenue",
                "source_doctype": "Event Booking",
                "source_name": booking_name,
                "description": f"Booked Contract Total ({booking.event_name or 'Event'})",
                "amount": gross_revenue,
                "date": str(getattr(booking, "event_date", "")),
            })

    # -------------------------------------------------------------------------
    # 2. Direct Labor Rollup
    # -------------------------------------------------------------------------
    labor_cost = 0.0
    processed_timesheet_users = set()

    if frappe.db.table_exists("Timesheet Detail"):
        has_ee_booking = frappe.get_meta("Timesheet Detail").has_field("ee_booking")
        has_project = frappe.get_meta("Timesheet Detail").has_field("project")
        
        ts_filters = {}
        if has_ee_booking:
            ts_filters["ee_booking"] = booking_name
        elif has_project and project_name:
            ts_filters["project"] = project_name

        if ts_filters:
            ts_lines = frappe.db.get_all(
                "Timesheet Detail",
                filters=ts_filters,
                fields=["name", "parent", "hours", "billing_rate", "cost_rate", "billing_amount", "cost_amount"],
            )
            for ts in ts_lines:
                rate = flt(ts.get("cost_rate")) or flt(ts.get("billing_rate")) or 0.0
                hours = flt(ts.get("hours", 0.0))
                amt = flt(ts.get("cost_amount")) or flt(ts.get("billing_amount")) or flt(hours * rate, 2)
                labor_cost += amt
                processed_timesheet_users.add(ts["name"])
                ledger_lines.append({
                    "category": "labor",
                    "source_doctype": "Timesheet Detail",
                    "source_name": ts["name"],
                    "description": f"Crew Timesheet ({hours} hrs @ ${rate}/hr)",
                    "amount": amt,
                    "date": str(getattr(booking, "event_date", "")),
                })

    # Crew assignment / gig fees check
    if frappe.db.table_exists("EE Crew Assignment"):
        crew_assignments = frappe.db.get_all(
            "EE Crew Assignment",
            filters={"event_booking": booking_name},
            fields=["name", "crew_member", "role", "agreed_fee", "payout_amount", "status"],
        )
        for ca in crew_assignments:
            # If no timesheet was filed for this crew role, capture agreed gig fee
            fee = flt(ca.get("payout_amount")) or flt(ca.get("agreed_fee")) or 0.0
            if fee > 0 and ca["name"] not in processed_timesheet_users:
                labor_cost += fee
                ledger_lines.append({
                    "category": "labor",
                    "source_doctype": "EE Crew Assignment",
                    "source_name": ca["name"],
                    "description": f"Gig Assignment Fee: {ca.get('role', 'Crew')} ({ca.get('crew_member', '')})",
                    "amount": fee,
                    "date": str(getattr(booking, "event_date", "")),
                })

    # -------------------------------------------------------------------------
    # 3. Subcontractor & Sub-Rental Expenses
    # -------------------------------------------------------------------------
    subcontractor_cost = 0.0
    recorded_sub_sources = set()

    if frappe.db.table_exists("Purchase Invoice"):
        pi_filters = {"docstatus": 1}
        has_pi_booking = frappe.get_meta("Purchase Invoice").has_field("ee_booking")
        has_pi_project = frappe.get_meta("Purchase Invoice").has_field("project")

        pis = []
        if has_pi_booking:
            pis = frappe.db.get_all(
                "Purchase Invoice",
                filters={"ee_booking": booking_name, "docstatus": 1},
                fields=["name", "supplier", "grand_total", "posting_date"],
            )
        if not pis and project_name and has_pi_project:
            pis = frappe.db.get_all(
                "Purchase Invoice",
                filters={"project": project_name, "docstatus": 1},
                fields=["name", "supplier", "grand_total", "posting_date"],
            )

        for pi in pis:
            amt = flt(pi.get("grand_total", 0.0))
            subcontractor_cost += amt
            recorded_sub_sources.add(pi["name"])
            ledger_lines.append({
                "category": "subcontractor",
                "source_doctype": "Purchase Invoice",
                "source_name": pi["name"],
                "description": f"Partner Vendor Bill: {pi.get('supplier', 'Vendor')}",
                "amount": amt,
                "date": str(pi.get("posting_date") or ""),
            })

    # Committed purchase orders
    if frappe.db.table_exists("Purchase Order"):
        po_filters = {"docstatus": 1}
        if project_name and frappe.get_meta("Purchase Order").has_field("project"):
            pos = frappe.db.get_all(
                "Purchase Order",
                filters={"project": project_name, "docstatus": 1},
                fields=["name", "supplier", "grand_total", "transaction_date"],
            )
            for po in pos:
                if po["name"] not in recorded_sub_sources:
                    amt = flt(po.get("grand_total", 0.0))
                    subcontractor_cost += amt
                    recorded_sub_sources.add(po["name"])
                    ledger_lines.append({
                        "category": "subcontractor",
                        "source_doctype": "Purchase Order",
                        "source_name": po["name"],
                        "description": f"Vendor Purchase Order: {po.get('supplier', 'Vendor')}",
                        "amount": amt,
                        "date": str(po.get("transaction_date") or ""),
                    })

    # EE Subcontract Job integration
    if frappe.db.table_exists("EE Subcontract Job"):
        sub_jobs = frappe.db.get_all(
            "EE Subcontract Job",
            filters={"booking": booking_name, "status": ["in", ["accepted", "completed"]]},
            fields=["name", "vendor", "agreed_cost", "purchase_invoice"],
        )
        for sj in sub_jobs:
            # Only count if purchase invoice was not already counted above
            if not sj.get("purchase_invoice") or sj["purchase_invoice"] not in recorded_sub_sources:
                cost = flt(sj.get("agreed_cost", 0.0))
                if cost > 0 and sj["name"] not in recorded_sub_sources:
                    subcontractor_cost += cost
                    recorded_sub_sources.add(sj["name"])
                    ledger_lines.append({
                        "category": "subcontractor",
                        "source_doctype": "EE Subcontract Job",
                        "source_name": sj["name"],
                        "description": f"Subcontracted Partner Service: {sj.get('vendor', 'Partner')}",
                        "amount": cost,
                        "date": str(getattr(booking, "event_date", "")),
                    })

    # -------------------------------------------------------------------------
    # 4. Consumable Stock Depletion Rollup
    # -------------------------------------------------------------------------
    consumable_cost = 0.0

    if frappe.db.table_exists("Stock Entry") and frappe.db.table_exists("Stock Entry Detail"):
        se_filters = {"purpose": "Material Issue", "docstatus": 1}
        entries = []
        if cost_center_name:
            entries = frappe.db.get_all(
                "Stock Entry Detail",
                filters={"cost_center": cost_center_name},
                fields=["name", "parent", "item_code", "qty", "valuation_rate", "amount"],
            )
        elif project_name and frappe.get_meta("Stock Entry Detail").has_field("project"):
            entries = frappe.db.get_all(
                "Stock Entry Detail",
                filters={"project": project_name},
                fields=["name", "parent", "item_code", "qty", "valuation_rate", "amount"],
            )

        for se in entries:
            amt = flt(se.get("amount")) or flt(flt(se.get("qty", 0.0)) * flt(se.get("valuation_rate", 0.0)), 2)
            consumable_cost += amt
            ledger_lines.append({
                "category": "consumable",
                "source_doctype": "Stock Entry Detail",
                "source_name": se["name"],
                "description": f"Consumable Material Issue: {se.get('item_code')} (qty: {se.get('qty')})",
                "amount": amt,
                "date": str(getattr(booking, "event_date", "")),
            })

    # -------------------------------------------------------------------------
    # 5. Equipment Wear & Amortization
    # -------------------------------------------------------------------------
    equipment_wear_cost = 0.0
    assigned_assets = getattr(booking, "assigned_assets", []) or []

    # Calculate duration in hours
    duration_hours = 4.0
    if getattr(booking, "start_time", None) and getattr(booking, "end_time", None):
        try:
            from frappe.utils import time_diff_in_hours
            diff = time_diff_in_hours(str(booking.end_time), str(booking.start_time))
            if diff > 0:
                duration_hours = flt(diff, 2)
        except Exception:
            duration_hours = 4.0

    for asset_row in assigned_assets:
        asset_code = getattr(asset_row, "asset", None) or getattr(asset_row, "item_code", None)
        wear_rate = 15.0  # Default wear surcharge per gig ($15/gig or $3.75/hr)
        if asset_code and frappe.db.table_exists("Item"):
            item_wear = frappe.db.get_value("Item", asset_code, "ee_wear_rate_hourly")
            if item_wear:
                wear_rate = flt(item_wear) * duration_hours

        equipment_wear_cost += flt(wear_rate, 2)
        ledger_lines.append({
            "category": "equipment_wear",
            "source_doctype": "Event Booking Asset",
            "source_name": getattr(asset_row, "name", "Asset"),
            "description": f"Equipment Wear Amortization: {asset_code or 'Assigned Gear'}",
            "amount": flt(wear_rate, 2),
            "date": str(getattr(booking, "event_date", "")),
        })

    # -------------------------------------------------------------------------
    # 6. Payment Gateway Processing Fees
    # -------------------------------------------------------------------------
    gateway_fees = 0.0

    if frappe.db.table_exists("Payment Entry"):
        pes = []
        if invoiced_revenue > 0:
            # Query payment entries referencing the sales invoices
            pes = frappe.db.get_all(
                "Payment Entry Reference",
                filters={"reference_name": ["in", [l["source_name"] for l in ledger_lines if l["source_doctype"] == "Sales Invoice"]]},
                fields=["parent", "allocated_amount"],
            )

        if pes:
            for pe_ref in pes:
                # Standard card processing fee calculation: 2.9% + $0.30 per captured settlement
                paid_amt = flt(pe_ref.get("allocated_amount", 0.0))
                if paid_amt > 0:
                    calculated_fee = flt(paid_amt * 0.029 + 0.30, 2)
                    gateway_fees += calculated_fee
                    ledger_lines.append({
                        "category": "gateway_fee",
                        "source_doctype": "Payment Entry",
                        "source_name": pe_ref["parent"],
                        "description": f"Card Processing Fee (2.9% + $0.30) on Payment {pe_ref['parent']}",
                        "amount": calculated_fee,
                        "date": str(getattr(booking, "event_date", "")),
                    })
        elif gross_revenue > 0 and getattr(booking, "deposit_status", None) == "paid":
            # If deposit is paid but no specific Payment Entry found, capture fee on deposit
            dep_amt = flt(getattr(booking, "deposit_amount", 0.0)) or flt(gross_revenue * 0.5)
            dep_fee = flt(dep_amt * 0.029 + 0.30, 2)
            gateway_fees += dep_fee
            ledger_lines.append({
                "category": "gateway_fee",
                "source_doctype": "Event Booking",
                "source_name": booking_name,
                "description": f"Deposit Processing Fee (2.9% + $0.30 on ${dep_amt})",
                "amount": dep_fee,
                "date": str(getattr(booking, "event_date", "")),
            })

    # -------------------------------------------------------------------------
    # 7. Net Profit, Margin % and Health Status
    # -------------------------------------------------------------------------
    total_cogs = flt(
        labor_cost
        + subcontractor_cost
        + consumable_cost
        + equipment_wear_cost
        + gateway_fees,
        2,
    )
    net_profit = flt(gross_revenue - total_cogs, 2)

    if gross_revenue > 0:
        margin_percent = flt((net_profit / gross_revenue) * 100.0, 2)
    else:
        margin_percent = 0.0 if total_cogs == 0 else -100.0

    target_margin = flt(getattr(booking, "target_margin_percent", None)) or 40.0
    low_thresh = 25.0
    if frappe.db.table_exists("EE Portal Settings"):
        low_thresh = flt(frappe.db.get_single_value("EE Portal Settings", "low_margin_warning_threshold") or 25.0)

    if margin_percent >= target_margin:
        margin_status = "healthy"
    elif margin_percent >= low_thresh:
        margin_status = "warning"
    else:
        margin_status = "critical"

    # Persist or update Event Cost Sheet
    sheet_name = getattr(booking, "cost_sheet", None)
    if not sheet_name or not frappe.db.exists("Event Cost Sheet", sheet_name):
        sheet_name = frappe.db.get_value("Event Cost Sheet", {"event_booking": booking_name}, "name")

    sheet_doc = None
    if sheet_name:
        sheet_doc = frappe.get_doc("Event Cost Sheet", sheet_name)
    else:
        sheet_doc = frappe.new_doc("Event Cost Sheet")
        sheet_doc.event_booking = booking_name

    sheet_doc.cost_center = cost_center_name
    sheet_doc.project = project_name
    sheet_doc.gross_revenue = gross_revenue
    sheet_doc.labor_cost = flt(labor_cost, 2)
    sheet_doc.subcontractor_cost = flt(subcontractor_cost, 2)
    sheet_doc.consumable_cost = flt(consumable_cost, 2)
    sheet_doc.equipment_wear_cost = flt(equipment_wear_cost, 2)
    sheet_doc.gateway_fees = flt(gateway_fees, 2)
    sheet_doc.total_cogs = total_cogs
    sheet_doc.net_profit = net_profit
    sheet_doc.margin_percent = margin_percent
    sheet_doc.target_margin_percent = target_margin
    sheet_doc.margin_status = margin_status
    sheet_doc.details_json = json.dumps(ledger_lines)
    sheet_doc.last_recomputed_at = now_datetime()
    sheet_doc.save(ignore_permissions=True)

    if getattr(booking, "cost_sheet", None) != sheet_doc.name:
        frappe.db.set_value("Event Booking", booking_name, "cost_sheet", sheet_doc.name, update_modified=False)

    return {
        "cost_sheet": sheet_doc.name,
        "event_booking": booking_name,
        "gross_revenue": gross_revenue,
        "labor_cost": flt(labor_cost, 2),
        "subcontractor_cost": flt(subcontractor_cost, 2),
        "consumable_cost": flt(consumable_cost, 2),
        "equipment_wear_cost": flt(equipment_wear_cost, 2),
        "gateway_fees": flt(gateway_fees, 2),
        "total_cogs": total_cogs,
        "net_profit": net_profit,
        "margin_percent": margin_percent,
        "target_margin_percent": target_margin,
        "margin_status": margin_status,
        "ledger_lines": ledger_lines,
    }
