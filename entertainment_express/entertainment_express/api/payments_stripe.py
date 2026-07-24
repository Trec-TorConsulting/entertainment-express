"""
Stripe payments API — deposit checkout and webhook reconciliation.

Security:
- Stripe secret key read from environment (K8s secret), never stored in DB plaintext.
- Webhook signature verified before processing.
- Events deduplicated by Stripe event id (idempotency).
"""

import json
import os

import frappe
from frappe.utils import flt, now_datetime


def _stripe():
    """Return an authenticated stripe module."""
    import stripe as _stripe_lib
    _stripe_lib.api_key = _get_stripe_key()
    return _stripe_lib


def _get_stripe_key() -> str:
    """Read from env (injected from K8s ee-secrets). Falls back to Integration Config."""
    key = os.environ.get("EE_STRIPE_SECRET_KEY")
    if key:
        return key
    # Fallback: per-tenant Integration Config (encrypted field)
    cfg = frappe.db.get_value(
        "Integration Config",
        {"provider": "stripe", "enabled": 1},
        "credentials",
        ignore=True,
    )
    if cfg:
        import json as _j
        data = _j.loads(cfg)
        return data.get("secret_key", "")
    frappe.throw("Stripe secret key not configured.")


@frappe.whitelist()
def create_checkout(invoice_name: str) -> dict:
    """
    Create a Stripe Checkout Session for the given deposit Sales Invoice.
    Returns {checkout_url, session_id}.
    """
    _check_role(["EE Tenant Admin", "EE Sales", "EE Accounting", "System Manager"])
    stripe = _stripe()

    invoice = frappe.get_doc("Sales Invoice", invoice_name)
    if not invoice.ee_is_deposit:
        frappe.throw("This invoice is not a deposit invoice.")
    if invoice.status == "Paid":
        frappe.throw("Invoice is already paid.")

    amount_cents = int(flt(invoice.grand_total) * 100)
    currency = (invoice.currency or "usd").lower()
    site_url = frappe.utils.get_url()

    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        line_items=[{
            "price_data": {
                "currency": currency,
                "unit_amount": amount_cents,
                "product_data": {
                    "name": f"Event Deposit — {invoice.ee_booking or invoice_name}",
                },
            },
            "quantity": 1,
        }],
        mode="payment",
        success_url=f"{site_url}/portal/booking?invoice={invoice_name}&paid=1",
        cancel_url=f"{site_url}/portal/booking?invoice={invoice_name}&paid=0",
        metadata={
            "invoice_name": invoice_name,
            "booking_name": invoice.ee_booking or "",
        },
        customer_email=frappe.db.get_value("Customer", invoice.customer, "email_id") or "",
    )

    # Store the Stripe session id on the invoice for reconciliation
    frappe.db.set_value("Sales Invoice", invoice_name, "ee_stripe_session_id", session.id)
    frappe.db.commit()

    return {"checkout_url": session.url, "session_id": session.id}


@frappe.whitelist(allow_guest=True)
def stripe_webhook() -> dict:
    """
    Stripe webhook endpoint (public, signature-verified, idempotent).
    Register in Stripe dashboard: POST /api/method/entertainment_express.api.payments_stripe.stripe_webhook
    """
    import stripe as _stripe_lib

    payload = frappe.local.request.data
    sig_header = frappe.local.request.headers.get("Stripe-Signature", "")
    webhook_secret = os.environ.get("EE_STRIPE_WEBHOOK_SECRET", "")

    if not webhook_secret:
        frappe.log_error("EE_STRIPE_WEBHOOK_SECRET not set", "Stripe Webhook")
        frappe.local.response.http_status_code = 500
        return {"error": "webhook secret not configured"}

    try:
        event = _stripe_lib.Webhook.construct_event(payload, sig_header, webhook_secret)
    except _stripe_lib.error.SignatureVerificationError:
        frappe.local.response.http_status_code = 400
        return {"error": "invalid signature"}

    event_id = event["id"]

    # Idempotency: skip if already processed
    if frappe.db.exists("Stripe Processed Event", event_id):
        return {"status": "already_processed"}

    _mark_event_processed(event_id, event["type"])

    if event["type"] in ("checkout.session.completed", "payment_intent.succeeded"):
        frappe.enqueue(
            "entertainment_express.api.payments_stripe._handle_payment_succeeded",
            event_data=event,
            queue="short",
        )

    return {"status": "received"}


def _handle_payment_succeeded(event_data: dict) -> None:
    """Background: create Payment Entry, confirm booking, send emails."""
    obj = event_data.get("data", {}).get("object", {})

    # Get invoice_name from metadata (Checkout Session) or from invoice lookup
    invoice_name = (obj.get("metadata") or {}).get("invoice_name")
    booking_name = (obj.get("metadata") or {}).get("booking_name")
    payment_intent_id = obj.get("payment_intent") or obj.get("id")

    if not invoice_name:
        frappe.logger().warning("[Stripe webhook] No invoice_name in metadata — skipping.")
        return

    invoice = frappe.get_doc("Sales Invoice", invoice_name)
    if invoice.status == "Paid":
        return  # Already reconciled

    # Create Payment Entry
    company = frappe.db.get_single_value("Global Defaults", "default_company")
    pe = frappe.get_doc({
        "doctype": "Payment Entry",
        "payment_type": "Receive",
        "posting_date": frappe.utils.today(),
        "company": company,
        "party_type": "Customer",
        "party": invoice.customer,
        "paid_amount": flt(invoice.grand_total),
        "received_amount": flt(invoice.grand_total),
        "references": [{
            "reference_doctype": "Sales Invoice",
            "reference_name": invoice_name,
            "allocated_amount": flt(invoice.grand_total),
        }],
        "reference_no": payment_intent_id,
        "reference_date": frappe.utils.today(),
        "remarks": f"Stripe payment {payment_intent_id}",
    })
    pe.insert(ignore_permissions=True)
    pe.submit()

    # Mark booking confirmed
    if booking_name and frappe.db.exists("Event Booking", booking_name):
        frappe.db.set_value("Event Booking", booking_name, {
            "deposit_status": "paid",
            "status": "confirmed",
        })

    frappe.db.commit()

    # Send confirmation + receipt
    customer_email = frappe.db.get_value("Customer", invoice.customer, "email_id") or ""
    if customer_email:
        from entertainment_express.notifications import send
        company_name = frappe.db.get_single_value("Global Defaults", "default_company")
        context = {
            "customer_name": invoice.customer,
            "company_name": company_name,
            "booking_name": booking_name,
            "invoice_name": invoice_name,
            "amount": flt(invoice.grand_total),
        }
        send("booking_confirmed", customer_email, context)
        send("deposit_receipt", customer_email, context)


def _mark_event_processed(event_id: str, event_type: str) -> None:
    """
    Store the Stripe event id to prevent duplicate processing.
    Uses a lightweight Single DocType or a raw DB insert.
    """
    frappe.db.sql(
        """INSERT IGNORE INTO `tabStripe Processed Event`
           (name, event_type, processed_at, creation, modified, modified_by, owner, docstatus)
           VALUES (%s, %s, %s, %s, %s, 'Administrator', 'Administrator', 0)
        """,
        (event_id, event_type, now_datetime(), now_datetime(), now_datetime()),
    )
    frappe.db.commit()


def _check_role(allowed_roles: list[str]) -> None:
    if frappe.session.user == "Guest":
        frappe.throw("Authentication required.", frappe.PermissionError)
    if not any(r in frappe.get_roles(frappe.session.user) for r in allowed_roles):
        frappe.throw("Insufficient permissions.", frappe.PermissionError)
