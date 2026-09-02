"""Append-only audit on this site. Never log secrets."""

from __future__ import annotations

import json
import re

import frappe

_SECRET = re.compile(r"password|secret|token|authorization|api_key|bearer|sk_", re.I)


def _scrub(value):
    if isinstance(value, dict):
        out = {}
        for key, item in value.items():
            if _SECRET.search(str(key)):
                out[key] = "[redacted]"
            else:
                out[key] = _scrub(item)
        return out
    if isinstance(value, list):
        return [_scrub(item) for item in value]
    text = str(value) if value is not None else ""
    if _SECRET.search(text):
        return "[redacted]"
    return value


def _ip() -> str:
    try:
        return (
            frappe.get_request_header("X-Forwarded-For", "").split(",")[0].strip()
            or frappe.get_request_header("X-Real-Ip", "")
            or ""
        )
    except Exception:
        return ""


def write(action: str, related_doctype: str = "", related_name: str = "", before=None, after=None, extra=None) -> None:
    if not frappe.db.exists("DocType", "EE Audit Log"):
        return
    payload = _scrub({"before": before, "after": after, "extra": extra})
    try:
        detail = json.dumps(payload, default=str)[:1000]
    except Exception:
        detail = ""
    actor = getattr(getattr(frappe, "session", None), "user", "") or ""
    frappe.get_doc(
        {
            "doctype": "EE Audit Log",
            "action": (action or "")[:140],
            "actor": actor[:140],
            "ip": _ip()[:140],
            "related_doctype": (related_doctype or "")[:140],
            "related_name": (related_name or "")[:140],
            "detail": detail,
        }
    ).insert(ignore_permissions=True)
    try:
        frappe.db.commit()
    except Exception:
        pass
