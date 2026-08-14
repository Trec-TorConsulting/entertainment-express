"""Delivery status webhooks for Twilio / FCM."""

from __future__ import annotations

import hmac
import os

import frappe


@frappe.whitelist(allow_guest=True)
def twilio_status() -> dict:
    form = frappe.local.form_dict
    sid = form.get("MessageSid") or form.get("SmsSid")
    status = (form.get("MessageStatus") or form.get("SmsStatus") or "").lower()
    mapping = {
        "delivered": "delivered",
        "sent": "sent",
        "failed": "failed",
        "undelivered": "failed",
        "bounced": "bounced",
    }
    if not sid:
        frappe.local.response.http_status_code = 400
        return {"error": "missing sid"}
    name = frappe.db.get_value("Notification Log", {"provider_message_id": sid}, "name")
    if name:
        frappe.db.set_value("Notification Log", name, "status", mapping.get(status, status or "sent"))
        frappe.db.commit()
    return {"status": "ok"}


@frappe.whitelist(allow_guest=True)
def fcm_status() -> dict:
    token = os.environ.get("EE_FCM_WEBHOOK_TOKEN", "")
    got = frappe.get_request_header("X-EE-Webhook-Token") or ""
    if not token or not hmac.compare_digest(token, got):
        frappe.local.response.http_status_code = 401
        return {"error": "unauthorized"}
    data = frappe.request.json or frappe.local.form_dict
    mid = data.get("message_id")
    status = data.get("status") or "delivered"
    name = frappe.db.get_value("Notification Log", {"provider_message_id": mid}, "name")
    if name:
        frappe.db.set_value("Notification Log", name, "status", status)
        frappe.db.commit()
    return {"status": "ok"}
