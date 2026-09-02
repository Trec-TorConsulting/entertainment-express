"""
Plan entitlements.

Tenant sites read only this site's site_config. Control-plane jobs push flags
onto tenant site_config.json. Never frappe.init / frappe.connect another site
from a tenant request.
"""

from __future__ import annotations

import frappe
from frappe.utils import flt, fmt_money


def is_control_plane() -> bool:
    conf = getattr(frappe, "conf", None) or {}
    if conf.get("ee_control_plane"):
        return True
    site = getattr(getattr(frappe, "local", None), "site", "") or ""
    return site.startswith("admin.")


def _parse(raw):
    if raw is None or raw == "":
        return False
    if raw is False:
        return False
    if raw is True:
        return True
    if raw == "unlimited":
        return True
    try:
        return int(raw)
    except (TypeError, ValueError):
        text = str(raw).strip().lower()
        if text in ("0", "false", "no"):
            return False
        if text in ("1", "true", "yes"):
            return True
        return bool(raw)


def has_entitlement(feature_key: str, site_name: str | None = None) -> bool | int:
    """
    Check whether THIS site's plan includes feature_key.

    `site_name` is accepted for call-compat and ignored — it must never switch
    databases.
    """
    _ = site_name
    conf = getattr(frappe, "conf", None) or {}
    ents = conf.get("ee_entitlements") or {}
    if isinstance(ents, str):
        try:
            import json

            ents = json.loads(ents)
        except Exception:
            ents = {}
    if isinstance(ents, dict) and feature_key in ents:
        return _parse(ents.get(feature_key))
    if feature_key == "ai_assistant" and "ee_ai_assistant" in conf:
        return _parse(conf.get("ee_ai_assistant"))

    # Control-plane site looking at its own Tenant row (rare). Tenant sites
    # have an empty Tenant table — do not treat that as "allow all" via a
    # cross-site lookup; missing site_config keys mean allow (existing tenants).
    return True


def require_entitlement(feature_key: str) -> None:
    value = has_entitlement(feature_key)
    if value in (False, 0, None):
        frappe.throw(
            "This feature is not on your plan. Upgrade in Plan to unlock it.",
            frappe.PermissionError,
        )


def enforce_numeric_limit(feature_key: str, current: int, message: str) -> None:
    limit = has_entitlement(feature_key)
    if limit is True:
        return
    if isinstance(limit, int) and current >= limit:
        frappe.throw(message, frappe.PermissionError)


def entitlement_map_for_plan(plan_name: str) -> dict:
    rows = frappe.get_all(
        "Plan Entitlement",
        filters={"parent": plan_name},
        fields=["feature_key", "limit_value"],
    )
    out = {}
    for row in rows:
        key = row.get("feature_key")
        if key:
            out[key] = row.get("limit_value")
    return out


def push_plan_to_site(tenant_name: str, extra: dict | None = None) -> None:
    """Control plane only. Writes flags onto the tenant site_config."""
    if not tenant_name:
        return
    tenant = frappe.get_doc("Tenant", tenant_name)
    plan = frappe.get_doc("Plan", tenant.plan)
    ents = entitlement_map_for_plan(plan.name)
    currency = plan.currency or "USD"
    flags = {
        "ee_tenant_slug": tenant.tenant_slug,
        "ee_plan": plan.plan_code or plan.name,
        "ee_plan_name": plan.plan_name,
        "ee_entitlements": ents,
        "ee_ai_assistant": _parse(ents.get("ai_assistant", 1)),
        "ee_price_display": fmt_money(flt(plan.price_monthly), currency=currency),
        "ee_price_annual_display": fmt_money(flt(plan.price_annual or 0), currency=currency),
        "ee_checkout_unit_cents": int(round(flt(plan.price_monthly) * 100)),
        "ee_stripe_price_monthly": plan.get("stripe_price_monthly"),
        "ee_stripe_price_annual": plan.get("stripe_price_annual"),
        "ee_currency": (currency or "usd").lower(),
        "ee_suspended": 1 if tenant.status == "suspended" else 0,
    }
    sub = frappe.db.get_value(
        "Subscription",
        {"tenant": tenant_name},
        ["status", "current_period_end", "cancel_at_period_end"],
        as_dict=True,
    )
    if sub:
        flags["ee_subscription_status"] = sub.get("status")
        flags["ee_period_end"] = str(sub.get("current_period_end") or "")
        flags["ee_cancel_at_period_end"] = int(sub.get("cancel_at_period_end") or 0)
    if extra:
        flags.update(extra)
    from entertainment_express.control_plane.lifecycle import update_site_flags

    update_site_flags(tenant.site_name, flags)
