"""Stripe subscription billing for EE tenants (control plane + owner pay/cancel)."""

from __future__ import annotations

import os
from datetime import datetime, timezone

import frappe
from frappe.utils import add_days, flt, get_datetime, now_datetime, today

from entertainment_express.control_plane.entitlements import (
    is_control_plane,
    push_plan_to_site,
)
from entertainment_express.control_plane.lifecycle import (
    read_site_config,
    suspend_tenant,
    update_site_flags,
)
from entertainment_express.security.access import require_roles


OPS = ["SaaS Operator", "System Manager"]
OWNER = ["EE Tenant Admin", "System Manager"]
GUEST_ROLE = "EE Event Guest"
CREW = {"EE Crew", "EE Entertainer"}


def _deny_guest() -> None:
    user = getattr(getattr(frappe, "session", None), "user", "") or ""
    if user in ("Guest", "guest") or not user:
        frappe.throw("Not allowed.", frappe.PermissionError)
    roles = set(frappe.get_roles() or [])
    if GUEST_ROLE in roles and not roles.intersection(set(OWNER) | set(OPS) | {"EE Accounting"}):
        frappe.throw("Not allowed.", frappe.PermissionError)


def _deny_crew() -> None:
    _deny_guest()
    roles = set(frappe.get_roles() or [])
    if roles.intersection(CREW) and not roles.intersection(set(OWNER) | set(OPS)):
        frappe.throw("Not allowed.", frappe.PermissionError)


def _stripe():
    import stripe

    key = os.environ.get("EE_STRIPE_SECRET_KEY")
    if not key or not key.startswith("sk_"):
        frappe.throw("Stripe is not configured for SaaS billing.")
    stripe.api_key = key
    return stripe


def _success_url(is_owner: bool) -> str:
    host = frappe.utils.get_url() if hasattr(frappe, "utils") else f"https://{frappe.local.site}"
    if is_owner:
        return f"{host}/owner/plan?sub=1"
    return f"{host}/ops?sub=1"


def ensure_subscription(tenant_name: str) -> dict:
    """Create trial/active Subscription if missing. Control-plane internal."""
    tenant = frappe.get_doc("Tenant", tenant_name)
    plan = frappe.get_doc("Plan", tenant.plan)
    existing = frappe.db.get_value("Subscription", {"tenant": tenant_name}, "name")
    if existing:
        push_plan_to_site(tenant_name)
        return {"subscription": existing, "status": frappe.db.get_value("Subscription", existing, "status")}
    days = int(plan.trial_days or 0)
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
    push_plan_to_site(tenant_name)
    return {"subscription": sub.name, "status": sub.status}


@frappe.whitelist()
def start_trial(tenant_name: str) -> dict:
    _deny_guest()
    require_roles(*OPS)
    return ensure_subscription(tenant_name)


@frappe.whitelist()
def change_plan(tenant_name: str, plan: str) -> dict:
    _deny_guest()
    require_roles(*OPS)
    tenant = frappe.get_doc("Tenant", tenant_name)
    if not frappe.db.exists("Plan", plan):
        frappe.throw("Unknown plan.")
    tenant.plan = plan
    tenant.notes = ((tenant.notes or "") + f"\nPlan changed to {plan} at {now_datetime()}").strip()
    tenant.save()
    sub = frappe.db.get_value("Subscription", {"tenant": tenant_name}, "name")
    if sub:
        frappe.db.set_value("Subscription", sub, {"plan": plan, "mrr": flt(frappe.db.get_value("Plan", plan, "price_monthly"))})
    frappe.db.commit()
    push_plan_to_site(tenant_name)
    return {"tenant": tenant_name, "plan": plan}


@frappe.whitelist()
def create_subscription_checkout(tenant_name: str | None = None, interval: str = "month") -> dict:
    _deny_crew()
    is_owner = not tenant_name
    if tenant_name:
        require_roles(*OPS)
        tenant = frappe.get_doc("Tenant", tenant_name)
        plan = frappe.get_doc("Plan", tenant.plan)
        meta = {"tenant": tenant.name, "tenant_slug": tenant.tenant_slug, "plan": plan.name}
        email = tenant.primary_email or None
    else:
        require_roles(*OWNER)
        slug = (frappe.conf.get("ee_tenant_slug") or "").strip()
        plan_code = (frappe.conf.get("ee_plan") or "starter").strip()
        meta = {"tenant_slug": slug, "plan": plan_code}
        email = frappe.session.user if "@" in (frappe.session.user or "") else None
        # Price IDs / amounts come from site_config display only for the Stripe
        # fallback unit_amount: parse is forbidden in SPA; here we use Plan on
        # control plane. Tenant checkout uses env EE_STRIPE_* and price from
        # conf ee_checkout_unit_amount (cents) pushed by control plane, else 14900.
        plan = None

    stripe = _stripe()
    if tenant_name:
        price = plan.get("stripe_price_annual") if interval == "year" else plan.get("stripe_price_monthly")
        unit = int(round(flt(plan.price_annual if interval == "year" else plan.price_monthly) * 100))
        currency = (plan.currency or "usd").lower()
        product_name = f"Entertainment Express — {plan.plan_name}"
    else:
        price = frappe.conf.get("ee_stripe_price_annual" if interval == "year" else "ee_stripe_price_monthly")
        unit = int(frappe.conf.get("ee_checkout_unit_cents") or 14900)
        currency = (frappe.conf.get("ee_currency") or "usd").lower()
        product_name = f"Entertainment Express — {frappe.conf.get('ee_plan_name') or 'Professional'}"

    kwargs = {
        "mode": "subscription",
        "success_url": _success_url(is_owner),
        "cancel_url": _success_url(is_owner).replace("sub=1", "sub=0"),
        "metadata": meta,
        "customer_email": email,
    }
    if price:
        kwargs["line_items"] = [{"price": price, "quantity": 1}]
    else:
        kwargs["line_items"] = [
            {
                "price_data": {
                    "currency": currency,
                    "recurring": {"interval": "year" if interval == "year" else "month"},
                    "unit_amount": unit,
                    "product_data": {"name": product_name},
                },
                "quantity": 1,
            }
        ]
    session = stripe.checkout.Session.create(**kwargs)
    return {"checkout_url": session.url, "session_id": session.id}


@frappe.whitelist()
def my_plan() -> dict:
    _deny_crew()
    require_roles(*OWNER, *OPS)
    conf = frappe.conf or {}
    status = conf.get("ee_subscription_status") or "trialing"
    return {
        "plan": conf.get("ee_plan_name") or conf.get("ee_plan") or "Starter",
        "status": status,
        "period_end": str(conf.get("ee_period_end") or ""),
        "price": conf.get("ee_price_display") or "",
        "cancel_at_period_end": int(conf.get("ee_cancel_at_period_end") or 0),
        "cancel_requested": int(conf.get("ee_cancel_requested") or 0),
        "suspended": int(conf.get("ee_suspended") or 0),
    }


@frappe.whitelist()
def request_cancel() -> dict:
    _deny_crew()
    require_roles(*OWNER)
    from frappe.installer import update_site_config

    update_site_config("ee_cancel_requested", 1)
    frappe.conf["ee_cancel_requested"] = 1
    return {"status": "cancel_requested"}


@frappe.whitelist(allow_guest=True)
def saas_stripe_webhook() -> dict:
    if not is_control_plane():
        return {"status": "ignored"}
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
    apply_stripe_event(event["type"], event["data"]["object"])
    frappe.db.commit()
    return {"status": "received"}


def apply_stripe_event(et: str, obj: dict) -> None:
    """Pure-ish handler used by webhook and tests."""
    if et in ("checkout.session.completed", "customer.subscription.updated", "customer.subscription.created"):
        _upsert_subscription(obj)
    elif et == "invoice.paid":
        _invoice_paid(obj)
    elif et == "invoice.payment_failed":
        _invoice_failed(obj)
    elif et == "customer.subscription.deleted":
        _subscription_canceled(obj)


def apply_dunning():
    """Suspend tenants whose grace period elapsed."""
    if not is_control_plane():
        return
    now = now_datetime()
    rows = frappe.get_all("Subscription", filters={"status": "past_due"}, fields=["name", "tenant", "grace_until"])
    for row in rows:
        if row.grace_until and get_datetime(row.grace_until) <= now:
            suspend_tenant(row.tenant, reason="payment_failed_grace_elapsed")


def apply_cancellations():
    """Honor tenant cancel flags and period-end cancels. Control plane only."""
    if not is_control_plane():
        return
    now = now_datetime()
    for tenant in frappe.get_all("Tenant", filters={"status": ["in", ["active", "suspended"]]}, fields=["name", "site_name"]):
        conf = read_site_config(tenant.site_name) if tenant.site_name else {}
        sub_name = frappe.db.get_value("Subscription", {"tenant": tenant.name}, "name")
        if conf.get("ee_cancel_requested") and sub_name:
            frappe.db.set_value("Subscription", sub_name, "cancel_at_period_end", 1)
            update_site_flags(tenant.site_name, {"ee_cancel_at_period_end": 1, "ee_cancel_requested": 0})
        if not sub_name:
            continue
        sub = frappe.db.get_value(
            "Subscription",
            sub_name,
            ["status", "cancel_at_period_end", "current_period_end"],
            as_dict=True,
        )
        if not sub:
            continue
        if int(sub.get("cancel_at_period_end") or 0) and sub.get("current_period_end"):
            if get_datetime(sub.current_period_end) <= now and sub.status != "canceled":
                frappe.db.set_value("Subscription", sub_name, "status", "canceled")
                suspend_tenant(tenant.name, reason="canceled_period_end")


def _tenant_from_obj(obj) -> str | None:
    meta = obj.get("metadata") or {}
    if meta.get("tenant") and frappe.db.exists("Tenant", meta["tenant"]):
        return meta["tenant"]
    slug = meta.get("tenant_slug")
    if slug:
        name = frappe.db.get_value("Tenant", {"tenant_slug": slug}, "name")
        if name:
            return name
    sub_id = obj.get("subscription") or obj.get("id")
    if sub_id:
        return frappe.db.get_value("Subscription", {"provider_subscription_id": sub_id}, "tenant")
    return None


def _period_from_obj(obj):
    start = obj.get("current_period_start") or obj.get("period_start")
    end = obj.get("current_period_end") or obj.get("period_end")
    lines = (obj.get("lines") or {}).get("data") or []
    if lines and not start:
        period = lines[0].get("period") or {}
        start = period.get("start")
        end = period.get("end")
    def _ts(val):
        if not val:
            return None
        if isinstance(val, (int, float)):
            return datetime.fromtimestamp(int(val), tz=timezone.utc).replace(tzinfo=None)
        return get_datetime(val)

    return _ts(start), _ts(end)


def _upsert_subscription(obj):
    tenant = _tenant_from_obj(obj)
    if not tenant:
        return
    sub_id = obj.get("subscription") or obj.get("id")
    if obj.get("object") == "checkout.session":
        sub_id = obj.get("subscription") or sub_id
    name = frappe.db.get_value("Subscription", {"tenant": tenant}, "name")
    status_map = {
        "trialing": "trialing",
        "active": "active",
        "past_due": "past_due",
        "canceled": "canceled",
        "unpaid": "past_due",
        "incomplete": "past_due",
        "complete": "active",
    }
    st = status_map.get(obj.get("status") or "active", "active")
    period_start, period_end = _period_from_obj(obj)
    values = {
        "status": st,
        "provider_subscription_id": sub_id,
        "provider_customer_id": obj.get("customer"),
    }
    if period_start:
        values["current_period_start"] = period_start
    if period_end:
        values["current_period_end"] = period_end
    if name:
        frappe.db.set_value("Subscription", name, values)
    else:
        tenant_doc = frappe.get_doc("Tenant", tenant)
        frappe.get_doc({"doctype": "Subscription", "tenant": tenant, "plan": tenant_doc.plan, **values}).insert()
    push_plan_to_site(tenant)


def _invoice_paid(obj):
    tenant = _tenant_from_obj(obj)
    if not tenant:
        return
    inv_id = obj.get("id")
    if frappe.db.exists("SaaS Invoice", {"provider_invoice_id": inv_id}):
        frappe.db.set_value("SaaS Invoice", {"provider_invoice_id": inv_id}, {"status": "paid", "paid_on": today()})
    else:
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
    sub = frappe.db.get_value("Subscription", {"tenant": tenant}, "name")
    period_start, period_end = _period_from_obj(obj)
    values = {"status": "active"}
    if period_start:
        values["current_period_start"] = period_start
    if period_end:
        values["current_period_end"] = period_end
    if sub:
        frappe.db.set_value("Subscription", sub, values)
    push_plan_to_site(tenant)


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
    push_plan_to_site(tenant, extra={"ee_subscription_status": "past_due"})
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
    push_plan_to_site(tenant, extra={"ee_subscription_status": "canceled", "ee_cancel_at_period_end": 1})
