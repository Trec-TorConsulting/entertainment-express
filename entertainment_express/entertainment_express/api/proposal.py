"""Proposal facade over Quotation, EE Contract, and deposit checkout.

Guests are denied on mutations and money reads. Amounts use flt / fmt_money.
"""

from __future__ import annotations

import secrets

import frappe
from frappe.utils import flt, now_datetime

GUEST_ROLE = "EE Event Guest"
PAYER_ROLE = "EE Customer"
STAFF_ROLES = {"EE Tenant Admin", "EE Sales", "System Manager"}


def _require_staff() -> None:
    roles = set(frappe.get_roles() or [])
    if not roles.intersection(STAFF_ROLES):
        frappe.throw("Proposal access denied.", frappe.PermissionError)


def _deny_event_guest() -> None:
    roles = set(frappe.get_roles() or [])
    if GUEST_ROLE in roles and PAYER_ROLE not in roles:
        frappe.throw("Only the host can do this.", frappe.PermissionError)


def _deny_guest() -> None:
    if frappe.session.user in (None, "Guest"):
        frappe.throw("Only the host can do this.", frappe.PermissionError)
    _deny_event_guest()


def _token_ok(quotation_name: str, token: str | None) -> bool:
    if not token or not frappe.get_meta("Quotation").has_field("ee_proposal_token"):
        return False
    stored = frappe.db.get_value("Quotation", quotation_name, "ee_proposal_token")
    return bool(stored) and stored == token


def _require_client(quotation_name: str, token: str | None = None, allow_token_guest: bool = True) -> None:
    _deny_event_guest()
    if _token_ok(quotation_name, token):
        if not allow_token_guest:
            _deny_guest()
        return
    _deny_guest()
    roles = set(frappe.get_roles() or [])
    if PAYER_ROLE not in roles and not roles.intersection(STAFF_ROLES):
        frappe.throw("Only the host can do this.", frappe.PermissionError)
    customer = frappe.db.get_value("Customer", {"email_id": frappe.session.user}, "name")
    party = frappe.db.get_value("Quotation", quotation_name, "party_name")
    if customer and party and customer != party and not roles.intersection(STAFF_ROLES):
        frappe.throw("Only the host can do this.", frappe.PermissionError)


@frappe.whitelist()
def create_proposal(source: str, name: str, selected: list | str | None = None, deposit_percent: float = 25) -> dict:
    _require_staff()
    from entertainment_express.api.portal_proposal import save_proposal

    return save_proposal(source, name, selected, deposit_percent)


@frappe.whitelist()
def send_proposal(source: str, name: str) -> dict:
    _require_staff()
    from entertainment_express.api.portal_proposal import send_proposal as _send

    return _send(source, name)


@frappe.whitelist(allow_guest=True)
def get_proposal(quotation_name: str | None = None, token: str | None = None, source: str | None = None, name: str | None = None) -> dict:
    if source and name:
        _require_staff()
        from entertainment_express.api.portal_proposal import get_proposal as _staff_get

        return _staff_get(source, name)
    if not quotation_name:
        frappe.throw("Missing proposal.")
    _require_client(quotation_name, token)
    from entertainment_express.api.portal_proposal import _lines_from_quote, _money, _proposal_status

    quote = frappe.get_doc("Quotation", quotation_name)
    total = flt(quote.grand_total)
    pct = flt(quote.get("ee_deposit_percent") or 25)
    return {
        "id": quote.name,
        "status": _proposal_status(quote),
        "lines": _lines_from_quote(quote),
        "total": _money(total),
        "deposit": _money(total * pct / 100),
        "token": quote.get("ee_proposal_token") if frappe.get_meta("Quotation").has_field("ee_proposal_token") else "",
    }


@frappe.whitelist(allow_guest=True)
def record_view(quotation_name: str, token: str | None = None) -> dict:
    _require_client(quotation_name, token)
    quote = frappe.get_doc("Quotation", quotation_name)
    if quote.meta.has_field("ee_last_viewed_at"):
        quote.db_set("ee_last_viewed_at", now_datetime())
    if quote.meta.has_field("ee_proposal_status"):
        current = quote.get("ee_proposal_status") or "sent"
        if current in ("draft", "sent", ""):
            quote.db_set("ee_proposal_status", "viewed")
    try:
        from entertainment_express.notifications import send

        owner = quote.owner or frappe.db.get_value("User", {"role_profile_name": "EE Tenant Admin"}, "name")
        email = frappe.db.get_value("User", owner, "email") if owner else None
        if email:
            send(
                "proposal_viewed",
                email,
                {"quote_number": quotation_name, "customer_name": quote.party_name or ""},
            )
    except Exception:
        frappe.logger().error("proposal_viewed notify failed")
    return {"status": "viewed", "quotation": quotation_name}


@frappe.whitelist()
def set_add_ons(quotation_name: str, add_ons: list | str | None = None, token: str | None = None) -> dict:
    _require_client(quotation_name, token, allow_token_guest=False)
    if isinstance(add_ons, str):
        add_ons = frappe.parse_json(add_ons) or []
    quote = frappe.get_doc("Quotation", quotation_name)
    keep = []
    for row in quote.items or []:
        item_type = frappe.db.get_value("Item", row.item_code, "ee_item_type") if frappe.get_meta("Item").has_field("ee_item_type") else ""
        if item_type == "addon":
            continue
        keep.append({"item_code": row.item_code, "qty": flt(row.qty or 1), "rate": flt(row.rate)})
    for row in add_ons or []:
        code = row.get("id") or row.get("item_code")
        if not code:
            continue
        rate = flt(row.get("rate_raw") or frappe.db.get_value("Item", code, "standard_rate") or 0)
        keep.append({"item_code": code, "qty": flt(row.get("qty") or 1) or 1, "rate": rate})
    quote.set("items", [])
    for line in keep:
        quote.append("items", line)
    quote.save(ignore_permissions=True)
    try:
        quote.run_method("calculate_taxes_and_totals")
        quote.save(ignore_permissions=True)
    except Exception:
        pass
    return get_proposal(quotation_name=quotation_name, token=token)


@frappe.whitelist()
def sign_and_pay(quotation_name: str, signer_name: str, signature_typed: str | None = None, token: str | None = None) -> dict:
    _deny_guest()
    _require_client(quotation_name, token)
    contract_name = frappe.db.get_value("EE Contract", {"quotation": quotation_name}, "name")
    if contract_name:
        from entertainment_express.api.contract import sign_my_contract

        sign_my_contract(contract_name, signer_name=signer_name, signature_typed=signature_typed or signer_name)
    if frappe.get_meta("Quotation").has_field("ee_proposal_status"):
        frappe.db.set_value("Quotation", quotation_name, "ee_proposal_status", "accepted")
    invoice = None
    booking = None
    if frappe.get_meta("Quotation").has_field("ee_booking"):
        booking = frappe.db.get_value("Quotation", quotation_name, "ee_booking")
    if not booking:
        booking = frappe.db.get_value("Event Booking", {"quotation": quotation_name}, "name")
    filters = {"docstatus": ["<", 2], "outstanding_amount": [">", 0]}
    if booking and frappe.get_meta("Sales Invoice").has_field("ee_booking"):
        filters["ee_booking"] = booking
    else:
        party = frappe.db.get_value("Quotation", quotation_name, "party_name")
        if party:
            filters["customer"] = party
    invoice = frappe.db.get_value("Sales Invoice", filters, "name")
    checkout = {}
    if invoice:
        from entertainment_express.api.payments_stripe import create_checkout

        checkout = create_checkout(invoice)
    return {"status": "accepted", "quotation": quotation_name, "contract": contract_name, "checkout": checkout}


def issue_token(quote) -> str:
    """Stamp sent status + token on a quotation. Safe if custom fields are missing."""
    token = ""
    if getattr(quote, "meta", None) and quote.meta.has_field("ee_proposal_token"):
        token = quote.get("ee_proposal_token") or secrets.token_urlsafe(24)
        quote.db_set("ee_proposal_token", token)
    if getattr(quote, "meta", None) and quote.meta.has_field("ee_proposal_status"):
        quote.db_set("ee_proposal_status", "sent")
    return token
