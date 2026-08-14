"""
Notification sender for Entertainment Express.

All sends are enqueued (never block web requests).
Supports email, SMS, WhatsApp, and push with preferences, quiet hours, and fallback.
Unconfigured channels are logged as failed — never reported as delivered.
"""

from __future__ import annotations

import json
import os
from datetime import datetime, time
from urllib.parse import urlencode
from urllib.request import Request, urlopen

import frappe
from frappe.utils import now_datetime, get_datetime


def send(
    template_key: str,
    recipient: str,
    context: dict,
    channels: list[str] | None = None,
    party_type: str | None = None,
    party: str | None = None,
    related_doctype: str | None = None,
    related_name: str | None = None,
) -> None:
    frappe.enqueue(
        "entertainment_express.notifications._send_now",
        template_key=template_key,
        recipient=recipient,
        context=context,
        channels=channels,
        party_type=party_type,
        party=party,
        related_doctype=related_doctype,
        related_name=related_name,
        queue="short",
        is_async=True,
    )


def _send_now(
    template_key: str,
    recipient: str,
    context: dict,
    channels=None,
    party_type=None,
    party=None,
    related_doctype=None,
    related_name=None,
) -> None:
    template_name = frappe.db.get_value(
        "Notification Template", {"template_key": template_key, "active": 1}, "name"
    )
    if not template_name:
        frappe.logger().warning(f"[EE notifications] No active template for key '{template_key}'")
        return

    tmpl = frappe.get_doc("Notification Template", template_name)
    subject = frappe.render_template(tmpl.subject, context)
    body = frappe.render_template(tmpl.body_html, context)
    text = frappe.utils.strip_html(body)
    wanted = channels or _channels_of(tmpl)
    fallback = (getattr(tmpl, "fallback_channel", None) or "email").strip()
    priority = (getattr(tmpl, "priority", None) or "transactional").strip()
    prefs = _prefs(party_type, party, recipient)

    delivered_any = False
    for channel in wanted:
        if not _allowed(channel, prefs, priority):
            _log(recipient, channel, template_key, "failed", error="opted_out", related_doctype=related_doctype, related_name=related_name)
            continue
        if _in_quiet_hours(prefs) and priority != "transactional":
            _log(
                recipient,
                channel,
                template_key,
                "deferred",
                related_doctype=related_doctype,
                related_name=related_name,
                scheduled_for=now_datetime(),
            )
            continue
        ok, err, mid, provider = _deliver_channel(channel, recipient, subject, body, text)
        _log(
            recipient,
            channel,
            template_key,
            "sent" if ok else "failed",
            provider=provider,
            provider_message_id=mid,
            error=err,
            related_doctype=related_doctype,
            related_name=related_name,
        )
        delivered_any = delivered_any or ok

    if not delivered_any and fallback and fallback not in wanted:
        ok, err, mid, provider = _deliver_channel(fallback, recipient, subject, body, text)
        _log(
            recipient,
            fallback,
            template_key,
            "sent" if ok else "failed",
            provider=provider,
            provider_message_id=mid,
            error=err or "fallback",
            related_doctype=related_doctype,
            related_name=related_name,
        )


def retry_failed():
    rows = frappe.get_all(
        "Notification Log",
        filters={"status": "failed", "attempts": ["<", 5]},
        fields=["name", "recipient", "channel", "template_key", "error", "attempts"],
        limit_page_length=100,
    )
    for row in rows:
        if row.error in ("opted_out", "not_configured"):
            continue
        tmpl = frappe.db.get_value("Notification Template", {"template_key": row.template_key}, ["subject", "body_html"], as_dict=True)
        if not tmpl:
            continue
        ok, err, mid, provider = _deliver_channel(row.channel, row.recipient, tmpl.subject, tmpl.body_html, frappe.utils.strip_html(tmpl.body_html))
        frappe.db.set_value(
            "Notification Log",
            row.name,
            {
                "status": "sent" if ok else "failed",
                "error": err,
                "provider_message_id": mid,
                "provider": provider,
                "attempts": int(row.attempts or 0) + 1,
            },
        )
    frappe.db.commit()


def send_deferred():
    rows = frappe.get_all("Notification Log", filters={"status": "deferred"}, fields=["name", "recipient", "channel", "template_key"])
    for row in rows:
        tmpl = frappe.get_doc("Notification Template", {"template_key": row.template_key})
        subject = tmpl.subject
        body = tmpl.body_html
        ok, err, mid, provider = _deliver_channel(row.channel, row.recipient, subject, body, frappe.utils.strip_html(body))
        frappe.db.set_value(
            "Notification Log",
            row.name,
            {"status": "sent" if ok else "failed", "error": err, "provider_message_id": mid, "provider": provider},
        )
    frappe.db.commit()


def _channels_of(tmpl) -> list[str]:
    raw = (getattr(tmpl, "channels", None) or "email").replace(" ", "")
    return [c for c in raw.split(",") if c]


def _prefs(party_type, party, recipient) -> dict:
    if party_type and party and frappe.db.exists("Notification Preference", {"party_type": party_type, "party": party}):
        return frappe.db.get_value(
            "Notification Preference",
            {"party_type": party_type, "party": party},
            ["email_opt_in", "sms_opt_in", "whatsapp_opt_in", "push_opt_in", "quiet_hours_start", "quiet_hours_end", "timezone"],
            as_dict=True,
        )
    return {
        "email_opt_in": 1,
        "sms_opt_in": 0,
        "whatsapp_opt_in": 0,
        "push_opt_in": 0,
        "quiet_hours_start": None,
        "quiet_hours_end": None,
    }


def _allowed(channel: str, prefs: dict, priority: str) -> bool:
    if channel == "email":
        return True if priority == "transactional" else bool(prefs.get("email_opt_in", 1))
    if channel == "sms":
        return bool(prefs.get("sms_opt_in"))
    if channel == "whatsapp":
        return bool(prefs.get("whatsapp_opt_in"))
    if channel == "push":
        return bool(prefs.get("push_opt_in"))
    return False


def _in_quiet_hours(prefs: dict) -> bool:
    start = prefs.get("quiet_hours_start")
    end = prefs.get("quiet_hours_end")
    if not start or not end:
        return False
    now = datetime.now().time()
    s = start if isinstance(start, time) else get_datetime(str(start)).time()
    e = end if isinstance(end, time) else get_datetime(str(end)).time()
    if s <= e:
        return s <= now <= e
    return now >= s or now <= e


def _deliver_channel(channel, recipient, subject, body, text):
    if channel == "email":
        frappe.sendmail(recipients=[recipient], subject=subject, message=body, now=True)
        return True, "", "", "frappe"
    if channel in ("sms", "whatsapp"):
        return _twilio(channel, recipient, text)
    if channel == "push":
        return _fcm(recipient, subject, text)
    return False, "unknown_channel", "", ""


def _twilio(channel, to, body):
    sid = os.environ.get("EE_TWILIO_ACCOUNT_SID", "")
    token = os.environ.get("EE_TWILIO_AUTH_TOKEN", "")
    from_n = os.environ.get("EE_TWILIO_WHATSAPP_FROM" if channel == "whatsapp" else "EE_TWILIO_FROM", "")
    if not (sid and token and from_n):
        return False, "not_configured", "", "twilio"
    dest = f"whatsapp:{to}" if channel == "whatsapp" and not str(to).startswith("whatsapp:") else to
    src = from_n if channel == "sms" or str(from_n).startswith("whatsapp:") else f"whatsapp:{from_n}"
    if channel == "sms":
        src = from_n
    data = urlencode({"To": dest, "From": src, "Body": body[:1600]}).encode()
    req = Request(
        f"https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json",
        data=data,
        method="POST",
    )
    import base64

    req.add_header("Authorization", "Basic " + base64.b64encode(f"{sid}:{token}".encode()).decode())
    try:
        with urlopen(req, timeout=20) as resp:
            payload = json.loads(resp.read().decode())
        return True, "", payload.get("sid", ""), "twilio"
    except Exception as exc:
        return False, str(exc)[:180], "", "twilio"


def _fcm(to, title, body):
    cred = os.environ.get("EE_FCM_SERVER_KEY", "")
    if not cred:
        return False, "not_configured", "", "fcm"
    payload = json.dumps({"to": to, "notification": {"title": title, "body": body[:240]}}).encode()
    req = Request(
        "https://fcm.googleapis.com/fcm/send",
        data=payload,
        headers={"Authorization": f"key={cred}", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urlopen(req, timeout=20) as resp:
            data = json.loads(resp.read().decode())
        return True, "", str(data.get("message_id") or ""), "fcm"
    except Exception as exc:
        return False, str(exc)[:180], "", "fcm"


def _log(recipient, channel, template_key, status, provider="", provider_message_id="", error="", related_doctype=None, related_name=None, scheduled_for=None):
    try:
        if not frappe.db.exists("DocType", "Notification Log"):
            return
        frappe.get_doc(
            {
                "doctype": "Notification Log",
                "recipient": recipient,
                "channel": channel,
                "template_key": template_key,
                "status": status,
                "provider": provider,
                "provider_message_id": provider_message_id,
                "error": error,
                "related_doctype": related_doctype,
                "related_name": related_name,
                "scheduled_for": scheduled_for,
                "attempts": 1 if status != "queued" else 0,
            }
        ).insert(ignore_permissions=True)
    except Exception:
        frappe.logger().warning("[EE notifications] could not write Notification Log")
