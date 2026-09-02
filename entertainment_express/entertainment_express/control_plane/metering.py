"""Append-only usage metering. Collection on a tenant site; records on control plane."""

from __future__ import annotations

import json
import os
import subprocess

import frappe
from frappe.utils import flt, get_first_day, get_last_day, getdate, today

from entertainment_express.control_plane.entitlements import entitlement_map_for_plan, is_control_plane


def collect_local_metrics() -> dict:
    """Run on a tenant site. Returns sanctioned counts only — no PII, no tenant arg."""
    start = get_first_day(today())
    end = get_last_day(today())
    bookings = 0
    if frappe.db.exists("DocType", "Event Booking"):
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
    ai_calls = 0
    if frappe.db.exists("DocType", "EE AI Call"):
        ai_calls = frappe.db.count("EE AI Call", {"creation": [">=", str(start)]})
    storage_gb = 0.0
    if frappe.db.exists("DocType", "File"):
        try:
            row = frappe.db.sql("select coalesce(sum(file_size), 0) from `tabFile`")[0][0]
            storage_gb = round(flt(row) / (1024 ** 3), 4)
        except Exception:
            storage_gb = 0.0
    data = {
        "active_users": int(users or 0),
        "bookings": int(bookings or 0),
        "sms_sent": int(sms or 0),
        "ai_calls": int(ai_calls or 0),
        "storage_gb": storage_gb,
        "period_start": str(getdate(start)),
        "period_end": str(getdate(end)),
    }
    print("EE_METRICS:" + json.dumps(data))
    return data


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


def collect_all_tenants() -> dict:
    """Control plane only. Never called from a tenant request."""
    if not is_control_plane():
        return {"skipped": True}
    if not frappe.db.table_exists("Tenant"):
        return {"tenants": 0}
    recorded = 0
    for row in frappe.get_all(
        "Tenant",
        filters={"status": ["in", ["active", "suspended"]]},
        fields=["name", "site_name", "plan"],
    ):
        if not row.site_name:
            continue
        metrics = _collect_via_bench(row.site_name)
        if not metrics:
            continue
        record_usage(row.name, metrics)
        _maybe_overage(row.name, row.plan, metrics)
        recorded += 1
    return {"tenants": recorded}


def _collect_via_bench(site_name: str) -> dict | None:
    bench_root = os.environ.get("FRAPPE_BENCH_ROOT", "/home/frappe/frappe-bench")
    try:
        result = subprocess.run(
            [
                "bench",
                "--site",
                site_name,
                "execute",
                "entertainment_express.control_plane.metering.collect_local_metrics",
            ],
            cwd=bench_root,
            capture_output=True,
            text=True,
            timeout=120,
        )
    except Exception:
        frappe.log_error(frappe.get_traceback(), "EE metering collect")
        return None
    for line in (result.stdout or "").splitlines():
        if line.startswith("EE_METRICS:"):
            try:
                return json.loads(line[len("EE_METRICS:") :])
            except Exception:
                return None
    return None


def _maybe_overage(tenant: str, plan_name: str, metrics: dict) -> None:
    if not plan_name:
        return
    allow = frappe.db.get_value("Plan", plan_name, "allow_overages")
    price = frappe.db.get_value("Plan", plan_name, "stripe_usage_price")
    if not allow or not price:
        return
    ents = entitlement_map_for_plan(plan_name)
    metric_map = {
        "bookings": "max_bookings_per_month",
        "active_users": "max_staff_users",
        "sms_sent": "sms_limit",
        "ai_calls": "ai_calls_limit",
        "storage_gb": "storage_gb_limit",
    }
    for metric, feature in metric_map.items():
        raw = ents.get(feature)
        if raw in (None, "unlimited"):
            continue
        try:
            limit = int(raw)
        except (TypeError, ValueError):
            continue
        qty = flt(metrics.get(metric))
        overage = qty - limit
        if overage <= 0:
            continue
        _report_stripe_usage(price, overage, tenant, metric)


def _report_stripe_usage(price_id: str, quantity: float, tenant: str, metric: str) -> None:
    key = os.environ.get("EE_STRIPE_SECRET_KEY")
    if not key or not key.startswith("sk_"):
        return
    try:
        import stripe

        stripe.api_key = key
        sub_id = frappe.db.get_value("Subscription", {"tenant": tenant}, "provider_subscription_id")
        if not sub_id:
            return
        stripe.UsageRecord.create(quantity=int(quantity), timestamp="now", action="increment", subscription_item=price_id)
    except Exception:
        frappe.log_error(frappe.get_traceback(), f"EE overage {tenant} {metric}")
