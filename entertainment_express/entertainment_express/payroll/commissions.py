# Copyright (c) 2026, Trec-Tor Consulting and contributors
"""Automated sales and booking commission accruals on customer invoice payments."""

from __future__ import annotations

import frappe
from frappe.utils import flt, now_datetime


def get_commission_rule(agent_id: str | None = None) -> any:
    """Finds the applicable Commission Rule for an agent, or fallback to global rule."""
    if not hasattr(frappe, "db") or not hasattr(frappe.db, "get_value"):
        return None

    # 1. Specific agent rule
    if agent_id:
        rule_name = frappe.db.get_value(
            "Commission Rule",
            {"agent": agent_id, "is_active": 1},
            "name",
        )
        if rule_name:
            return frappe.get_doc("Commission Rule", rule_name)

    # 2. Global rule (agent is None or empty)
    rule_name = frappe.db.get_value(
        "Commission Rule",
        {"agent": ["in", [None, ""]], "is_active": 1},
        "name",
    )
    if rule_name:
        return frappe.get_doc("Commission Rule", rule_name)

    # 3. Fallback to any active rule
    rule_name = frappe.db.get_value(
        "Commission Rule",
        {"is_active": 1},
        "name",
    )
    if rule_name:
        return frappe.get_doc("Commission Rule", rule_name)

    return None


def accrue_booking_commission(invoice: any, booking_id: str | None = None) -> dict:
    """Calculates and accrues sales commission when a customer invoice is paid.
    
    Evaluates percent_gross, percent_profit, and flat_per_booking policies.
    """
    booking_name = getattr(invoice, "booking", None) or booking_id
    if not booking_name and isinstance(invoice, dict):
        booking_name = invoice.get("booking")

    grand_total = flt(getattr(invoice, "grand_total", 0.0) or getattr(invoice, "total_amount", 0.0) or (
        invoice.get("grand_total") if isinstance(invoice, dict) else 0.0
    ))

    # Resolve booking and agent
    agent = None
    net_profit = None

    if booking_name and hasattr(frappe, "get_doc"):
        try:
            booking = frappe.get_doc("Event Booking", booking_name)
            agent = getattr(booking, "sales_agent", None) or getattr(booking, "owner", None)
            if not grand_total:
                grand_total = flt(getattr(booking, "grand_total", 0.0) or getattr(booking, "total_amount", 0.0))

            # Attempt to read profit from Job Costing / Event P&L if available
            if hasattr(booking, "projected_margin") or hasattr(booking, "actual_margin"):
                net_profit = flt(getattr(booking, "actual_margin", None) or getattr(booking, "projected_margin", 0.0))
        except Exception:
            pass

    if not agent:
        agent = getattr(invoice, "sales_partner", None) or (
            invoice.get("sales_partner") if isinstance(invoice, dict) else None
        )

    rule = get_commission_rule(agent)
    if not rule:
        return {
            "accrued": False,
            "reason": "No active commission rule found",
            "agent": agent,
            "commission_amount": 0.0,
        }

    comm_type = getattr(rule, "commission_type", "percent_gross")
    rate_val = flt(getattr(rule, "rate_value", 0.0))
    commission_amount = 0.0

    if comm_type == "percent_gross":
        commission_amount = grand_total * (rate_val / 100.0)

    elif comm_type == "percent_profit":
        # If profit isn't computed, estimate 40% margin baseline
        profit_base = net_profit if net_profit is not None else (grand_total * 0.4)
        profit_base = max(0.0, profit_base)
        commission_amount = profit_base * (rate_val / 100.0)

    elif comm_type == "flat_per_booking":
        commission_amount = rate_val

    commission_amount = round(commission_amount, 2)

    return {
        "accrued": True,
        "rule_name": getattr(rule, "name", "Default Rule"),
        "commission_type": comm_type,
        "rate_value": rate_val,
        "agent": agent,
        "booking": booking_name,
        "base_amount": grand_total,
        "commission_amount": commission_amount,
        "accrued_at": now_datetime(),
    }


def clawback_booking_commission(
    invoice: any,
    refund_amount: float,
    booking_id: str | None = None,
) -> dict:
    """Calculates proportional commission clawback when an event invoice is refunded."""
    refund_amount = flt(refund_amount)
    total = flt(getattr(invoice, "grand_total", 0.0) or (
        invoice.get("grand_total") if isinstance(invoice, dict) else 0.0
    ))

    # Base accrual on original amount
    accrual = accrue_booking_commission(invoice, booking_id=booking_id)
    if not accrual.get("accrued") or accrual.get("commission_amount", 0.0) <= 0:
        return {"clawback": 0.0, "reason": "No commission accrued on invoice"}

    orig_comm = accrual["commission_amount"]
    clawback = 0.0
    if total > 0:
        ratio = min(1.0, refund_amount / total)
        clawback = round(orig_comm * ratio, 2)
    else:
        clawback = orig_comm

    return {
        "accrued": True,
        "agent": accrual.get("agent"),
        "booking": accrual.get("booking"),
        "refund_amount": refund_amount,
        "original_commission": orig_comm,
        "clawback_amount": clawback,
        "net_commission": round(orig_comm - clawback, 2),
    }
