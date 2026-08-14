"""Stripe subscription billing for EE tenants (control plane)."""

from __future__ import annotations

import os

import frappe
from frappe.utils import now_datetime, add_days, flt, today, get_datetime

from entertainment_express.control_plane.lifecycle import suspend_tenant
from entertainment_express.security.access import require_roles


OPS = ["SaaS Operator", "System Manager"]


def _stripe():
    import stripe

    key = os.environ.get("EE_STRIPE_SECRET_KEY")
    if not key or not key.startswith("sk_"):
        frappe.throw("Stripe is not configured for SaaS billing.")
    stripe.api_key = key
    return stripe


@frappe.whitelist()
def create_subscription_checkout(tenant_name: str, interval: str = "month") -> dict:
    require_roles(*OPS)
    tenant = frappe.get_doc("Tenant", tenant_name)
    plan = frappe.get_doc("Plan", tenant.plan)
    price = plan.get("stripe_price_annual") if interval == "year" else plan.get("stripe_price_monthly")
    stripe = _stripe()
    if not price:
        # Fallback: one-time price_data so checkout still works without Dashboard price IDs
        unit = int(round(flt(plan.price_annual if interval == "year" else plan.price_monthly) * 100))
        session = stripe.checkout.Session.create(
            mode="subscription",
            success_url=f"https://{frappe.local.site}/app/tenant/{tenant.name}?sub=1",
            cancel_url=f"https://{frappe.local.site}/app/tenant/{tenant.name}?sub=0",
            line_items=[
                {
                    "price_data": {
                        "currency": (plan.currency or "usd").lower(),
                        "recurring": {"interval": "year" if interval == "year" else "month"},
                        "unit_amount": unit,
                        "product_data": {"name": f"Entertainment Express — {plan.plan_name}"},
                    },
                    "quantity": 1,
                }
            ],
            metadata={"tenant": tenant.name, "plan": plan.name},
            customer_email=tenant.primary_email or None,
        )
    else:
        session = stripe.checkout.Session.create(
            mode="subscription",
            success_url=f"https://{frappe.local.site}/app/tenant/{tenant.name}?sub=1",
            cancel_url=f"https://{frappe.local.site}/app/tenant/{tenant.name}?sub=0",
            line_items=[{"price": price, "quantity": 1}],
            metadata={"tenant": tenant.name, "plan": plan.name},
            customer_email=tenant.primary_email or None,
        )
    return {"checkout_url": session.url, "session_id": session.id}


@frappe.whitelist()
def start_trial(tenant_name: str) -> dict:
    require_roles(*OPS)
    tenant = frappe.get_doc("Tenant", tenant_name)
    plan = frappe.get_doc("Plan", tenant.plan)
    days = int(plan.trial_days or 0)
    if frappe.db.exists("Subscription", {"tenant": tenant_name}):
        return {"status": "already_exists"}
    sub = frappe.get_doc(
        {
            "doctype": "Subscription",
            "tenant": tenant_name,
            "plan": plan.name,
            "status": "trialing" if days else "active",
            "provider": "stripe",
            "current_period_start": now_datetime(),
            "current_period_end": add_days(now_datetime(), days or 30),
            "mrr": flt(plan.price_monthly),
        }
    )
    sub.insert()
    frappe.db.commit()
    return {"subscription": sub.name, "status": sub.status}


@frappe.whitelist(allow_guest=True)
def saas_stripe_webhook() -> dict:
    import stripe as stripe_lib

    payload = frappe.local.request.data
    sig = frappe.local.request.headers.get("Stripe-Signature", "")
    secret = os.environ.get("EE_STRIPE_WEBHOOK_SECRET", "")
    if not secret:
        frappe.local.response.http_status_code = 500
        return {"error": "webhook secret not configured"}
    try:
        event = stripe_lib.Webhook.construct_event(payload, sig, secret)
    except Exception:
        frappe.local.response.http_status_code = 400
        return {"error": "invalid signature"}

    if frappe.db.exists("Stripe Processed Event", event["id"]):
        return {"status": "already_processed"}
    from entertainment_express.api.payments_stripe import _mark_event_processed

    _mark_event_processed(event["id"], event["type"])

    et = event["type"]
    obj = event["data"]["object"]
    if et in ("checkout.session.completed", "customer.subscription.updated", "customer.subscription.created"):
        _upsert_subscription(obj)
    elif et == "invoice.paid":
        _invoice_paid(obj)
    elif et == "invoice.payment_failed":
        _invoice_failed(obj)
    elif et == "customer.subscription.deleted":
        _subscription_canceled(obj)
    frappe.db.commit()
    return {"status": "received"}


def apply_dunning():
    """Suspend tenants whose grace period elapsed."""
    now = now_datetime()
    rows = frappe.get_all("Subscription", filters={"status": "past_due"}, fields=["name", "tenant", "grace_until"])
    for row in rows:
        if row.grace_until and get_datetime(row.grace_until) <= now:
            suspend_tenant(row.tenant, reason="payment_failed_grace_elapsed")


def _tenant_from_obj(obj) -> str | None:
    meta = obj.get("metadata") or {}
    if meta.get("tenant"):
        return meta["tenant"]
    sub_id = obj.get("subscription") or obj.get("id")
    return frappe.db.get_value("Subscription", {"provider_subscription_id": sub_id}, "tenant")


def _upsert_subscription(obj):
    tenant = _tenant_from_obj(obj)
    if not tenant:
        return
    sub_id = obj.get("subscription") or obj.get("id")
    name = frappe.db.get_value("Subscription", {"tenant": tenant}, "name")
    status_map = {
        "trialing": "trialing",
        "active": "active",
        "past_due": "past_due",
        "canceled": "canceled",
        "unpaid": "past_due",
        "incomplete": "past_due",
    }
    st = status_map.get(obj.get("status") or "active", "active")
    values = {
        "status": st,
        "provider_subscription_id": sub_id,
        "provider_customer_id": obj.get("customer"),
    }
    if name:
        frappe.db.set_value("Subscription", name, values)
    else:
        tenant_doc = frappe.get_doc("Tenant", tenant)
        frappe.get_doc({"doctype": "Subscription", "tenant": tenant, "plan": tenant_doc.plan, **values}).insert()


def _invoice_paid(obj):
    tenant = _tenant_from_obj(obj)
    if not tenant:
        return
    inv_id = obj.get("id")
    if frappe.db.exists("SaaS Invoice", {"provider_invoice_id": inv_id}):
        frappe.db.set_value("SaaS Invoice", {"provider_invoice_id": inv_id}, {"status": "paid", "paid_on": today()})
        return
    sub = frappe.db.get_value("Subscription", {"tenant": tenant}, "name")
    frappe.get_doc(
        {
            "doctype": "SaaS Invoice",
            "tenant": tenant,
            "subscription": sub,
            "amount": flt(obj.get("amount_paid", 0)) / 100.0,
            "currency": (obj.get("currency") or "usd").upper(),
            "status": "paid",
            "provider_invoice_id": inv_id,
            "issued_on": today(),
            "paid_on": today(),
        }
    ).insert()
    if sub:
        frappe.db.set_value("Subscription", sub, "status", "active")


def _invoice_failed(obj):
    tenant = _tenant_from_obj(obj)
    if not tenant:
        return
    sub = frappe.db.get_value("Subscription", {"tenant": tenant}, "name")
    plan = frappe.db.get_value("Tenant", tenant, "plan")
    grace = int(frappe.db.get_value("Plan", plan, "grace_days") or 7)
    if sub:
        frappe.db.set_value(
            "Subscription",
            sub,
            {"status": "past_due", "grace_until": add_days(now_datetime(), grace)},
        )
    email = frappe.db.get_value("Tenant", tenant, "primary_email")
    if email:
        from entertainment_express.notifications import send

        send("saas_dunning", email, {"tenant": tenant, "grace_days": grace})


def _subscription_canceled(obj):
    tenant = _tenant_from_obj(obj)
    if not tenant:
        return
    sub = frappe.db.get_value("Subscription", {"tenant": tenant}, "name")
    if sub:
        frappe.db.set_value("Subscription", sub, {"status": "canceled", "cancel_at_period_end": 1})
