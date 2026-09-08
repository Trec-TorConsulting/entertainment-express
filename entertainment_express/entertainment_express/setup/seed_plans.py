"""
Seed the default Plan records on the control-plane site.
Run once: bench --site admin.{base_domain} execute entertainment_express.setup.seed_plans.run
"""

import frappe
from frappe.utils import flt


def run():
    """Create or update default Plan records (Starter, Pro, Scale)."""
    plans = [
        {
            "plan_name": "Starter",
            "plan_code": "starter",
            "price_monthly": 0.0,
            "price_annual": 0.0,
            "currency": "USD",
            "trial_days": 0,
            "allow_overages": 0,
            "status": "Active",
            "entitlements": [
                {"feature_key": "max_staff", "limit_value": "1"},
                {"feature_key": "active_bookings_limit", "limit_value": "3"},
                {"feature_key": "storage_gb", "limit_value": "0.5"},
                {"feature_key": "white_label", "limit_value": "0"},
                {"feature_key": "custom_domain", "limit_value": "0"},
                {"feature_key": "weather_risk", "limit_value": "0"},
                {"feature_key": "sms_enabled", "limit_value": "0"},
                {"feature_key": "playlist_export", "limit_value": "0"},
                {"feature_key": "ai_assistant", "limit_value": "0"},
                {"feature_key": "overflow_exchange", "limit_value": "0"},
                {"feature_key": "show_ee_badge", "limit_value": "1"},
                {"feature_key": "concierge_migration", "limit_value": "0"},
            ],
        },
        {
            "plan_name": "Pro",
            "plan_code": "pro",
            "price_monthly": 99.0,
            "price_annual": 948.0,
            "currency": "USD",
            "trial_days": 14,
            "allow_overages": 1,
            "status": "Active",
            "entitlements": [
                {"feature_key": "max_staff", "limit_value": "5"},
                {"feature_key": "active_bookings_limit", "limit_value": "9999"},
                {"feature_key": "storage_gb", "limit_value": "15"},
                {"feature_key": "white_label", "limit_value": "1"},
                {"feature_key": "custom_domain", "limit_value": "1"},
                {"feature_key": "weather_risk", "limit_value": "1"},
                {"feature_key": "sms_enabled", "limit_value": "1"},
                {"feature_key": "playlist_export", "limit_value": "1"},
                {"feature_key": "ai_assistant", "limit_value": "0"},
                {"feature_key": "overflow_exchange", "limit_value": "0"},
                {"feature_key": "show_ee_badge", "limit_value": "0"},
                {"feature_key": "concierge_migration", "limit_value": "0"},
            ],
        },
        {
            "plan_name": "Scale",
            "plan_code": "scale",
            "price_monthly": 249.0,
            "price_annual": 2388.0,
            "currency": "USD",
            "trial_days": 14,
            "allow_overages": 1,
            "status": "Active",
            "entitlements": [
                {"feature_key": "max_staff", "limit_value": "9999"},
                {"feature_key": "active_bookings_limit", "limit_value": "9999"},
                {"feature_key": "storage_gb", "limit_value": "100"},
                {"feature_key": "white_label", "limit_value": "1"},
                {"feature_key": "custom_domain", "limit_value": "1"},
                {"feature_key": "weather_risk", "limit_value": "1"},
                {"feature_key": "sms_enabled", "limit_value": "1"},
                {"feature_key": "playlist_export", "limit_value": "1"},
                {"feature_key": "ai_assistant", "limit_value": "1"},
                {"feature_key": "overflow_exchange", "limit_value": "1"},
                {"feature_key": "show_ee_badge", "limit_value": "0"},
                {"feature_key": "concierge_migration", "limit_value": "1"},
            ],
        },
    ]

    for plan_def in plans:
        entitlements = plan_def.pop("entitlements")
        existing_name = frappe.db.get_value("Plan", {"plan_code": plan_def["plan_code"]}, "name")
        if existing_name:
            plan = frappe.get_doc("Plan", existing_name)
            for k, v in plan_def.items():
                setattr(plan, k, v)
            plan.set("entitlements", [])
            for ent in entitlements:
                plan.append("entitlements", ent)
            plan.save(ignore_permissions=True)
        else:
            plan = frappe.get_doc({"doctype": "Plan", **plan_def})
            for ent in entitlements:
                plan.append("entitlements", ent)
            plan.insert(ignore_permissions=True)

    frappe.db.commit()
    print(f"[EE] Seeded/Updated {len(plans)} plan(s): Starter, Pro, Scale.")
