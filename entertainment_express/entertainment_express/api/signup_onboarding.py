"""Signup application approval, Stripe checkout, and payment-triggered provisioning."""

from __future__ import annotations

import os
from urllib.parse import quote

import frappe
from frappe.utils import flt

from entertainment_express.control_plane.tenant_urls import tenant_site_url


def marketing_public_url(path: str = "") -> str:
    from entertainment_express.marketing.site_context import get_marketing_settings

    domain = (get_marketing_settings().get("base_domain") or frappe.conf.get("ee_base_domain") or "entx.app").strip()
    if domain.startswith("www."):
        base = f"https://{domain}"
    else:
        base = f"https://www.{domain}"
    path = path if path.startswith("/") else f"/{path}" if path else ""
    return f"{base}{path}"


def approve_signup_application(application_name: str) -> dict:
    """
    Approve a Signup Application and enqueue tenant provisioning.
    Idempotent when the application is already approved with a linked tenant.
    """
    app = frappe.get_doc("Signup Application", application_name)
    if app.status == "approved" and app.tenant:
        return {"status": "already_approved", "tenant": app.tenant, "application": app.name}

    if app.status != "new":
        frappe.throw(f"Application is already {app.status}.")

    from entertainment_express.control_plane.provisioner import validate_slug

    validate_slug(app.requested_slug)

    plan = app.plan or frappe.db.get_value("Plan", {"status": "Active"}, "name")
    tenant = frappe.get_doc({
        "doctype": "Tenant",
        "tenant_slug": app.requested_slug,
        "company_name": app.company_name,
        "status": "provisioning",
        "plan": plan,
        "primary_email": app.contact_email,
    })
    tenant.insert(ignore_permissions=True)

    job = frappe.get_doc({
        "doctype": "Provisioning Job",
        "tenant": tenant.name,
        "action": "create",
        "state": "queued",
    })
    job.insert(ignore_permissions=True)
    frappe.db.commit()

    from entertainment_express.control_plane.provisioner import enqueue_provision

    enqueue_provision(job.name)

    app.status = "approved"
    app.tenant = tenant.name
    app.save(ignore_permissions=True)
    frappe.db.commit()

    return {
        "status": "provisioning",
        "tenant": tenant.name,
        "job": job.name,
        "application": app.name,
        "site_url": tenant_site_url(app.requested_slug),
    }


def _stripe_configured() -> bool:
    key = os.environ.get("EE_STRIPE_SECRET_KEY", "")
    return bool(key and key.startswith("sk_"))


def create_signup_checkout(application_name: str, interval: str = "month") -> dict:
    """Create a Stripe Checkout session for a new Signup Application."""
    if not _stripe_configured():
        return {"checkout_url": None}

    app = frappe.get_doc("Signup Application", application_name)
    if app.status != "new":
        frappe.throw("This signup application is no longer available for checkout.")

    plan = frappe.get_doc("Plan", app.plan)
    from entertainment_express.api.saas_billing import _stripe

    stripe = _stripe()
    price = plan.get("stripe_price_annual") if interval == "year" else plan.get("stripe_price_monthly")
    unit = int(round(flt(plan.price_annual if interval == "year" else plan.price_monthly) * 100))
    currency = (plan.currency or "usd").lower()
    product_name = f"Entertainment Express — {plan.plan_name}"

    success = (
        f"{marketing_public_url('/start-trial')}"
        f"?success=1&application={quote(app.name)}&slug={quote(app.requested_slug)}"
    )
    cancel = f"{marketing_public_url('/start-trial')}?plan={plan.plan_code}&canceled=1"

    kwargs = {
        "mode": "subscription",
        "success_url": success,
        "cancel_url": cancel,
        "customer_email": app.contact_email,
        "metadata": {
            "signup_application": app.name,
            "requested_slug": app.requested_slug,
            "plan": plan.name,
            "company_name": app.company_name,
            "contact_email": app.contact_email,
        },
    }
    trial_days = int(plan.trial_days or 0)
    if trial_days > 0:
        kwargs["subscription_data"] = {"trial_period_days": trial_days}

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


def handle_signup_checkout_completed(session: dict) -> dict | None:
    """
    Approve and provision when Stripe checkout completes for a new signup.
    Returns updated session metadata (with tenant link) for subscription upsert.
    """
    meta = dict(session.get("metadata") or {})
    application_name = (meta.get("signup_application") or "").strip()
    if not application_name or not frappe.db.exists("Signup Application", application_name):
        return None

    app = frappe.get_doc("Signup Application", application_name)
    if app.status == "new":
        approve_signup_application(application_name)
        app.reload()

    if app.tenant:
        meta["tenant"] = app.tenant
        meta["tenant_slug"] = app.requested_slug
        return meta
    return None


def signup_handoff(application_name: str, requested_slug: str, interval: str = "month") -> dict:
    """Return checkout URL (when Stripe is configured) or manual-review messaging."""
    site_url = tenant_site_url(requested_slug)
    checkout = create_signup_checkout(application_name, interval=interval)
    if checkout.get("checkout_url"):
        return {
            "ok": True,
            "application": application_name,
            "site_url": site_url,
            "checkout_url": checkout["checkout_url"],
            "manual_review": False,
        }
    return {
        "ok": True,
        "application": application_name,
        "site_url": site_url,
        "checkout_url": None,
        "manual_review": True,
        "message": (
            "Your application was submitted. We'll review it and provision your workspace shortly."
        ),
    }
