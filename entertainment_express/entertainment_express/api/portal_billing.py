"""Money for /owner, /employee, and /client. Invoice/pay language, never DocType names."""

from __future__ import annotations

import frappe
from frappe.utils import flt, get_url

from entertainment_express.api import billing
from entertainment_express.api.portal_owner import OWNER_ROLES
from entertainment_express.billing_payments.processors import ProcessorNotConfigured, get_processor

ACCT_ROLES = OWNER_ROLES | {"EE Accounting", "EE Sales", "System Manager"}
MONEY_ROLES = OWNER_ROLES | {"EE Accounting", "System Manager"}
PAYER_ROLE = "EE Customer"
LABELS = {
    "stripe": "Card",
    "square": "Square",
    "paypal": "PayPal",
    "ach": "Bank",
    "authorizenet": "Authorize.Net",
}


def _roles() -> set[str]:
    return set(frappe.get_roles(frappe.session.user) or [])


def _require_money() -> None:
    if not _roles().intersection(MONEY_ROLES):
        frappe.throw("Money access denied.", frappe.PermissionError)


def _require_acct() -> None:
    if not _roles().intersection(ACCT_ROLES):
        frappe.throw("Money access denied.", frappe.PermissionError)


def _require_payer_or_acct() -> None:
    roles = _roles()
    if roles.intersection(ACCT_ROLES | {PAYER_ROLE}):
        return
    frappe.throw("Pay access denied.", frappe.PermissionError)


@frappe.whitelist()
def list_processors() -> list[dict]:
    _require_payer_or_acct()
    out = []
    for name in ("stripe", "square", "paypal", "ach", "authorizenet"):
        ready = False
        try:
            ready = bool(get_processor(name).configured())
        except Exception:
            ready = False
        out.append({"id": name, "label": LABELS[name], "ready": ready})
    return out


@frappe.whitelist()
def get_schedule(booking_name: str) -> dict:
    _require_acct()
    return billing.get_schedule(booking_name)


@frappe.whitelist()
def create_balance_invoice(booking_name: str) -> dict:
    _require_acct()
    return billing.create_balance_invoice(booking_name)


@frappe.whitelist()
def refund_invoice(invoice_name: str, amount: float, reason: str = "") -> dict:
    _require_money()
    return billing.refund_invoice(invoice_name, amount, reason)


@frappe.whitelist()
def create_damage_hold(booking_name: str, amount: float) -> dict:
    _require_money()
    return billing.create_damage_hold(booking_name, amount)


@frappe.whitelist()
def capture_hold(invoice_name: str, amount: float | None = None) -> dict:
    _require_money()
    return billing.capture_hold(invoice_name, amount)


@frappe.whitelist()
def release_hold(invoice_name: str) -> dict:
    _require_money()
    return billing.release_hold(invoice_name)


@frappe.whitelist()
def create_installments(booking_name: str, count: int = 3) -> dict:
    _require_money()
    return billing.create_installments(booking_name, count)


@frappe.whitelist()
def list_jobs() -> list[dict]:
    _require_acct()
    return frappe.get_all(
        "Event Booking",
        filters={"status": ["in", ["confirmed", "in_progress", "tentative", "quoted"]]},
        fields=["name", "event_name", "event_date", "balance_due", "status"],
        order_by="event_date desc",
        limit_page_length=80,
    )


@frappe.whitelist()
def start_checkout(invoice_name: str, tip_amount: float = 0, processor: str = "stripe") -> dict:
    _require_payer_or_acct()
    processor = (processor or "stripe").lower()
    tip_amount = flt(tip_amount)
    if processor == "stripe":
        from entertainment_express.api.payments_stripe import create_checkout

        return create_checkout(invoice_name, tip_amount)

    invoice = frappe.get_doc("Sales Invoice", invoice_name)
    if flt(invoice.outstanding_amount) <= 0:
        frappe.throw("This invoice is already paid.")
    if frappe.get_meta("Sales Invoice").has_field("ee_tip_amount") and tip_amount:
        frappe.db.set_value("Sales Invoice", invoice_name, "ee_tip_amount", tip_amount)
    cents = int(round((flt(invoice.outstanding_amount) + tip_amount) * 100))
    site_url = get_url()
    try:
        return get_processor(processor).hosted_checkout(
            cents,
            invoice.currency or "usd",
            success_url=f"{site_url}/client/pay?invoice={invoice_name}&paid=1",
            cancel_url=f"{site_url}/client/pay?invoice={invoice_name}&paid=0",
            description="Event payment",
            metadata={"invoice_name": invoice_name, "booking_name": invoice.get("ee_booking") or "", "tip_amount": str(tip_amount)},
            idempotency_key=f"{invoice_name}-{processor}-{cents}",
        )
    except ProcessorNotConfigured:
        frappe.throw(f"{LABELS.get(processor, processor)} is not connected.")
