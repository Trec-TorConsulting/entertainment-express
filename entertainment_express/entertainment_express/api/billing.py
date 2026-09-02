"""Tenant customer billing: refunds, tips, holds, installments, balance pay."""

from __future__ import annotations

import frappe
from frappe.utils import flt, getdate, add_days, today, cint

from entertainment_express.billing_payments.processors import ProcessorNotConfigured, get_processor
from entertainment_express.security.access import require_roles


ACCT = ["EE Tenant Admin", "EE Accounting", "System Manager"]


@frappe.whitelist()
def get_schedule(booking_name: str) -> dict:
    from entertainment_express.security.access import assert_booking_access

    assert_booking_access(booking_name)
    if not frappe.db.exists("Payment Schedule", booking_name):
        from entertainment_express.billing_payments.schedules import ensure_schedule

        ensure_schedule(booking_name)
    return frappe.get_doc("Payment Schedule", booking_name).as_dict()


@frappe.whitelist()
def create_balance_invoice(booking_name: str) -> dict:
    require_roles(*ACCT, "EE Sales")
    booking = frappe.get_doc("Event Booking", booking_name)
    existing = frappe.db.get_value(
        "Sales Invoice",
        {"ee_booking": booking_name, "ee_is_balance": 1, "docstatus": ["<", 2]},
        "name",
    )
    if existing:
        return {"invoice": existing, "status": "already_exists"}
    amount = flt(booking.balance_due)
    if amount <= 0:
        frappe.throw("There is no balance due on this booking.")
    invoice = _make_invoice(booking, amount, is_balance=True)
    _stamp_milestone(booking_name, "balance", invoice.name)
    return {"invoice": invoice.name, "status": "created"}


@frappe.whitelist()
def refund_invoice(invoice_name: str, amount: float, reason: str) -> dict:
    require_roles(*ACCT)
    amount = flt(amount)
    if amount <= 0:
        frappe.throw("Refund amount must be greater than zero.")
    invoice = frappe.get_doc("Sales Invoice", invoice_name)
    already = flt(
        frappe.db.sql(
            """SELECT COALESCE(SUM(amount),0) FROM `tabEE Refund`
               WHERE invoice=%s AND status='succeeded'""",
            (invoice_name,),
        )[0][0]
    )
    paid = flt(invoice.grand_total)
    if already + amount > paid + 0.009:
        frappe.throw("That refund would exceed what was paid.")
    pe_name = frappe.db.get_value(
        "Payment Entry Reference",
        {"reference_doctype": "Sales Invoice", "reference_name": invoice_name},
        "parent",
    )
    txn = None
    if pe_name:
        txn = frappe.db.get_value("Payment Entry", pe_name, "ee_processor_txn_id") or invoice.get(
            "ee_stripe_session_id"
        )
    processor_name = "stripe"
    if pe_name:
        processor_name = frappe.db.get_value("Payment Entry", pe_name, "ee_processor") or "stripe"
    try:
        result = get_processor(processor_name).refund(txn or "", int(round(amount * 100)), reason)
        status = "succeeded" if result.status in ("succeeded", "pending") else "failed"
        refund_id = result.processor_txn_id
    except ProcessorNotConfigured:
        raise
    except Exception:
        # Manual / unconfigured txn: still record intent for GL via Payment Entry if possible
        frappe.log_error(frappe.get_traceback(), "EE refund processor")
        status = "failed"
        refund_id = ""
        result = None

    rec = frappe.get_doc(
        {
            "doctype": "EE Refund",
            "payment_entry": pe_name,
            "invoice": invoice_name,
            "amount": amount,
            "reason": reason,
            "processor": processor_name,
            "processor_refund_id": refund_id,
            "status": status,
        }
    )
    rec.insert()
    if status == "succeeded":
        _credit_note(invoice, amount, rec.name)
    frappe.db.commit()
    return {"refund": rec.name, "status": status}


@frappe.whitelist()
def create_damage_hold(booking_name: str, amount: float) -> dict:
    require_roles(*ACCT)
    booking = frappe.get_doc("Event Booking", booking_name)
    amount = flt(amount)
    invoice = _make_invoice(booking, amount, is_hold=True)
    try:
        hold = get_processor("stripe").preauth(
            int(round(amount * 100)),
            (invoice.currency or "usd"),
            metadata={"invoice_name": invoice.name, "booking_name": booking_name, "kind": "damage_hold"},
        )
        frappe.db.set_value("Sales Invoice", invoice.name, "ee_payment_intent_id", hold.processor_txn_id)
    except ProcessorNotConfigured:
        frappe.throw("Connect Stripe to place a card hold.")
    return {"invoice": invoice.name, "payment_intent": frappe.db.get_value("Sales Invoice", invoice.name, "ee_payment_intent_id")}


@frappe.whitelist()
def capture_hold(invoice_name: str, amount: float | None = None) -> dict:
    require_roles(*ACCT)
    pi = frappe.db.get_value("Sales Invoice", invoice_name, "ee_payment_intent_id")
    if not pi:
        frappe.throw("No card hold on this invoice.")
    cents = int(round(flt(amount) * 100)) if amount else None
    result = get_processor("stripe").capture(pi, cents)
    return {"status": result.status}


@frappe.whitelist()
def release_hold(invoice_name: str) -> dict:
    require_roles(*ACCT)
    pi = frappe.db.get_value("Sales Invoice", invoice_name, "ee_payment_intent_id")
    if not pi:
        frappe.throw("No card hold on this invoice.")
    result = get_processor("stripe").release(pi)
    return {"status": result.status}


@frappe.whitelist()
def create_installments(booking_name: str, count: int = 3) -> dict:
    require_roles(*ACCT)
    count = cint(count)
    if count < 2 or count > 12:
        frappe.throw("Choose between 2 and 12 installments.")
    booking = frappe.get_doc("Event Booking", booking_name)
    remaining = flt(booking.balance_due)
    if remaining <= 0:
        frappe.throw("Nothing left to split.")
    from entertainment_express.billing_payments.schedules import ensure_schedule

    ensure_schedule(booking_name)
    sched = frappe.get_doc("Payment Schedule", booking_name)
    # drop unpaid balance milestone, replace with installments
    keep = [m for m in sched.milestones if m.kind != "balance" or m.status == "paid"]
    sched.set("milestones", [])
    for m in keep:
        sched.append("milestones", m.as_dict())
    slice_amt = round(remaining / count, 2)
    event_date = getdate(booking.event_date)
    for i in range(count):
        amt = remaining - slice_amt * (count - 1) if i == count - 1 else slice_amt
        due = add_days(event_date, -30 * (count - i))
        if getdate(due) < getdate():
            due = add_days(getdate(), 7 * (i + 1))
        sched.append(
            "milestones",
            {"kind": "installment", "due_date": due, "amount": amt, "status": "scheduled"},
        )
    sched.save()
    frappe.db.commit()
    return sched.as_dict()


def send_balance_reminders():
    try:
        from entertainment_express.api.workflow import automation_enabled

        if not automation_enabled("deposit_chase"):
            return
    except Exception:
        pass
    horizon = add_days(getdate(), 3)
    rows = frappe.get_all(
        "Payment Schedule Milestone",
        filters={"kind": ["in", ["balance", "installment"]], "status": ["in", ["scheduled", "invoiced"]], "due_date": ["<=", horizon]},
        fields=["name", "parent", "amount", "due_date", "kind", "invoice"],
    )
    from entertainment_express.notifications import send

    for row in rows:
        booking = row.parent
        customer = frappe.db.get_value("Event Booking", booking, "customer")
        email = frappe.db.get_value("Customer", customer, "email_id")
        if not email:
            continue
        send(
            "balance_reminder",
            email,
            {
                "customer_name": customer,
                "booking_name": booking,
                "amount": row.amount,
                "due_date": str(row.due_date),
                "pay_link": f"/client/pay?booking={booking}",
            },
        )


def _make_invoice(booking, amount, is_balance=False, is_hold=False):
    company = (
        frappe.defaults.get_user_default("Company")
        or frappe.db.get_single_value("Global Defaults", "default_company")
    )
    invoice = frappe.get_doc(
        {
            "doctype": "Sales Invoice",
            "customer": booking.customer,
            "company": company,
            "ee_booking": booking.name,
            "ee_event_date": booking.event_date,
            "ee_is_deposit": 0,
            "ee_is_balance": 1 if is_balance else 0,
            "ee_is_damage_hold": 1 if is_hold else 0,
            "items": [
                {
                    "item_name": "Event balance" if is_balance else "Damage hold",
                    "qty": 1,
                    "rate": amount,
                    "income_account": frappe.get_cached_value("Company", company, "default_income_account"),
                }
            ],
        }
    )
    invoice.insert(ignore_permissions=True)
    invoice.submit()
    return invoice


def _stamp_milestone(booking_name, kind, invoice_name):
    if not frappe.db.exists("Payment Schedule", booking_name):
        return
    sched = frappe.get_doc("Payment Schedule", booking_name)
    for m in sched.milestones:
        if m.kind == kind and m.status != "paid":
            m.invoice = invoice_name
            m.status = "invoiced"
            break
    sched.save(ignore_permissions=True)


def _credit_note(invoice, amount, refund_name):
    try:
        cn = frappe.get_doc(
            {
                "doctype": "Sales Invoice",
                "customer": invoice.customer,
                "is_return": 1,
                "return_against": invoice.name,
                "company": invoice.company,
                "ee_booking": invoice.get("ee_booking"),
                "items": [
                    {
                        "item_name": f"Refund {refund_name}",
                        "qty": -1,
                        "rate": amount,
                        "income_account": invoice.items[0].income_account if invoice.items else None,
                    }
                ],
            }
        )
        cn.insert(ignore_permissions=True)
        cn.submit()
    except Exception:
        frappe.log_error(frappe.get_traceback(), "EE refund credit note")
