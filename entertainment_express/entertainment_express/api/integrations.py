"""Owner connections, geocode, iCal, inbound webhooks. This site only."""

from __future__ import annotations

import hashlib
import hmac
import json
import os
import secrets as pysecrets

import frappe
from frappe.utils import now_datetime

from entertainment_express.integrations.credentials import PROVIDERS, secrets as read_secrets
from entertainment_express.security.access import require_roles

GUEST_ROLE = "EE Event Guest"
OWNER = ["EE Tenant Admin", "System Manager"]
CREW = {"EE Crew", "EE Entertainer"}
LABELS = {
    "google_calendar": "Google Calendar",
    "microsoft_365": "Microsoft 365",
    "ical": "Calendar feed",
    "mapbox": "Mapbox",
    "google_maps": "Google Maps",
    "docusign": "DocuSign",
    "quickbooks": "QuickBooks",
    "xero": "Xero",
    "spotify": "Spotify",
    "apple_music": "Apple Music",
    "youtube": "YouTube",
}


def _user() -> str:
    return getattr(getattr(frappe, "session", None), "user", "") or ""


def _roles() -> set[str]:
    return set(frappe.get_roles() or [])


def _deny_guest() -> None:
    user = _user()
    if user in ("Guest", "guest") or not user:
        frappe.throw("Not allowed.", frappe.PermissionError)
    roles = _roles()
    if GUEST_ROLE in roles and not roles.intersection(set(OWNER) | {"EE Sales", "EE Office", "EE Dispatcher", "EE Accounting"}):
        frappe.throw("Not allowed.", frappe.PermissionError)


def _deny_crew_write() -> None:
    _deny_guest()
    roles = _roles()
    if roles.intersection(CREW) and not roles.intersection(set(OWNER)):
        frappe.throw("Not allowed.", frappe.PermissionError)


@frappe.whitelist()
def list_connections() -> list[dict]:
    _deny_guest()
    require_roles(*OWNER, "EE Office")
    rows = []
    existing = {}
    if frappe.db.exists("DocType", "Integration Config"):
        for row in frappe.get_all("Integration Config", fields=["provider", "enabled", "status", "last_error"]):
            get = row.get if isinstance(row, dict) else lambda k, d=None: getattr(row, k, d)
            existing[get("provider")] = row
    for provider in PROVIDERS:
        row = existing.get(provider) or {}
        get = row.get if isinstance(row, dict) else lambda k, d=None: getattr(row, k, d)
        rows.append(
            {
                "provider": provider,
                "label": LABELS.get(provider, provider),
                "enabled": int(get("enabled") or 0),
                "status": get("status") or "disconnected",
                "last_error": get("last_error") or "",
            }
        )
    return rows


@frappe.whitelist()
def save_connection(provider: str, enabled: int = 0, credentials: dict | str | None = None, settings: dict | str | None = None) -> dict:
    _deny_crew_write()
    require_roles(*OWNER)
    if provider not in PROVIDERS:
        frappe.throw("Unknown connection.")
    if isinstance(credentials, str):
        credentials = frappe.parse_json(credentials) if hasattr(frappe, "parse_json") else json.loads(credentials or "{}")
    if isinstance(settings, str):
        settings = frappe.parse_json(settings) if hasattr(frappe, "parse_json") else json.loads(settings or "{}")
    payload = json.dumps(credentials or {})
    settings_json = json.dumps(settings or {})
    if frappe.db.exists("Integration Config", provider):
        doc = frappe.get_doc("Integration Config", provider)
        doc.enabled = 1 if int(enabled or 0) else 0
        doc.settings = settings_json
        if credentials:
            doc.credentials = payload
        doc.status = "connected" if doc.enabled and credentials else ("disconnected" if not doc.enabled else doc.status)
        doc.save()
    else:
        doc = frappe.get_doc(
            {
                "doctype": "Integration Config",
                "provider": provider,
                "enabled": 1 if int(enabled or 0) else 0,
                "status": "connected" if int(enabled or 0) else "disconnected",
                "settings": settings_json,
                "credentials": payload,
            }
        )
        doc.insert()
    frappe.db.commit()
    return {"provider": provider, "enabled": int(doc.enabled or 0), "status": doc.status, "last_error": getattr(doc, "last_error", "") or ""}


@frappe.whitelist()
def rotate_ical_token() -> dict:
    _deny_crew_write()
    require_roles(*OWNER)
    token = pysecrets.token_urlsafe(24)
    hashed = hashlib.sha256(token.encode()).hexdigest()
    save_connection("ical", 1, {"feed_token_hash": hashed}, {})
    return {"token": token, "url": f"{frappe.utils.get_url()}/api/method/entertainment_express.api.integrations.ical_feed?token={token}"}


@frappe.whitelist()
def geocode(address: str) -> dict:
    _deny_guest()
    from entertainment_express.integrations.maps import geocode as _geocode

    return _geocode(address)


@frappe.whitelist(allow_guest=True)
def ical_feed(token: str | None = None) -> str:
    token = (token or "").strip()
    expected = (read_secrets("ical") or {}).get("feed_token_hash")
    if not token or not expected or hashlib.sha256(token.encode()).hexdigest() != expected:
        frappe.throw("Not allowed.", frappe.PermissionError)
    from entertainment_express.integrations.calendar import ical_body

    frappe.local.response.headers = getattr(frappe.local.response, "headers", {}) or {}
    try:
        frappe.local.response.headers["Content-Type"] = "text/calendar; charset=utf-8"
    except Exception:
        pass
    return ical_body()


@frappe.whitelist(allow_guest=True)
def inbound_webhook(provider: str) -> dict:
    provider = (provider or "").strip()
    if provider not in PROVIDERS and provider != "docusign":
        frappe.local.response.http_status_code = 400
        return {"error": "unknown provider"}
    if not _verify_webhook(provider):
        frappe.local.response.http_status_code = 401
        return {"error": "unauthorized"}
    payload = {}
    try:
        payload = frappe.request.json or frappe.local.form_dict or {}
    except Exception:
        payload = frappe.local.form_dict or {}
    event_id = str(payload.get("id") or payload.get("eventId") or payload.get("envelopeId") or "")[:140]
    event_type = str(payload.get("event") or payload.get("type") or payload.get("event_type") or "")[:140]
    if not event_id:
        event_id = hashlib.sha256(json.dumps(payload, default=str).encode()).hexdigest()[:40]
    if frappe.db.exists("Integration Webhook Event", {"event_id": event_id, "provider": provider}):
        return {"status": "already_processed"}
    frappe.get_doc(
        {
            "doctype": "Integration Webhook Event",
            "provider": provider,
            "event_id": event_id,
            "event_type": event_type,
            "processed": 0,
            "received_at": now_datetime(),
        }
    ).insert(ignore_permissions=True)
    frappe.enqueue(
        "entertainment_express.api.integrations._process_webhook",
        provider=provider,
        event_id=event_id,
        event_type=event_type,
        payload=payload,
        queue="short",
    )
    frappe.db.commit()
    return {"status": "received"}


def _verify_webhook(provider: str) -> bool:
    if provider == "docusign":
        secret = (read_secrets("docusign") or {}).get("webhook_secret") or os.environ.get("EE_DOCUSIGN_WEBHOOK_SECRET", "")
        got = frappe.get_request_header("X-DocuSign-Signature-1") or frappe.get_request_header("X-EE-Webhook-Token") or ""
        if not secret:
            return False
        return hmac.compare_digest(secret, got)
    token = os.environ.get("EE_INTEGRATION_WEBHOOK_TOKEN") or (read_secrets(provider) or {}).get("webhook_token") or ""
    got = frappe.get_request_header("X-EE-Webhook-Token") or ""
    if not token:
        return False
    return hmac.compare_digest(str(token), str(got))


def _process_webhook(provider: str, event_id: str, event_type: str, payload: dict) -> None:
    if provider == "docusign" and (event_type or "").lower() in ("envelope-completed", "completed"):
        from entertainment_express.integrations.docusign import handle_completed

        handle_completed(str(payload.get("envelopeId") or payload.get("id") or ""))
    name = frappe.db.get_value("Integration Webhook Event", {"event_id": event_id, "provider": provider}, "name")
    if name:
        frappe.db.set_value("Integration Webhook Event", name, "processed", 1)
        frappe.db.commit()
