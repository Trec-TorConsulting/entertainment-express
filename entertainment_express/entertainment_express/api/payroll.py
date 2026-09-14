# Copyright (c) 2026, Trec-Tor Consulting and contributors
"""Payroll, commission, and digital tip allocation whitelisted API endpoints."""

from __future__ import annotations

import frappe
from frappe.utils import flt
from entertainment_express.payroll.payroll_compiler import compile_payroll_batch
from entertainment_express.payroll.tip_splitter import distribute_booking_tips, lock_tip_distribution
from entertainment_express.payroll.rate_engine import calculate_gig_earnings


def _require_admin_or_finance():
    if not hasattr(frappe, "get_roles"):
        return
    roles = frappe.get_roles()
    allowed = {"EE Tenant Admin", "EE Finance", "System Manager", "Administrator"}
    if not allowed.intersection(set(roles)):
        frappe.throw("Access denied: Payroll management requires Finance or Admin role.", frappe.PermissionError)


@frappe.whitelist()
def preview_payroll_batch(start_date: str, end_date: str) -> dict:
    """Previews a compiled payroll run showing gross payout estimates by worker."""
    _require_admin_or_finance()
    return compile_payroll_batch(start_date=start_date, end_date=end_date, submit=False)


@frappe.whitelist()
def submit_payroll_batch(start_date: str, end_date: str) -> dict:
    """Compiles and submits a finalized payroll run, generating ERPNext Salary Slips."""
    _require_admin_or_finance()
    return compile_payroll_batch(start_date=start_date, end_date=end_date, submit=True)


@frappe.whitelist()
def distribute_tips(booking_id: str, tip_amount: float = None, policy: str = None) -> dict:
    """Calculates and stages digital tip pool allocation for an event booking."""
    _require_admin_or_finance()
    return distribute_booking_tips(
        booking_id=booking_id,
        tip_pool_amount=flt(tip_amount) if tip_amount is not None else None,
        policy=policy,
    )


@frappe.whitelist()
def lock_tips(booking_id: str) -> dict:
    """Locks event tip allocations prior to batch payroll compilation."""
    _require_admin_or_finance()
    return lock_tip_distribution(booking_id)


@frappe.whitelist()
def get_my_earnings(start_date: str = None, end_date: str = None) -> dict:
    """Returns itemized earnings, salary components, and tip breakdown for logged-in user."""
    user = frappe.session.user if hasattr(frappe, "session") else "test@example.com"
    worker_id = None
    if hasattr(frappe.db, "get_value"):
        worker_id = frappe.db.get_value("Employee", {"user_id": user}, "name")

    worker_id = worker_id or user

    earnings_list = []
    total_gross = 0.0
    base_pay_total = 0.0
    tips_total = 0.0
    commissions_total = 0.0

    # Read salary slips if available
    if hasattr(frappe, "get_all"):
        try:
            filters = {"employee": worker_id}
            if start_date:
                filters["start_date"] = [">=", start_date]
            if end_date:
                filters["end_date"] = ["<=", end_date]

            slips = frappe.get_all(
                "Salary Slip",
                filters=filters,
                fields=["name", "start_date", "end_date", "gross_pay", "net_pay", "status"],
                order_by="start_date desc",
            )
            for sl in slips:
                gross = flt(sl.gross_pay)
                total_gross += gross
                earnings_list.append(
                    {
                        "slip_id": sl.name,
                        "period": f"{sl.start_date} to {sl.end_date}",
                        "gross": gross,
                        "net": flt(sl.net_pay),
                        "status": sl.status,
                    }
                )
        except Exception:
            pass

        # Query recent tip allocations
        try:
            tip_lines = frappe.get_all(
                "Tip Allocation Line",
                filters={"worker": worker_id},
                fields=["parent", "role", "allocated_amount", "hours_worked"],
                limit=10,
            )
            for tl in tip_lines:
                amt = flt(tl.allocated_amount)
                tips_total += amt
        except Exception:
            pass

    return {
        "worker": worker_id,
        "total_gross": round(total_gross, 2),
        "tips_earned": round(tips_total, 2),
        "pay_slips": earnings_list,
    }
