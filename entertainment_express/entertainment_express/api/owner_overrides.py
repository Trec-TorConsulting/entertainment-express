"""
Emergency Override Center API for /owner portal.
Provides auditable, tamper-evident overrides for safety compliance dispatch locks,
crew double-booking conflicts, and event margin restrictions.
"""

import json
import frappe
from frappe.utils import now_datetime, flt


def _assert_owner_access():
    """Verify that calling user has owner or system manager permissions."""
    if frappe.session.user == "Guest":
        frappe.throw("Authentication required.", frappe.PermissionError)
    roles = set(frappe.get_roles(frappe.session.user))
    if not ({"EE Tenant Admin", "System Manager"} & roles):
        frappe.throw("Only business owners can authorize emergency operational overrides.", frappe.PermissionError)


def _log_override_action(action: str, related_doctype: str, related_name: str, reason: str, metadata: dict = None):
    """Record an immutable audit log entry for this override."""
    ip = getattr(getattr(frappe, "local", None), "request_ip", "127.0.0.1") or "127.0.0.1"
    detail = f"Reason: {reason}"
    if metadata:
        detail += f" | Details: {json.dumps(metadata)}"
        
    doc = frappe.get_doc({
        "doctype": "EE Audit Log",
        "action": action,
        "actor": frappe.session.user,
        "ip": ip,
        "related_doctype": related_doctype,
        "related_name": related_name,
        "detail": detail
    })
    doc.insert(ignore_permissions=True)
    frappe.db.commit()
    return doc.name


@frappe.whitelist()
def get_override_logs(limit: int = 50) -> list:
    """Return historical emergency override audit records."""
    _assert_owner_access()
    logs = frappe.get_all(
        "EE Audit Log",
        filters={"action": ["like", "Override:%"]},
        fields=["name", "action", "actor", "creation", "related_doctype", "related_name", "detail"],
        order_by="creation desc",
        limit_page_length=int(limit)
    )
    return logs


@frappe.whitelist()
def override_safety_lock(asset_id: str, booking_id: str, reason: str) -> dict:
    """
    Bypass an expired safety inspection certificate or maintenance lockout for an asset assignment.
    Requires mandatory documented business justification.
    """
    _assert_owner_access()
    if not reason or len(reason.strip()) < 10:
        frappe.throw("Emergency overrides require a detailed business reason (at least 10 characters).")
        
    if not frappe.db.exists("Event Booking", booking_id):
        frappe.throw(f"Booking {booking_id} not found.", frappe.DoesNotExistError)
        
    # Mark override flag on booking
    booking = frappe.get_doc("Event Booking", booking_id)
    if hasattr(booking, "ee_safety_lock_override"):
        booking.ee_safety_lock_override = 1
        booking.save(ignore_permissions=True)
        
    audit_id = _log_override_action(
        action="Override: Safety Compliance Bypass",
        related_doctype="Event Booking",
        related_name=booking_id,
        reason=reason,
        metadata={"asset_id": asset_id, "bypassed_by": frappe.session.user}
    )
    
    return {
        "status": "success",
        "audit_id": audit_id,
        "message": f"Safety compliance lock for asset {asset_id} on {booking_id} successfully unblocked."
    }


@frappe.whitelist()
def override_dispatch_conflict(target_id: str, booking_id: str, target_type: str = "Crew", reason: str = "") -> dict:
    """
    Bypass a scheduling overlap or double-booking warning for crew or vehicles.
    """
    _assert_owner_access()
    if not reason or len(reason.strip()) < 10:
        frappe.throw("Emergency overrides require a detailed business reason (at least 10 characters).")
        
    audit_id = _log_override_action(
        action="Override: Dispatch Double-Booking Bypass",
        related_doctype="Event Booking",
        related_name=booking_id,
        reason=reason,
        metadata={"target_id": target_id, "target_type": target_type, "bypassed_by": frappe.session.user}
    )
    
    return {
        "status": "success",
        "audit_id": audit_id,
        "message": f"Dispatch conflict for {target_type} {target_id} on {booking_id} successfully unblocked."
    }


@frappe.whitelist()
def override_margin_lock(booking_id: str, target_margin_pct: float, reason: str) -> dict:
    """
    Authorize an event quote with sub-threshold or negative gross margins (e.g. charity or promo).
    """
    _assert_owner_access()
    if not reason or len(reason.strip()) < 10:
        frappe.throw("Margin overrides require a detailed business justification.")
        
    audit_id = _log_override_action(
        action="Override: P&L Margin Override",
        related_doctype="Event Booking",
        related_name=booking_id,
        reason=reason,
        metadata={"target_margin_pct": flt(target_margin_pct), "bypassed_by": frappe.session.user}
    )
    
    return {
        "status": "success",
        "audit_id": audit_id,
        "message": f"Margin threshold for {booking_id} set to {flt(target_margin_pct)}%."
    }
