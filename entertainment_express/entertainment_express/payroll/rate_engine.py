# Copyright (c) 2026, Trec-Tor Consulting and contributors
"""Gig rate calculation engine for tiered event worker compensation."""

from __future__ import annotations

import frappe
from frappe.utils import cint, flt


def get_rate_card(role: str, event_type: str | None = None) -> any:
    """Finds the best matching active Gig Rate Card for a worker's role and event type."""
    if not hasattr(frappe, "db") or not hasattr(frappe.db, "get_value"):
        return None

    # 1. Exact match on role and event_type
    if event_type:
        card_name = frappe.db.get_value(
            "Gig Rate Card",
            {"role": role, "event_type": event_type, "is_active": 1},
            "name",
        )
        if card_name:
            return frappe.get_doc("Gig Rate Card", card_name)

    # 2. Universal match for role (where event_type is empty or 'All')
    for evt in ["All", "", None]:
        card_name = frappe.db.get_value(
            "Gig Rate Card",
            {"role": role, "event_type": evt, "is_active": 1},
            "name",
        )
        if card_name:
            return frappe.get_doc("Gig Rate Card", card_name)

    # 3. Fallback to any active card for this role
    card_name = frappe.db.get_value(
        "Gig Rate Card",
        {"role": role, "is_active": 1},
        "name",
    )
    if card_name:
        return frappe.get_doc("Gig Rate Card", card_name)

    return None


def calculate_gig_earnings(
    assignment: any,
    timesheet: any = None,
    rate_card: any = None,
) -> dict:
    """Calculates worker base pay, overtime, and gross pay for an event shift.
    
    Supports flat_fee, hourly, and flat_plus_hourly calculation models.
    """
    # Extract assignment properties
    worker = getattr(assignment, "worker", None) or getattr(assignment, "employee", None) or (
        assignment.get("worker") if isinstance(assignment, dict) else "WORKER-001"
    )
    role = getattr(assignment, "role", None) or (
        assignment.get("role") if isinstance(assignment, dict) else "Entertainer"
    )
    event_type = getattr(assignment, "event_type", None) or (
        assignment.get("event_type") if isinstance(assignment, dict) else None
    )

    # Extract hours worked
    hours = 0.0
    if timesheet:
        if isinstance(timesheet, (int, float)):
            hours = float(timesheet)
        elif hasattr(timesheet, "total_hours"):
            hours = flt(timesheet.total_hours)
        elif isinstance(timesheet, dict):
            hours = flt(timesheet.get("total_hours") or timesheet.get("hours", 0))

    # If hours not provided, look on assignment
    if hours <= 0:
        assign_hours = getattr(assignment, "hours", None) or (
            assignment.get("hours") if isinstance(assignment, dict) else 0
        )
        hours = flt(assign_hours)

    # Locate rate card if not provided
    if not rate_card and role:
        rate_card = get_rate_card(role, event_type)

    if rate_card:
        calc_type = getattr(rate_card, "calculation_type", "flat_fee")
        base_rate = flt(getattr(rate_card, "base_rate", 0.0))
        std_hours = flt(getattr(rate_card, "standard_duration_hours", 4.0)) or 4.0
        ot_rate = flt(getattr(rate_card, "overtime_rate", 0.0))
        card_name = getattr(rate_card, "name", "Rate Card")

        if calc_type == "flat_fee":
            base_pay = base_rate
            if ot_rate > 0 and hours > std_hours:
                overtime_hours = hours - std_hours
                overtime_pay = overtime_hours * ot_rate
            else:
                overtime_pay = 0.0

        elif calc_type == "hourly":
            if ot_rate <= 0:
                ot_rate = base_rate * 1.5

            if hours <= std_hours:
                base_pay = hours * base_rate
                overtime_pay = 0.0
            else:
                base_pay = std_hours * base_rate
                overtime_hours = hours - std_hours
                overtime_pay = overtime_hours * ot_rate

        elif calc_type == "flat_plus_hourly":
            base_pay = base_rate
            if hours > std_hours:
                overtime_hours = hours - std_hours
                effective_ot = ot_rate if ot_rate > 0 else base_rate
                overtime_pay = overtime_hours * effective_ot
            else:
                overtime_pay = 0.0
        else:
            base_pay = base_rate
            overtime_pay = 0.0

    else:
        # Fallback to direct assignment rate or agreed cost
        agreed_rate = flt(getattr(assignment, "rate", 0.0) or getattr(assignment, "agreed_cost", 0.0) or (
            assignment.get("rate", 0.0) if isinstance(assignment, dict) else 0.0
        ))
        calc_type = "manual_agreed"
        card_name = "None"
        if hours > 0 and agreed_rate > 0:
            base_pay = hours * agreed_rate
        else:
            base_pay = agreed_rate
        overtime_pay = 0.0

    gross_pay = round(base_pay + overtime_pay, 2)

    return {
        "worker": worker,
        "role": role,
        "hours_worked": round(hours, 2),
        "rate_card": card_name,
        "calculation_type": calc_type,
        "base_pay": round(base_pay, 2),
        "overtime_pay": round(overtime_pay, 2),
        "gross_pay": gross_pay,
    }
