"""Per-site encrypted credentials. Never log secret values."""

from __future__ import annotations

import json

import frappe

PROVIDERS = (
    "google_calendar",
    "microsoft_365",
    "ical",
    "mapbox",
    "google_maps",
    "docusign",
    "quickbooks",
    "xero",
    "spotify",
    "apple_music",
    "youtube",
    "stripe",
    "square",
    "paypal",
    "ach",
    "authorizenet",
)


def secrets(provider: str) -> dict:
    if not provider or not frappe.db.exists("DocType", "Integration Config"):
        return {}
    if not frappe.db.exists("Integration Config", provider):
        return {}
    doc = frappe.get_doc("Integration Config", provider)
    if not int(doc.enabled or 0):
        return {}
    try:
        raw = doc.get_password("credentials") if hasattr(doc, "get_password") else (doc.credentials or "")
        if not raw:
            return {}
        data = json.loads(raw) if isinstance(raw, str) else (raw or {})
        return data if isinstance(data, dict) else {}
    except Exception:
        return {}


def settings(provider: str) -> dict:
    if not frappe.db.exists("DocType", "Integration Config"):
        return {}
    if not frappe.db.exists("Integration Config", provider):
        return {}
    doc = frappe.get_doc("Integration Config", provider)
    raw = doc.settings or "{}"
    try:
        data = json.loads(raw) if isinstance(raw, str) else (raw or {})
        return data if isinstance(data, dict) else {}
    except Exception:
        return {}


def is_enabled(provider: str) -> bool:
    if not frappe.db.exists("DocType", "Integration Config"):
        return False
    return bool(frappe.db.get_value("Integration Config", provider, "enabled"))


def set_status(provider: str, status: str, last_error: str = "") -> None:
    if not frappe.db.exists("Integration Config", provider):
        return
    frappe.db.set_value("Integration Config", provider, {"status": status, "last_error": (last_error or "")[:500]})
