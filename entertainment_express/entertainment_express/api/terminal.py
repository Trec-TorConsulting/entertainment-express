"""
Stripe Terminal (POS) API for Field App PWA in-person event payments.

Supports:
- Ephemeral connection tokens for Web Bluetooth (Stripe Reader M2) and Cloud/WiFi (WisePOS E).
- Card-present PaymentIntent creation and capture.
- Automated ERPNext Payment Entry generation and Sales Invoice reconciliation.
- Digital tip pool routing for field crew.
- Multi-channel digital receipt dispatch (SMS/Email).
"""

import json
import os
import frappe
from frappe.utils import flt, now_datetime
from entertainment_express.api.payments_stripe import _stripe, _get_stripe_key


def _assert_pos_access():
    """Verify that calling user has crew, dispatch, or admin permissions."""
    if frappe.session.user == "Guest":
        frappe.throw("Authentication required for POS checkout.", frappe.PermissionError)
    
    roles = frappe.get_roles(frappe.session.user)
    allowed = {"EE Crew", "EE Dispatcher", "EE Tenant Admin", "EE Accounting", "System Manager"}
    if not (allowed & set(roles)):
        frappe.throw("Insufficient permissions to process in-person POS transactions.", frappe.PermissionError)


@frappe.whitelist()
def get_connection_token() -> dict:
    """
    Generate an ephemeral Stripe Terminal Connection Token for the PWA client SDK.
    Returns: {"secret": token.secret}
    """
    _assert_pos_access()
    stripe = _stripe()
    try:
        token = stripe.terminal.ConnectionToken.create()
        return {"secret": token.secret}
    except Exception as e:
        frappe.log_error(f"Error generating Terminal connection token: {e}", "Stripe Terminal POS")
        frappe.throw(f"Failed to generate Terminal connection token: {e}")


@frappe.whitelist()
def list_readers(location_id: str = None) -> list:
    """
    List configured Terminal Readers for this tenant.
    Returns readers registered in EE Terminal Reader DocType.
    """
    _assert_pos_access()
    filters = {}
    if location_id:
        filters["location_id"] = location_id
        
    readers = frappe.get_all(
        "EE Terminal Reader",
        filters=filters,
        fields=[
            "name", "reader_name", "stripe_reader_id", "device_type",
            "connection_type", "status", "assigned_crew", "assigned_vehicle",
            "battery_level"
        ]
    )
    return readers


@frappe.whitelist()
def register_reader(reader_name: str, registration_code: str, location_id: str, device_type: str = "bbpos_wisepos_e") -> dict:
    """
    Register a new physical reader with Stripe and persist in EE Terminal Reader.
    """
    _assert_pos_access()
    stripe = _stripe()
    try:
        reader = stripe.terminal.Reader.create(
            registration_code=registration_code,
            label=reader_name,
            location=location_id
        )
        
        doc = frappe.get_doc({
            "doctype": "EE Terminal Reader",
            "reader_name": reader_name,
            "stripe_reader_id": reader.id,
            "device_type": device_type,
            "connection_type": "Cloud/WiFi" if "wisepos" in device_type.lower() else "Bluetooth",
            "location_id": location_id,
            "status": "Online" if reader.status == "online" else "Offline"
        })
        doc.insert(ignore_permissions=True)
        frappe.db.commit()
        return {"status": "success", "reader_id": reader.id, "name": doc.name}
    except Exception as e:
        frappe.throw(f"Failed to register Terminal reader: {e}")


@frappe.whitelist()
def create_payment_intent(invoice_name: str, amount: float, tip_amount: float = 0, currency: str = "usd", booking_name: str = None) -> dict:
    """
    Create an on-site card-present PaymentIntent for terminal processing.
    """
    _assert_pos_access()
    stripe = _stripe()
    
    if not frappe.db.exists("Sales Invoice", invoice_name):
        frappe.throw(f"Sales Invoice {invoice_name} not found.", frappe.DoesNotExistError)
        
    invoice = frappe.get_doc("Sales Invoice", invoice_name)
    booking = booking_name or invoice.get("ee_booking") or ""
    
    amount_flt = flt(amount)
    tip_flt = flt(tip_amount)
    total_cents = int(round((amount_flt + tip_flt) * 100))
    
    if total_cents <= 0:
        frappe.throw("Transaction amount must be greater than zero.")
        
    metadata = {
        "invoice_name": invoice_name,
        "booking_name": booking,
        "base_amount": str(amount_flt),
        "tip_amount": str(tip_flt),
        "crew_user": frappe.session.user,
        "channel": "terminal_pos"
    }
    
    try:
        intent = stripe.PaymentIntent.create(
            amount=total_cents,
            currency=currency.lower(),
            payment_method_types=["card_present"],
            capture_method="manual",
            metadata=metadata,
            description=f"POS Payment for Invoice {invoice_name}"
        )
        return {
            "client_secret": intent.client_secret,
            "payment_intent_id": intent.id,
            "amount": amount_flt,
            "tip_amount": tip_flt,
            "total_amount": amount_flt + tip_flt
        }
    except Exception as e:
        frappe.log_error(f"Error creating Terminal PaymentIntent: {e}", "Stripe Terminal POS")
        frappe.throw(f"Payment initialization failed: {e}")


@frappe.whitelist()
def capture_payment(payment_intent_id: str) -> dict:
    """
    Capture an authorized card-present payment and record accounting entries.
    """
    _assert_pos_access()
    stripe = _stripe()
    
    try:
        intent = stripe.PaymentIntent.capture(payment_intent_id)
    except Exception as e:
        frappe.log_error(f"Failed to capture PaymentIntent {payment_intent_id}: {e}", "Stripe Terminal POS")
        frappe.throw(f"Payment capture failed: {e}")
        
    if intent.status != "succeeded":
        frappe.throw(f"PaymentIntent status is {intent.status}, expected succeeded.")
        
    metadata = intent.metadata or {}
    invoice_name = metadata.get("invoice_name")
    booking_name = metadata.get("booking_name")
    base_amount = flt(metadata.get("base_amount", 0))
    tip_amount = flt(metadata.get("tip_amount", 0))
    total_amount = flt(intent.amount) / 100.0
    
    pe_name = record_terminal_payment(
        payment_intent_id=payment_intent_id,
        invoice_name=invoice_name,
        booking_name=booking_name,
        base_amount=base_amount,
        tip_amount=tip_amount,
        total_amount=total_amount
    )
    
    return {
        "status": "success",
        "payment_intent_id": payment_intent_id,
        "payment_entry": pe_name,
        "total_captured": total_amount,
        "tip_amount": tip_amount
    }


def record_terminal_payment(
    payment_intent_id: str,
    invoice_name: str,
    booking_name: str = None,
    base_amount: float = 0,
    tip_amount: float = 0,
    total_amount: float = 0
) -> str:
    """
    Internal helper: Create ERPNext Payment Entry against Sales Invoice and route tips to tip pool.
    """
    if not invoice_name or not frappe.db.exists("Sales Invoice", invoice_name):
        frappe.throw(f"Cannot record payment: Sales Invoice {invoice_name} not found.")
        
    invoice = frappe.get_doc("Sales Invoice", invoice_name)
    company = invoice.company or frappe.defaults.get_user_default("Company")
    company_doc = frappe.get_doc("Company", company)
    
    paid_from = company_doc.default_receivable_account
    paid_to = company_doc.default_bank_account or company_doc.default_cash_account
    if not paid_from or not paid_to:
        accounts = frappe.get_all("Account", filters={"company": company}, fields=["name", "account_type"])
        for acct in accounts:
            if acct.account_type == "Receivable" and not paid_from:
                paid_from = acct.name
            elif acct.account_type in ("Bank", "Cash") and not paid_to:
                paid_to = acct.name
                
    if not paid_from:
        paid_from = f"Debtors - {company}"
    if not paid_to:
        paid_to = f"Bank Account - {company}"
        
    # Settle the invoice with base_amount
    allocated_amount = base_amount if base_amount > 0 else flt(invoice.outstanding_amount)
    
    pe = frappe.new_doc("Payment Entry")
    pe.payment_type = "Receive"
    pe.party_type = "Customer"
    pe.party = invoice.customer
    pe.company = company
    pe.paid_from = paid_from
    pe.paid_to = paid_to
    pe.paid_amount = flt(total_amount) if total_amount > 0 else allocated_amount
    pe.received_amount = pe.paid_amount
    pe.reference_no = payment_intent_id
    pe.reference_date = now_datetime().date()
    pe.mode_of_payment = "Credit Card"
    
    # Custom EE metadata
    if hasattr(pe, "ee_processor"):
        pe.ee_processor = "stripe"
    if hasattr(pe, "ee_booking") and booking_name:
        pe.ee_booking = booking_name
    if hasattr(pe, "ee_tip_amount") and tip_amount > 0:
        pe.ee_tip_amount = flt(tip_amount)
        
    # Allocate to Sales Invoice
    pe.append("references", {
        "reference_doctype": "Sales Invoice",
        "reference_name": invoice_name,
        "total_amount": flt(invoice.grand_total),
        "outstanding_amount": flt(invoice.outstanding_amount),
        "allocated_amount": allocated_amount
    })
    
    pe.insert(ignore_permissions=True)
    try:
        pe.submit()
    except Exception as e:
        frappe.log_error(f"Error submitting Payment Entry for Terminal payment: {e}", "Stripe Terminal POS")
        # Keep drafted if submission fails due to GL restrictions
        
    # Update tip amount on invoice if present
    if tip_amount > 0:
        if frappe.get_meta("Sales Invoice").has_field("ee_tip_amount"):
            existing_tip = flt((invoice.get("ee_tip_amount") if hasattr(invoice, "get") else getattr(invoice, "ee_tip_amount", 0)) or 0)
            frappe.db.set_value("Sales Invoice", invoice_name, "ee_tip_amount", existing_tip + flt(tip_amount))
            
        # Distribute tips into event tip pool
        if booking_name:
            try:
                from entertainment_express.payroll.tip_splitter import distribute_booking_tips
                distribute_booking_tips(booking_id=booking_name, tip_pool_amount=flt(tip_amount))
            except Exception as te:
                frappe.logger().warning(f"Terminal POS: Tip distribution failed for booking {booking_name}: {te}")
                
    # Update Event Booking status
    if booking_name and frappe.db.exists("Event Booking", booking_name):
        booking_doc = frappe.get_doc("Event Booking", booking_name)
        new_outstanding = max(0.0, flt(booking_doc.outstanding_amount) - allocated_amount)
        booking_doc.outstanding_amount = new_outstanding
        if new_outstanding <= 0:
            booking_doc.payment_status = "Paid in Full"
        elif new_outstanding < flt(booking_doc.total_amount):
            booking_doc.payment_status = "Partially Paid"
        booking_doc.save(ignore_permissions=True)
        
    frappe.db.commit()
    return pe.name


@frappe.whitelist()
def send_digital_receipt(
    recipient: str,
    method: str,
    invoice_name: str,
    total_amount: float,
    tip_amount: float = 0,
    last4: str = ""
) -> dict:
    """
    Send an instant digital receipt to customer phone (SMS) or email.
    """
    _assert_pos_access()
    invoice = frappe.get_doc("Sales Invoice", invoice_name)
    company = invoice.company or "Entertainment Express"
    
    msg = (
        f"Receipt from {company}:\n"
        f"Invoice: {invoice_name}\n"
        f"Total Paid: ${flt(total_amount):.2f}"
    )
    if flt(tip_amount) > 0:
        msg += f" (incl. ${flt(tip_amount):.2f} tip)"
    if last4:
        msg += f"\nCard: •••• {last4}"
    msg += f"\nThank you for choosing {company}!"
    
    if method.lower() == "sms":
        from entertainment_express.api.communications import send_sms
        res = send_sms(to=recipient, message=msg)
        return {"status": "dispatched", "method": "sms", "recipient": recipient}
    else:
        body = f"<div style='white-space: pre-wrap; font-family:-apple-system,BlinkMacSystemFont,sans-serif;line-height:1.6;'>{msg}</div>"
        try:
            from entertainment_express.white_label.kit import wrap_email_html, kit_dict
            body = wrap_email_html(body, kit_dict())
        except Exception:
            pass
        frappe.sendmail(
            recipients=[recipient],
            subject=f"Your Payment Receipt from {company} ({invoice_name})",
            message=body,
        )
        return {"status": "dispatched", "method": "email", "recipient": recipient}
