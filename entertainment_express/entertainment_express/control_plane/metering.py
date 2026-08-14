"""Append-only usage metering."""

from __future__ import annotations

import frappe
from frappe.utils import get_first_day, get_last_day, today, getdate


def collect_local_metrics() -> dict:
    """Run on a tenant site. Returns sanctioned counts only — no PII."""
    start = get_first_day(today())
    end = get_last_day(today())
    bookings = frappe.db.count(
        "Event Booking",
        {"event_date": ["between", [start, end]], "status": ["not in", ["canceled"]]},
    )
    users = frappe.db.count("User", {"enabled": 1, "user_type": "System User"})
    sms = 0
    if frappe.db.exists("DocType", "Notification Log"):
        sms = frappe.db.count(
            "Notification Log",
            {"channel": "sms", "creation": [">=", str(start)], "status": ["in", ["sent", "delivered"]]},
        )
    return {
        "active_users": users,
        "bookings": bookings,
        "sms_sent": sms,
        "ai_calls": 0,
        "storage_gb": 0,
        "period_start": str(getdate(start)),
        "period_end": str(getdate(end)),
    }


def record_usage(tenant: str, metrics: dict):
    for metric, qty in metrics.items():
        if metric.startswith("period_"):
            continue
        frappe.get_doc(
            {
                "doctype": "Usage Record",
                "tenant": tenant,
                "metric": metric,
                "period_start": metrics["period_start"],
                "period_end": metrics["period_end"],
                "quantity": qty,
            }
        ).insert()
    frappe.db.commit()
