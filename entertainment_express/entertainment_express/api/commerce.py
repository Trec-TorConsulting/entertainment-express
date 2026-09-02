"""Gift cards, store credit, late fees, B2B terms — site-scoped money via flt."""

from __future__ import annotations

import secrets
from datetime import date

import frappe
from frappe.utils import cint, flt, getdate, now_datetime, nowdate

from entertainment_express.api.portal_owner import OWNER_ROLES

GUEST_ROLE = "EE Event Guest"
PAYER_ROLE = "EE Customer"
STAFF = OWNER_ROLES | {"EE Accounting", "EE Sales", "System Manager"}
LATE_FEE_ITEM = "EE-LATE-FEE"
LATE_FEE_MARK = "ee_late_fee_applied"


def _roles() -> set[str]:
    return set(frappe.get_roles() or [])


def _deny_guest_money() -> None:
    roles = _roles()
    if GUEST_ROLE in roles and PAYER_ROLE not in roles:
        frappe.throw("Not allowed.", frappe.PermissionError)


def _require_staff() -> None:
    _deny_guest_money()
    if not _roles().intersection(STAFF):
        frappe.throw("Not allowed.", frappe.PermissionError)


def _require_payer_or_staff() -> None:
    _deny_guest_money()
    roles = _roles()
    if roles.intersection(STAFF) or PAYER_ROLE in roles:
        return
    frappe.throw("Not allowed.", frappe.PermissionError)


def _code() -> str:
    return secrets.token_hex(4).upper()


@frappe.whitelist()
def issue_gift_card(amount: float, customer: str | None = None, expires_on: str | None = None, notes: str = "") -> dict:
    _require_staff()
    amt = flt(amount)
    if amt <= 0:
        frappe.throw("Amount must be positive.")
    code = _code()
    while frappe.db.exists("EE Gift Card", {"code": code}):
        code = _code()
    doc = frappe.get_doc(
        {
            "doctype": "EE Gift Card",
            "code": code,
            "customer": customer or None,
            "original_amount": amt,
            "balance": amt,
            "currency": frappe.defaults.get_global_default("currency") or "USD",
            "expires_on": expires_on or None,
            "status": "active",
            "notes": notes or "",
        }
    )
    doc.insert(ignore_permissions=True)
    return {"code": doc.code, "balance": flt(doc.balance), "name": doc.name}


@frappe.whitelist()
def redeem_gift_card(code: str, amount: float | None = None, invoice: str | None = None) -> dict:
    _require_payer_or_staff()
    code = (code or "").strip().upper()
    name = frappe.db.get_value("EE Gift Card", {"code": code}, "name")
    if not name:
        frappe.throw("Gift card not found.")
    doc = frappe.get_doc("EE Gift Card", name)
    if doc.status != "active":
        frappe.throw("Gift card is not active.", frappe.ValidationError)
    if doc.expires_on and getdate(doc.expires_on) < getdate(nowdate()):
        doc.status = "expired"
        doc.save(ignore_permissions=True)
        frappe.throw("Gift card expired.", frappe.ValidationError)
    bal = flt(doc.balance)
    if bal <= 0:
        frappe.throw("Gift card already redeemed.", frappe.ValidationError)
    use = flt(amount) if amount is not None else bal
    use = min(use, bal)
    if use <= 0:
        frappe.throw("Nothing to redeem.")
    doc.balance = flt(bal - use)
    if doc.balance <= 0:
        doc.balance = 0
        doc.status = "redeemed"
    doc.save(ignore_permissions=True)
    pe_name = None
    if invoice and frappe.db.exists("Sales Invoice", invoice):
        try:
            pe = frappe.get_doc(
                {
                    "doctype": "Payment Entry",
                    "payment_type": "Receive",
                    "party_type": "Customer",
                    "party": frappe.db.get_value("Sales Invoice", invoice, "customer"),
                    "paid_amount": use,
                    "received_amount": use,
                    "reference_no": f"GC-{doc.code}",
                    "reference_date": nowdate(),
                    "references": [
                        {
                            "reference_doctype": "Sales Invoice",
                            "reference_name": invoice,
                            "allocated_amount": use,
                        }
                    ],
                }
            )
            pe.insert(ignore_permissions=True)
            pe_name = pe.name
        except Exception:
            frappe.logger().error("gift card payment entry failed")
    return {"code": doc.code, "redeemed": use, "balance": flt(doc.balance), "status": doc.status, "payment_entry": pe_name}


@frappe.whitelist()
def credit_balance(customer: str) -> dict:
    _require_payer_or_staff()
    if not customer:
        frappe.throw("Customer required.")
    rows = frappe.get_all(
        "EE Store Credit Entry",
        filters={"customer": customer},
        fields=["amount", "entry_type"],
    )
    bal = 0.0
    for r in rows:
        amt = flt(r.amount)
        bal += amt if r.entry_type == "credit" else -amt
    return {"customer": customer, "balance": flt(bal)}


@frappe.whitelist()
def issue_store_credit(customer: str, amount: float, notes: str = "", reference: str = "") -> dict:
    _require_staff()
    amt = flt(amount)
    if amt <= 0:
        frappe.throw("Amount must be positive.")
    doc = frappe.get_doc(
        {
            "doctype": "EE Store Credit Entry",
            "customer": customer,
            "amount": amt,
            "entry_type": "credit",
            "notes": notes or "",
            "reference": reference or "",
            "posted_at": now_datetime(),
        }
    )
    doc.insert(ignore_permissions=True)
    return {"entry": doc.name, **credit_balance(customer)}


@frappe.whitelist()
def apply_store_credit(customer: str, amount: float, invoice: str | None = None, reference: str = "") -> dict:
    _require_payer_or_staff()
    amt = flt(amount)
    if amt <= 0:
        frappe.throw("Amount must be positive.")
    bal = flt(credit_balance(customer)["balance"])
    if amt > bal:
        frappe.throw("Insufficient store credit.", frappe.ValidationError)
    doc = frappe.get_doc(
        {
            "doctype": "EE Store Credit Entry",
            "customer": customer,
            "amount": amt,
            "entry_type": "debit",
            "notes": "Applied to invoice" if invoice else "Redeemed",
            "reference": reference or invoice or "",
            "posted_at": now_datetime(),
        }
    )
    doc.insert(ignore_permissions=True)
    return {"entry": doc.name, **credit_balance(customer)}


def _ensure_late_fee_item() -> str:
    if frappe.db.exists("Item", LATE_FEE_ITEM):
        return LATE_FEE_ITEM
    try:
        frappe.get_doc(
            {
                "doctype": "Item",
                "item_code": LATE_FEE_ITEM,
                "item_name": "Late Payment Fee",
                "item_group": "Services",
                "stock_uom": "Nos",
                "is_stock_item": 0,
                "is_sales_item": 1,
            }
        ).insert(ignore_permissions=True)
    except Exception:
        pass
    return LATE_FEE_ITEM


@frappe.whitelist()
def run_late_fees(grace_days: int = 7, fee_amount: float = 25.0) -> dict:
    """Idempotent: one late-fee invoice per overdue SI per grace window."""
    _require_staff()
    grace = cint(grace_days) or 7
    fee = flt(fee_amount)
    if fee <= 0:
        return {"created": 0}
    today = getdate(nowdate())
    overdue = frappe.get_all(
        "Sales Invoice",
        filters={
            "docstatus": 1,
            "outstanding_amount": [">", 0],
            "due_date": ["<", today],
            "status": ["not in", ["Paid", "Cancelled"]],
        },
        fields=["name", "customer", "due_date", "outstanding_amount"],
        limit=200,
    )
    created = 0
    item = _ensure_late_fee_item()
    for inv in overdue:
        due = getdate(inv.due_date)
        if (today - due).days < grace:
            continue
        # Idempotency mark on original invoice
        if frappe.db.get_value("Sales Invoice", inv.name, LATE_FEE_MARK):
            continue
        # Also skip if a late-fee SI already references this invoice
        existing = frappe.db.exists(
            "Sales Invoice",
            {"ee_late_fee_for": inv.name, "docstatus": ["<", 2]},
        )
        if existing:
            frappe.db.set_value("Sales Invoice", inv.name, LATE_FEE_MARK, 1)
            continue
        try:
            fee_inv = frappe.get_doc(
                {
                    "doctype": "Sales Invoice",
                    "customer": inv.customer,
                    "due_date": nowdate(),
                    "items": [{"item_code": item, "qty": 1, "rate": fee}],
                    "ee_late_fee_for": inv.name,
                }
            )
            fee_inv.insert(ignore_permissions=True)
            frappe.db.set_value("Sales Invoice", inv.name, LATE_FEE_MARK, 1)
            created += 1
        except Exception:
            frappe.logger().error("late fee create failed for %s", inv.name)
    return {"created": created}


def apply_late_fees_daily() -> None:
    """Scheduler entry — no-op if DocTypes missing."""
    if not frappe.db.table_exists("EE Gift Card"):
        return
    try:
        # Use site defaults; staff call bypassed via ignore
        frappe.set_user("Administrator")
        run_late_fees()
    except Exception:
        frappe.logger().error("late fee job failed")


@frappe.whitelist()
def liability_report() -> dict:
    _require_staff()
    cards = frappe.get_all(
        "EE Gift Card",
        filters={"status": "active"},
        fields=["code", "balance", "customer", "expires_on"],
    )
    total_gc = sum(flt(c.balance) for c in cards)
    customers = frappe.get_all("EE Store Credit Entry", fields=["customer"], distinct=True)
    credits = []
    for c in customers:
        bal = flt(credit_balance(c.customer)["balance"])
        if bal > 0:
            credits.append({"customer": c.customer, "balance": bal})
    return {
        "gift_card_liability": flt(total_gc),
        "active_cards": cards,
        "store_credit_liability": flt(sum(x["balance"] for x in credits)),
        "store_credits": credits,
    }
