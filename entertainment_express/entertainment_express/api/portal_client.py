"""Paying-customer portal APIs. Guests never reach money or contracts."""

from __future__ import annotations

import frappe
from frappe.utils import flt, fmt_money

from entertainment_express.api.portal_owner import OWNER_ROLES

PAYER_ROLE = "EE Customer"
GUEST_ROLE = "EE Event Guest"


def _require_payer() -> None:
    roles = set(frappe.get_roles() or [])
    if GUEST_ROLE in roles and PAYER_ROLE not in roles:
        frappe.throw("Only the host can do this.", frappe.PermissionError)
    if PAYER_ROLE not in roles and not roles.intersection(OWNER_ROLES):
        frappe.throw("Client portal access denied.", frappe.PermissionError)


def _customer_name() -> str | None:
    from entertainment_express.security.access import customer_name_for_user

    return customer_name_for_user()


def _money(amount) -> str:
    return fmt_money(flt(amount), currency=frappe.db.get_default("currency") or "USD")


@frappe.whitelist()
def list_invoices() -> list[dict]:
    _require_payer()
    customer = _customer_name()
    filters: dict = {"docstatus": ["<", 2]}
    if customer:
        filters["customer"] = customer
    else:
        return []
    fields = ["name", "customer_name", "outstanding_amount", "grand_total", "status"]
    if frappe.get_meta("Sales Invoice").has_field("ee_booking"):
        fields.append("ee_booking")
    rows = []
    for row in frappe.get_all(
        "Sales Invoice",
        filters=filters,
        fields=fields,
        order_by="modified desc",
        limit_page_length=100,
    ):
        event_name = ""
        booking = row.get("ee_booking") if hasattr(row, "get") else None
        if booking:
            event_name = frappe.db.get_value("Event Booking", booking, "event_name") or ""
        title = event_name or row.customer_name or "Invoice"
        rows.append(
            {
                "id": row.name,
                "title": title,
                "customer_name": row.customer_name or "",
                "event": event_name,
                "total": _money(row.grand_total),
                "outstanding": _money(row.outstanding_amount),
                "status": row.status or "",
                "can_pay": flt(row.outstanding_amount) > 0,
            }
        )
    return rows


@frappe.whitelist()
def start_checkout(invoice_name: str, tip_amount: float = 0, processor: str = "stripe") -> dict:
    _require_payer()
    from entertainment_express.api.portal_billing import start_checkout as _start

    return _start(invoice_name, tip_amount=tip_amount, processor=processor)


@frappe.whitelist()
def list_contracts() -> list[dict]:
    _require_payer()
    user = frappe.session.user
    customer = _customer_name()
    filters = {"signer_email": user}
    rows = frappe.get_all(
        "EE Contract",
        filters=filters,
        fields=["name", "status", "signer_name", "booking", "quotation", "expires_at"],
        order_by="modified desc",
        limit_page_length=50,
    )
    if not rows and customer:
        bookings = frappe.get_all("Event Booking", filters={"customer": customer}, pluck="name")
        if bookings:
            rows = frappe.get_all(
                "EE Contract",
                filters={"booking": ["in", bookings]},
                fields=["name", "status", "signer_name", "booking", "quotation", "expires_at"],
                order_by="modified desc",
                limit_page_length=50,
            )
    docs = [
        {
            "id": row.name,
            "kind": "contract",
            "title": row.name,
            "status": row.status,
            "signer_name": row.signer_name or "",
            "event": row.booking or "",
            "can_sign": row.status in ("sent", "viewed"),
        }
        for row in rows
    ]
    if customer:
        try:
            from entertainment_express.api.compliance import list_my_waivers

            docs.extend(list_my_waivers())
        except Exception:
            pass
    if customer:
        inv_fields = ["name", "grand_total"]
        if frappe.get_meta("Sales Invoice").has_field("ee_booking"):
            inv_fields.append("ee_booking")
        paid = frappe.get_all(
            "Sales Invoice",
            filters={"customer": customer, "docstatus": 1, "outstanding_amount": ["<=", 0]},
            fields=inv_fields,
            order_by="modified desc",
            limit_page_length=20,
        )
        for inv in paid:
            booking = inv.get("ee_booking") if hasattr(inv, "get") else None
            event_name = ""
            if booking:
                event_name = frappe.db.get_value("Event Booking", booking, "event_name") or booking
            docs.append(
                {
                    "id": inv.name,
                    "kind": "receipt",
                    "title": f"Receipt {inv.name}",
                    "status": "paid",
                    "signer_name": "",
                    "event": event_name,
                    "can_sign": False,
                    "total": _money(inv.grand_total),
                }
            )
    return docs


def _planning_incomplete() -> bool:
    customer = _customer_name()
    if not customer or not frappe.db.table_exists("Planning Form Instance"):
        return False
    bookings = frappe.get_all("Event Booking", filters={"customer": customer}, pluck="name")
    if not bookings:
        return False
    for row in frappe.get_all(
        "Planning Form Instance",
        filters={"booking": ["in", bookings]},
        fields=["completion_percent", "status"],
        limit_page_length=50,
    ):
        if (row.status or "") != "complete" and flt(row.completion_percent) < 100:
            return True
    return False


@frappe.whitelist()
def next_action() -> dict:
    """Home priority: unsigned contract → Sign, else unpaid → Pay, else incomplete planning."""
    _require_payer()
    if any(row.get("can_sign") for row in list_contracts()):
        return {"key": "sign", "label": "Sign", "href": "/client/documents"}
    if any(row.get("can_pay") for row in list_invoices()):
        return {"key": "pay", "label": "Pay", "href": "/client/pay"}
    if _planning_incomplete():
        return {"key": "planning", "label": "Planning", "href": "/client/planning"}
    return {"key": "none", "label": "", "href": ""}


@frappe.whitelist()
def get_contract(name: str) -> dict:
    _require_payer()
    from entertainment_express.api.contract import view_my_contract

    return view_my_contract(name)


@frappe.whitelist()
def sign_contract(name: str, signer_name: str, signature_typed: str | None = None) -> dict:
    _require_payer()
    from entertainment_express.api.contract import sign_my_contract

    return sign_my_contract(name, signer_name=signer_name, signature_typed=signature_typed)
