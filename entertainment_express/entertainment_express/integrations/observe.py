"""Sync log wrapper. Provider failures never raise to callers."""

from __future__ import annotations

import time

import frappe


def _scrub(text: str) -> str:
    low = (text or "").lower()
    if "authorization" in low or "bearer " in low or "sk_" in low or "password" in low:
        return "provider error (details omitted)"
    return (text or "")[:500]


def log_sync(provider: str, action: str, status: str, related_doctype: str = "", related_name: str = "", error: str = "", latency_ms: int = 0, direction: str = "out"):
    if not frappe.db.exists("DocType", "Integration Sync Log"):
        return
    frappe.get_doc(
        {
            "doctype": "Integration Sync Log",
            "provider": provider,
            "direction": direction,
            "action": action,
            "status": status,
            "related_doctype": related_doctype,
            "related_name": related_name,
            "error": _scrub(error),
            "latency_ms": int(latency_ms or 0),
        }
    ).insert(ignore_permissions=True)
    frappe.db.commit()


def run(provider: str, action: str, fn, related_doctype: str = "", related_name: str = ""):
    start = time.time()
    try:
        result = fn()
        log_sync(provider, action, "ok", related_doctype, related_name, latency_ms=int((time.time() - start) * 1000))
        from entertainment_express.integrations.credentials import set_status

        set_status(provider, "connected", "")
        return result
    except Exception as exc:
        log_sync(provider, action, "error", related_doctype, related_name, error=str(exc), latency_ms=int((time.time() - start) * 1000))
        from entertainment_express.integrations.credentials import set_status

        set_status(provider, "error", _scrub(str(exc)))
        return None
