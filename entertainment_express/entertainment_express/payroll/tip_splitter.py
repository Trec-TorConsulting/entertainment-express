# Copyright (c) 2026, Trec-Tor Consulting and contributors
"""Post-event digital tip pool distribution algorithms."""

from __future__ import annotations

import frappe
from frappe.utils import flt, now_datetime


def distribute_booking_tips(
    booking_id: str,
    tip_pool_amount: float | None = None,
    policy: str | None = None,
    assigned_crew: list[dict] | None = None,
) -> dict:
    """Distributes customer gratuities across event crew based on chosen policy.
    
    Supported policies:
    - 'equal': Equal division among all present crew members.
    - 'hours_weighted': Proportional division based on hours on shift.
    - 'lead_weighted': Event Lead receives 1.5x weight; assistants receive 1.0x.
    """
    # 1. Fetch or create Tip Distribution document
    dist_doc = None
    if hasattr(frappe.db, "get_value"):
        dist_name = frappe.db.get_value("Tip Distribution", {"event_booking": booking_id}, "name")
        if dist_name:
            dist_doc = frappe.get_doc("Tip Distribution", dist_name)

    if not dist_doc and hasattr(frappe, "get_doc"):
        dist_doc = frappe.get_doc(
            {
                "doctype": "Tip Distribution",
                "event_booking": booking_id,
                "total_tip_pool": 0.0,
                "allocation_policy": policy or "equal",
                "status": "accruing",
                "allocation_lines": [],
            }
        )

    # Resolve pool amount
    if tip_pool_amount is not None:
        dist_doc.total_tip_pool = flt(tip_pool_amount)
    elif not dist_doc.total_tip_pool and hasattr(frappe, "get_doc"):
        # Check booking for tip amount if not already set
        try:
            bk = frappe.get_doc("Event Booking", booking_id)
            dist_doc.total_tip_pool = flt(getattr(bk, "tip_amount", 0.0) or getattr(bk, "gratuity", 0.0))
        except Exception:
            pass

    total_pool = flt(dist_doc.total_tip_pool)
    active_policy = policy or getattr(dist_doc, "allocation_policy", "equal") or "equal"
    dist_doc.allocation_policy = active_policy

    # 2. Resolve eligible crew members
    crew_list: list[dict] = []
    if assigned_crew is not None:
        crew_list = list(assigned_crew)
    elif hasattr(frappe, "get_all"):
        try:
            # Query Staff Assignment for confirmed crew
            assignments = frappe.get_all(
                "Staff Assignment",
                filters={"booking": booking_id, "status": ["in", ["confirmed", "completed", "accepted"]]},
                fields=["worker", "worker_name", "role", "is_lead", "hours"],
            )
            for a in assignments:
                crew_list.append(
                    {
                        "worker": a.worker,
                        "worker_name": getattr(a, "worker_name", a.worker),
                        "role": getattr(a, "role", "Crew"),
                        "is_lead": bool(getattr(a, "is_lead", False)),
                        "hours": flt(getattr(a, "hours", 4.0)) or 4.0,
                    }
                )
        except Exception:
            pass

    if not crew_list:
        return {
            "booking": booking_id,
            "total_tip_pool": total_pool,
            "policy": active_policy,
            "allocations": [],
            "message": "No eligible crew members assigned to this booking.",
        }

    # 3. Calculate shares according to policy
    allocations: list[dict] = []
    n_crew = len(crew_list)

    if total_pool <= 0:
        # Zero tip pool
        for m in crew_list:
            allocations.append(
                {
                    "worker": m["worker"],
                    "worker_name": m.get("worker_name", m["worker"]),
                    "role": m.get("role", "Crew"),
                    "is_lead": m.get("is_lead", False),
                    "hours_worked": m.get("hours", 0.0),
                    "split_percentage": round(100.0 / n_crew, 2),
                    "allocated_amount": 0.0,
                }
            )

    elif active_policy == "equal":
        even_share = round(total_pool / n_crew, 2)
        even_pct = round(100.0 / n_crew, 2)
        accumulated = 0.0
        for i, m in enumerate(crew_list):
            amt = even_share if i < n_crew - 1 else round(total_pool - accumulated, 2)
            accumulated += amt
            allocations.append(
                {
                    "worker": m["worker"],
                    "worker_name": m.get("worker_name", m["worker"]),
                    "role": m.get("role", "Crew"),
                    "is_lead": m.get("is_lead", False),
                    "hours_worked": m.get("hours", 0.0),
                    "split_percentage": even_pct,
                    "allocated_amount": amt,
                }
            )

    elif active_policy == "hours_weighted":
        total_hours = sum(flt(m.get("hours", 0.0)) for m in crew_list)
        if total_hours <= 0:
            total_hours = float(n_crew)
            for m in crew_list:
                m["hours"] = 1.0

        accumulated = 0.0
        for i, m in enumerate(crew_list):
            hrs = flt(m.get("hours", 1.0))
            ratio = hrs / total_hours
            pct = round(ratio * 100.0, 2)
            amt = round(total_pool * ratio, 2) if i < n_crew - 1 else round(total_pool - accumulated, 2)
            accumulated += amt
            allocations.append(
                {
                    "worker": m["worker"],
                    "worker_name": m.get("worker_name", m["worker"]),
                    "role": m.get("role", "Crew"),
                    "is_lead": m.get("is_lead", False),
                    "hours_worked": hrs,
                    "split_percentage": pct,
                    "allocated_amount": amt,
                }
            )

    elif active_policy == "lead_weighted":
        # Event Lead gets 1.5 multiplier
        weights = [1.5 if m.get("is_lead") or "lead" in str(m.get("role", "")).lower() else 1.0 for m in crew_list]
        total_weight = sum(weights)

        accumulated = 0.0
        for i, (m, wt) in enumerate(zip(crew_list, weights)):
            ratio = wt / total_weight
            pct = round(ratio * 100.0, 2)
            amt = round(total_pool * ratio, 2) if i < n_crew - 1 else round(total_pool - accumulated, 2)
            accumulated += amt
            allocations.append(
                {
                    "worker": m["worker"],
                    "worker_name": m.get("worker_name", m["worker"]),
                    "role": m.get("role", "Crew"),
                    "is_lead": m.get("is_lead", False),
                    "hours_worked": m.get("hours", 0.0),
                    "split_percentage": pct,
                    "allocated_amount": amt,
                }
            )

    # Update doc
    if hasattr(dist_doc, "set"):
        dist_doc.set("allocation_lines", [])
        for row in allocations:
            dist_doc.append("allocation_lines", row)
    else:
        dist_doc.allocation_lines = allocations

    if hasattr(dist_doc, "save"):
        try:
            if hasattr(dist_doc, "is_new") and dist_doc.is_new():
                dist_doc.insert(ignore_permissions=True)
            else:
                dist_doc.save(ignore_permissions=True)
            if hasattr(frappe.db, "commit"):
                frappe.db.commit()
        except Exception:
            pass

    return {
        "booking": booking_id,
        "total_tip_pool": total_pool,
        "policy": active_policy,
        "crew_count": len(crew_list),
        "allocations": allocations,
    }


def lock_tip_distribution(booking_id: str) -> dict:
    """Locks the tip distribution for an event, preventing further dynamic changes prior to payroll run."""
    dist_name = frappe.db.get_value("Tip Distribution", {"event_booking": booking_id}, "name")
    if not dist_name:
        frappe.throw(f"No tip distribution found for booking {booking_id}.")

    doc = frappe.get_doc("Tip Distribution", dist_name)
    doc.status = "locked"
    doc.locked_at = now_datetime()
    doc.save(ignore_permissions=True)
    if hasattr(frappe.db, "commit"):
        frappe.db.commit()

    return {
        "distribution_id": doc.name,
        "booking": doc.event_booking,
        "status": doc.status,
        "total_tip_pool": doc.total_tip_pool,
        "locked_at": doc.locked_at,
    }
