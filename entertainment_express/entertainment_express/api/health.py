"""Health endpoints used by infrastructure probes."""

import frappe


@frappe.whitelist(allow_guest=True)
def ping():
    return {"message": "pong"}
