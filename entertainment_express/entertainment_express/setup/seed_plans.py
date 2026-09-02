"""
Seed the default Plan records on the control-plane site.
Run once: bench --site admin.{base_domain} execute entertainment_express.setup.seed_plans.run
"""

import frappe
from frappe.utils import flt


def run():
    """Create default Plan records if they don't already exist."""
    plans = [
        {
            "plan_name": "Starter",
            "plan_code": "starter",
            "price_monthly": 49.0,
            "price_annual": 490.0,
            "currency": "USD",
            "trial_days": 14,
            "allow_overages": 0,
            "status": "Active",
            "entitlements": [
                {"feature_key": "max_bookings_per_month", "limit_value": "50"},
                {"feature_key": "enable_marketing", "limit_value": "0"},
                {"feature_key": "max_staff_users", "limit_value": "3"},
                {"feature_key": "ai_assistant", "limit_value": "0"},
            ],
        },
        {
            "plan_name": "Professional",
            "plan_code": "pro",
            "price_monthly": 149.0,
            "price_annual": 1490.0,
            "currency": "USD",
            "trial_days": 14,
            "allow_overages": 1,
            "status": "Active",
            "entitlements": [
                {"feature_key": "max_bookings_per_month", "limit_value": "unlimited"},
                {"feature_key": "enable_marketing", "limit_value": "1"},
                {"feature_key": "max_staff_users", "limit_value": "10"},
                {"feature_key": "ai_assistant", "limit_value": "1"},
            ],
        },
        {
            "plan_name": "Enterprise",
            "plan_code": "enterprise",
            "price_monthly": 399.0,
            "price_annual": 3990.0,
            "currency": "USD",
            "trial_days": 0,
            "allow_overages": 1,
            "status": "Active",
            "entitlements": [
                {"feature_key": "max_bookings_per_month", "limit_value": "unlimited"},
                {"feature_key": "enable_marketing", "limit_value": "1"},
                {"feature_key": "max_staff_users", "limit_value": "unlimited"},
                {"feature_key": "white_label", "limit_value": "1"},
                {"feature_key": "api_access", "limit_value": "1"},
                {"feature_key": "ai_assistant", "limit_value": "1"},
            ],
        },
    ]

    for plan_def in plans:
        if frappe.db.exists("Plan", {"plan_code": plan_def["plan_code"]}):
            continue
        entitlements = plan_def.pop("entitlements")
        plan = frappe.get_doc({"doctype": "Plan", **plan_def})
        for ent in entitlements:
            plan.append("entitlements", ent)
        plan.insert(ignore_permissions=True)

    _ensure_ai_entitlements()
    _ensure_billing_fields()
    frappe.db.commit()
    print(f"[EE] Seeded {len(plans)} plan(s).")


def _ensure_ai_entitlements():
    mapping = {"starter": "0", "pro": "1", "enterprise": "1"}
    for code, value in mapping.items():
        name = frappe.db.get_value("Plan", {"plan_code": code}, "name")
        if not name:
            continue
        if frappe.db.exists("Plan Entitlement", {"parent": name, "feature_key": "ai_assistant"}):
            continue
        plan = frappe.get_doc("Plan", name)
        plan.append("entitlements", {"feature_key": "ai_assistant", "limit_value": value})
        plan.save(ignore_permissions=True)


def _ensure_billing_fields():
    mapping = {
        "starter": {"price_annual": 490, "allow_overages": 0},
        "pro": {"price_annual": 1490, "allow_overages": 1},
        "enterprise": {"price_annual": 3990, "allow_overages": 1},
    }
    for code, values in mapping.items():
        name = frappe.db.get_value("Plan", {"plan_code": code}, "name")
        if not name:
            continue
        plan = frappe.get_doc("Plan", name)
        dirty = False
        if not flt(plan.price_annual):
            plan.price_annual = values["price_annual"]
            dirty = True
        if not plan.allow_overages and values["allow_overages"]:
            plan.allow_overages = 1
            dirty = True
        if dirty:
            plan.save(ignore_permissions=True)
