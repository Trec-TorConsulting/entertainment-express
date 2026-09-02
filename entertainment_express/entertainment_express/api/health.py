"""Health endpoints used by infrastructure probes."""

import frappe


@frappe.whitelist(allow_guest=True)
def ping():
    return {"message": "pong"}


@frappe.whitelist(allow_guest=True)
def ready():
    try:
        frappe.db.sql("SELECT 1")
        return {"ok": True}
    except Exception:
        frappe.local.response.http_status_code = 503
        return {"ok": False}
