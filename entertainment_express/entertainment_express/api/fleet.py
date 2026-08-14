"""Operator fleet dashboard."""

from __future__ import annotations

import frappe
from frappe.utils import flt

from entertainment_express.security.access import require_roles


@frappe.whitelist()
def fleet_dashboard() -> dict:
    require_roles("SaaS Operator", "System Manager")
    tenants = frappe.get_all(
        "Tenant",
        fields=["name", "company_name", "status", "plan", "site_name", "primary_email", "activated_on"],
    )
    rows = []
    mrr = 0.0
    for t in tenants:
        sub = frappe.db.get_value(
            "Subscription",
            {"tenant": t.name},
            ["status", "mrr", "current_period_end"],
            as_dict=True,
        ) or {}
        failed_jobs = frappe.db.count("Provisioning Job", {"tenant": t.name, "state": "failed"})
        row = {
            **t,
            "subscription_status": sub.get("status"),
            "mrr": flt(sub.get("mrr")),
            "period_end": sub.get("current_period_end"),
            "failed_jobs": failed_jobs,
        }
        mrr += row["mrr"]
        rows.append(row)
    return {
        "tenants": rows,
        "tenant_count": len(rows),
        "active": sum(1 for r in rows if r["status"] == "active"),
        "suspended": sum(1 for r in rows if r["status"] == "suspended"),
        "mrr": mrr,
    }
