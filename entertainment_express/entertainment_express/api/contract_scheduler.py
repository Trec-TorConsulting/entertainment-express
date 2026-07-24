"""
Contract scheduler — called hourly by scheduler_events in hooks.py.
Marks past-expiry contracts as expired and notifies owners.
"""

import frappe
from frappe.utils import now_datetime


def expire_contracts() -> None:
    """Expire contracts past their expires_at date."""
    expired = frappe.get_all(
        "EE Contract",
        filters={"status": ["in", ["sent", "viewed"]], "expires_at": ("<", now_datetime())},
        fields=["name", "signer_email", "quotation"],
    )
    for c in expired:
        frappe.db.set_value("EE Contract", c["name"], "status", "expired")
        # Notify sales owner
        if c.get("quotation"):
            owner = frappe.db.get_value("Quotation", c["quotation"], "owner")
            if owner:
                owner_email = frappe.db.get_value("User", owner, "email")
                if owner_email:
                    from entertainment_express.notifications import send
                    send("contract_expired", owner_email, {
                        "contract_name": c["name"],
                        "signer_email": c.get("signer_email", ""),
                    })

    if expired:
        frappe.db.commit()
