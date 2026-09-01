"""SaaS operator fleet snapshot. Control-plane DocTypes only. Never opens another site."""

from __future__ import annotations

import csv
import io
from datetime import date

import frappe
from frappe.utils import flt, fmt_money, getdate

OPS = {"SaaS Operator", "System Manager"}
GUEST_ROLE = "EE Event Guest"


def _roles() -> set[str]:
    return set(frappe.get_roles() or [])


def _require_ops() -> None:
    user = getattr(getattr(frappe, "session", None), "user", "") or ""
    if user in ("Guest", "guest"):
        frappe.throw("Not allowed.", frappe.PermissionError)
    if GUEST_ROLE in _roles():
        frappe.throw("Not allowed.", frappe.PermissionError)
    if not _roles().intersection(OPS):
        frappe.throw("Fleet access denied.", frappe.PermissionError)


def _money(amount) -> str:
    return fmt_money(flt(amount), currency=frappe.db.get_default("currency") or "USD")


def _month_start(today=None):
    day = getdate(today) if today else getdate()
    return date(day.year, day.month, 1)


@frappe.whitelist()
def fleet() -> dict:
    _require_ops()
    empty = {
        "mrr": _money(0),
        "active_tenants": 0,
        "signups_this_month": 0,
        "churn_this_month": "0 canceled",
        "usage": [],
    }
    if not getattr(frappe.db, "table_exists", lambda *_: False)("Tenant"):
        return empty
    active = frappe.db.count("Tenant", {"status": "active"}) if getattr(frappe.db, "count", None) else 0
    mrr = 0.0
    canceled = 0
    if frappe.db.table_exists("Subscription"):
        for row in frappe.get_all(
            "Subscription",
            filters={"status": ["in", ["trialing", "active"]]},
            fields=["mrr"],
            limit_page_length=500,
        ):
            mrr = flt(mrr) + flt(row.get("mrr"))
        start = str(_month_start())
        canceled = frappe.db.count("Subscription", {"status": "canceled", "modified": [">=", start]}) or 0
    signups = 0
    if frappe.db.table_exists("Signup Application"):
        signups = frappe.db.count("Signup Application", {"creation": [">=", str(_month_start())]}) or 0
    usage = []
    if frappe.db.table_exists("Usage Record"):
        buckets: dict[str, float] = {}
        for row in frappe.get_all(
            "Usage Record",
            fields=["metric", "quantity"],
            limit_page_length=500,
        ):
            key = row.get("metric") or "other"
            buckets[key] = flt(buckets.get(key)) + flt(row.get("quantity"))
        usage = [{"metric": k.replace("_", " "), "quantity": str(int(v)) if v == int(v) else str(v)} for k, v in sorted(buckets.items())]
    return {
        "mrr": _money(mrr),
        "active_tenants": int(active or 0),
        "signups_this_month": int(signups or 0),
        "churn_this_month": f"{int(canceled)} canceled",
        "usage": usage,
    }


@frappe.whitelist()
def fleet_csv() -> str:
    data = fleet()
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["metric", "value"])
    writer.writerow(["MRR", data["mrr"]])
    writer.writerow(["Active companies", data["active_tenants"]])
    writer.writerow(["Signups this month", data["signups_this_month"]])
    writer.writerow(["Churn this month", data["churn_this_month"]])
    for row in data.get("usage") or []:
        writer.writerow([row["metric"], row["quantity"]])
    return buf.getvalue()
