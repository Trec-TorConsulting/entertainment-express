"""Payer requests to move, add, or cancel a job. Owner decides. Guests 403."""

from __future__ import annotations

import frappe
from frappe.utils import flt

from entertainment_express.api.booking import cancel_booking, reschedule_booking
from entertainment_express.api.portal_client import _require_payer
from entertainment_express.api.portal_collaboration import _is_payer
from entertainment_express.api.portal_owner import OWNER_ROLES, _require_owner

GUEST_ROLE = "EE Event Guest"
PAYER_ROLE = "EE Customer"
TYPES = ("reschedule", "add_on", "cancel")


def _roles() -> set[str]:
    return set(frappe.get_roles() or [])


def _deny_guest() -> None:
    roles = _roles()
    if GUEST_ROLE in roles and PAYER_ROLE not in roles:
        frappe.throw("Only the host can do this.", frappe.PermissionError)


def _payload(doc) -> dict:
    event = frappe.db.get_value("Event Booking", doc.booking, "event_name") if doc.booking else ""
    return {
        "id": doc.name,
        "booking": doc.booking,
        "event_name": event or doc.booking,
        "request_type": doc.request_type,
        "status": doc.status,
        "requested_date": str(doc.requested_date or ""),
        "requested_start": str(doc.requested_start or ""),
        "requested_end": str(doc.requested_end or ""),
        "item_code": doc.item_code or "",
        "notes": doc.notes or "",
    }


def _apply(doc) -> None:
    if doc.request_type == "reschedule":
        if not doc.requested_date:
            frappe.throw("Pick a new date.")
        reschedule_booking(doc.booking, str(doc.requested_date), doc.requested_start, doc.requested_end)
        doc.status = "applied"
        return
    if doc.request_type == "cancel":
        cancel_booking(doc.booking, doc.notes or "")
        doc.status = "applied"
        return
    item_code = (doc.item_code or "").strip()
    if item_code and frappe.db.exists("Item", item_code):
        booking = frappe.get_doc("Event Booking", doc.booking)
        rate = flt(frappe.db.get_value("Item", item_code, "standard_rate") or 0)
        qty = flt(1)
        amount = flt(qty) * flt(rate)
        booking.append(
            "service_items",
            {
                "item": item_code,
                "qty": qty,
                "rate": rate,
                "amount": amount,
                "client_visible": 1,
            },
        )
        booking.grand_total = flt(booking.grand_total) + amount
        booking.balance_due = flt(booking.balance_due) + amount
        booking.save(ignore_permissions=True)
        doc.status = "applied"
        return
    doc.status = "approved"


@frappe.whitelist()
def request_change(
    booking: str,
    request_type: str,
    notes: str = "",
    requested_date: str | None = None,
    requested_start: str | None = None,
    requested_end: str | None = None,
    item_code: str | None = None,
) -> dict:
    _deny_guest()
    _require_payer()
    if request_type not in TYPES:
        frappe.throw("Pick reschedule, an add-on, or cancel.")
    if not frappe.db.exists("Event Booking", booking):
        frappe.throw("That event was not found.")
    if not _is_payer(booking, frappe.session.user) and not _roles().intersection(OWNER_ROLES):
        frappe.throw("Only the host can do this.", frappe.PermissionError)
    doc = frappe.get_doc(
        {
            "doctype": "EE Booking Change",
            "booking": booking,
            "request_type": request_type,
            "status": "pending",
            "requested_date": requested_date,
            "requested_start": requested_start,
            "requested_end": requested_end,
            "item_code": item_code or "",
            "notes": (notes or "")[:500],
            "requested_by": frappe.session.user,
        }
    )
    doc.insert(ignore_permissions=True)
    try:
        from entertainment_express.notifications import send

        send(
            "booking_change_requested",
            frappe.session.user,
            {"booking": booking, "request_type": request_type},
            related_doctype="EE Booking Change",
            related_name=doc.name,
        )
    except Exception:
        pass
    return _payload(doc)


@frappe.whitelist()
def list_changes(booking: str | None = None) -> list[dict]:
    _deny_guest()
    roles = _roles()
    if not frappe.db.table_exists("EE Booking Change"):
        return []
    filters: dict = {}
    if booking:
        filters["booking"] = booking
    if not roles.intersection(OWNER_ROLES | {"EE Sales", "System Manager"}):
        _require_payer()
        filters["requested_by"] = frappe.session.user
    else:
        _require_owner()
    rows = []
    for row in frappe.get_all(
        "EE Booking Change",
        filters=filters,
        fields=["name"],
        order_by="modified desc",
        limit_page_length=50,
    ):
        rows.append(_payload(frappe.get_doc("EE Booking Change", row.name)))
    return rows


@frappe.whitelist()
def decide_change(name: str, decision: str) -> dict:
    _deny_guest()
    _require_owner()
    doc = frappe.get_doc("EE Booking Change", name)
    if decision in ("approved", "approve"):
        _apply(doc)
    else:
        doc.status = "declined"
    doc.save(ignore_permissions=True)
    return _payload(doc)
