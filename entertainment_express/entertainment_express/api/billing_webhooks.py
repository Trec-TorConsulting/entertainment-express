"""Inbound payment processor webhooks. Signature + event-id dedupe. Guests allowed (processor callback)."""

from __future__ import annotations

import hashlib
import hmac
import json
import os

import frappe
from frappe.utils import now_datetime

from entertainment_express.billing_payments.reconcile import apply_succeeded

PROCESSORS = ("stripe", "square", "paypal", "ach", "authorizenet")


@frappe.whitelist(allow_guest=True)
def processor_webhook(processor: str) -> dict:
    processor = (processor or "").lower()
    if processor not in PROCESSORS:
        frappe.local.response.http_status_code = 400
        return {"error": "unknown processor"}

    secret = os.environ.get(f"EE_{processor.upper()}_WEBHOOK_SECRET") or os.environ.get("EE_PAYMENT_WEBHOOK_SECRET") or ""
    if not secret:
        frappe.local.response.http_status_code = 500
        return {"error": "webhook secret not configured"}

    request = frappe.local.request
    payload = request.get_data(as_text=True) if hasattr(request, "get_data") else (getattr(request, "data", b"") or b"")
    if isinstance(payload, bytes):
        payload = payload.decode("utf-8", errors="ignore")
    sig = (
        request.headers.get("X-EE-Signature")
        or request.headers.get("X-Square-Hmacsha256-Signature")
        or request.headers.get("Stripe-Signature")
        or ""
    )
    expected = hmac.new(secret.encode("utf-8"), payload.encode("utf-8"), hashlib.sha256).hexdigest()
    if processor == "stripe":
        from entertainment_express.api.payments_stripe import stripe_webhook

        return stripe_webhook()
    cleaned = (sig or "").replace("sha256=", "")
    if len(cleaned) != len(expected) or not hmac.compare_digest(expected, cleaned):
        frappe.local.response.http_status_code = 400
        return {"error": "invalid signature"}

    try:
        body = json.loads(payload or "{}")
    except json.JSONDecodeError:
        frappe.local.response.http_status_code = 400
        return {"error": "invalid json"}

    event_id = str(body.get("id") or body.get("event_id") or body.get("eventId") or "")
    if not event_id:
        frappe.local.response.http_status_code = 400
        return {"error": "missing event id"}

    key = f"{processor}:{event_id}"[:140]
    if frappe.db.exists("Stripe Processed Event", key):
        return {"status": "already_processed"}

    frappe.db.sql(
        """INSERT IGNORE INTO `tabStripe Processed Event`
           (name, event_type, processed_at, creation, modified, modified_by, owner, docstatus)
           VALUES (%s, %s, %s, %s, %s, 'Administrator', 'Administrator', 0)
        """,
        (key, body.get("type") or processor, now_datetime(), now_datetime(), now_datetime()),
    )
    frappe.db.commit()

    obj = body.get("data") or body.get("object") or body
    if isinstance(obj, dict) and "object" in obj and isinstance(obj.get("object"), dict):
        obj = obj["object"]
    meta = obj.get("metadata") if isinstance(obj, dict) else {}
    meta = meta or body.get("metadata") or {}
    invoice_name = meta.get("invoice_name") or body.get("invoice_name") or ""
    booking_name = meta.get("booking_name") or body.get("booking_name") or ""
    txn = obj.get("id") if isinstance(obj, dict) else ""
    kind = (body.get("type") or "").lower()
    if "fail" in kind or "dispute" in kind:
        return {"status": "received", "outcome": "failed"}
    if invoice_name:
        apply_succeeded(invoice_name, booking_name, processor, str(txn or event_id))
    return {"status": "received"}
