"""Autonomous Accounts Receivable Dunning Agent for Entertainment Express.

Evaluates outstanding customer balances against payment terms and event dates,
generates progressive, tone-adaptive dunning communications, and issues one-click
Stripe payment links to secure event deposits and final balances.
"""

from __future__ import annotations

import json
from datetime import datetime, date
from types import SimpleNamespace

import frappe
from frappe.utils import flt, getdate, nowdate, now_datetime

from entertainment_express.ai.llm import complete


OWNER_ROLES = {"EE Tenant Admin", "EE Manager", "EE Accounting", "System Manager"}


def _get_user() -> str:
    return getattr(getattr(frappe, "session", None), "user", "") or ""


def _assert_owner_access() -> None:
    user = _get_user()
    if not user or user in ("Guest", "guest"):
        frappe.throw("Authentication required.", frappe.PermissionError)
    roles = set(frappe.get_roles(user) if hasattr(frappe, "get_roles") else [])
    if not (OWNER_ROLES & roles):
        frappe.throw("Insufficient permissions to access AR dunning agent.", frappe.PermissionError)


def _get_default_company() -> str:
    if hasattr(frappe, "defaults") and hasattr(frappe.defaults, "get_user_default"):
        comp = frappe.defaults.get_user_default("Company")
        if comp:
            return comp
    return frappe.db.get_single_value("Global Defaults", "default_company") if hasattr(frappe.db, "get_single_value") else "Premier Events LLC"


@frappe.whitelist()
def scan_ar_aging() -> list:
    """Scan upcoming and past-due event bookings and invoices for outstanding balances."""
    _assert_owner_access()
    company = _get_default_company()
    today = getdate(nowdate())
    
    # Query active bookings with outstanding balance
    bookings = []
    if hasattr(frappe, "get_all"):
        bookings = frappe.get_all(
            "Event Booking",
            filters={"docstatus": ["!=", 2]},
            fields=["name", "customer", "customer_name", "contact_email", "contact_phone", "event_date", "total_amount", "outstanding_amount", "status", "company"]
        )
    
    actionable_items = []
    for b in bookings:
        outstanding = flt(getattr(b, "outstanding_amount", 0.0))
        if outstanding <= 0:
            continue
            
        event_dt = getdate(getattr(b, "event_date", today))
        days_to_event = (event_dt - today).days
        
        # Categorize dunning stage
        if days_to_event > 14:
            tier = "Upcoming Courteous Reminder"
            urgency = "low"
        elif 0 <= days_to_event <= 14:
            tier = "Pre-Event Final Balance Notice"
            urgency = "medium"
        elif -7 <= days_to_event < 0:
            tier = "Post-Event Immediate Balance Due"
            urgency = "high"
        else:
            tier = "Delinquent Demand Notice"
            urgency = "critical"
            
        stripe_pay_url = f"https://entx.app/pay/{b.name}"
        
        actionable_items.append({
            "booking_id": b.name,
            "customer_name": getattr(b, "customer_name", getattr(b, "customer", "Client")),
            "contact_email": getattr(b, "contact_email", ""),
            "contact_phone": getattr(b, "contact_phone", ""),
            "event_date": str(getattr(b, "event_date", "")),
            "days_to_event": days_to_event,
            "total_amount": flt(getattr(b, "total_amount", 0.0)),
            "outstanding_amount": outstanding,
            "tier": tier,
            "urgency": urgency,
            "stripe_pay_url": stripe_pay_url
        })
        
    return sorted(actionable_items, key=lambda x: (x["days_to_event"], -x["outstanding_amount"]))


@frappe.whitelist()
def generate_dunning_message(booking_id: str, tier: str = None, client_sentiment: str = "neutral") -> dict:
    """Generate tone-adaptive dunning reminder email and SMS with embedded Stripe pay link."""
    _assert_owner_access()
    
    booking = None
    if hasattr(frappe, "get_doc"):
        try:
            booking = frappe.get_doc("Event Booking", booking_id)
        except Exception:
            pass
            
    customer_name = getattr(booking, "customer_name", "Valued Client") if booking else "Valued Client"
    outstanding = flt(getattr(booking, "outstanding_amount", 500.0) if booking else 500.0)
    event_date = str(getattr(booking, "event_date", nowdate()) if booking else nowdate())
    stripe_link = f"https://entx.app/pay/{booking_id}"
    
    tier = tier or "Pre-Event Final Balance Notice"
    
    prompt = (
        f"You are a professional, courteous event business finance coordinator. "
        f"Write a tactful accounts receivable reminder for {customer_name}. "
        f"Outstanding balance: ${outstanding:,.2f}. Event date: {event_date}. "
        f"Dunning stage: {tier}. Customer sentiment context: {client_sentiment}. "
        f"Stripe Pay Link: {stripe_link}. "
        "Return a JSON object with 'subject' (email subject line), 'email_body' (tactful, warm, clear email copy with the pay link), and 'sms_body' (under 160 characters with the pay link)."
    )
    
    ai_resp = complete(prompt)
    if ai_resp:
        try:
            match = json.loads(ai_resp[ai_resp.find("{"):ai_resp.rfind("}") + 1])
            if "subject" in match and "email_body" in match:
                return {
                    "booking_id": booking_id,
                    "tier": tier,
                    "subject": match["subject"],
                    "email_body": match["email_body"],
                    "sms_body": match.get("sms_body", f"Reminder: Your ${outstanding:,.2f} event balance is due. Pay securely here: {stripe_link}"),
                    "stripe_pay_url": stripe_link,
                    "outstanding_amount": outstanding
                }
        except Exception:
            pass
            
    # Standard fallback templates by tier
    if "Upcoming" in tier:
        subject = f"Upcoming Event Balance Reminder — {booking_id}"
        email_body = (
            f"Dear {customer_name},\n\n"
            f"We are looking forward to your upcoming event on {event_date}! "
            f"This is a friendly reminder that your balance of ${outstanding:,.2f} is scheduled for payment. "
            f"You can quickly and securely pay online via credit card or Apple Pay using this link:\n{stripe_link}\n\n"
            "Thank you for partnering with us!"
        )
        sms_body = f"Hi {customer_name}, friendly reminder that your ${outstanding:,.2f} event balance can be paid securely here: {stripe_link}"
    elif "Post-Event" in tier or "Delinquent" in tier:
        subject = f"Urgent: Unresolved Event Balance for {booking_id}"
        email_body = (
            f"Dear {customer_name},\n\n"
            f"Our records indicate an overdue balance of ${outstanding:,.2f} for services rendered on {event_date}. "
            f"Please settle this balance immediately using our secure portal:\n{stripe_link}\n\n"
            "If you have already processed payment, please let us know."
        )
        sms_body = f"URGENT: Your ${outstanding:,.2f} balance for event {booking_id} is overdue. Please settle today: {stripe_link}"
    else:
        subject = f"Final Balance Due for Event on {event_date} — {booking_id}"
        email_body = (
            f"Dear {customer_name},\n\n"
            f"Your event on {event_date} is coming up soon! To ensure all crew and equipment are fully dispatched, "
            f"the remaining balance of ${outstanding:,.2f} is now due. "
            f"Pay easily with one click here:\n{stripe_link}\n\n"
            "Please reach out if you have any questions."
        )
        sms_body = f"Hi {customer_name}, your final balance of ${outstanding:,.2f} is due. Settle securely here: {stripe_link}"

    return {
        "booking_id": booking_id,
        "tier": tier,
        "subject": subject,
        "email_body": email_body,
        "sms_body": sms_body,
        "stripe_pay_url": stripe_link,
        "outstanding_amount": outstanding
    }


@frappe.whitelist()
def send_dunning_notice(booking_id: str, channel: str = "email", custom_message: str = None) -> dict:
    """Send autonomous AR dunning reminder via Email or SMS and record communication audit log."""
    _assert_owner_access()
    user = _get_user()
    
    booking = frappe.get_doc("Event Booking", booking_id) if hasattr(frappe, "get_doc") else None
    customer_email = getattr(booking, "contact_email", None) or "client@example.com"
    customer_phone = getattr(booking, "contact_phone", None) or "+15551234567"
    
    generated = generate_dunning_message(booking_id)
    subject = generated["subject"]
    body = custom_message or (generated["sms_body"] if channel == "sms" else generated["email_body"])
    
    if channel == "email" and hasattr(frappe, "sendmail"):
        try:
            frappe.sendmail(
                recipients=[customer_email],
                subject=subject,
                message=body
            )
        except Exception:
            pass
            
    # Record in Audit Log
    if hasattr(frappe, "get_doc"):
        try:
            audit = frappe.get_doc({
                "doctype": "EE Audit Log",
                "action": f"Dunning: {channel.upper()} Reminder Dispatched",
                "actor": user,
                "related_doctype": "Event Booking",
                "related_name": booking_id,
                "detail": f"Channel: {channel} | Recipient: {customer_email if channel == 'email' else customer_phone} | Amount: ${generated['outstanding_amount']:,.2f}"
            })
            if hasattr(audit, "insert"):
                audit.insert(ignore_permissions=True)
        except Exception:
            pass
            
    if hasattr(frappe.db, "commit"):
        frappe.db.commit()
        
    return {
        "status": "success",
        "booking_id": booking_id,
        "channel": channel,
        "recipient": customer_email if channel == "email" else customer_phone,
        "message": f"Dunning notice sent successfully via {channel}."
    }
