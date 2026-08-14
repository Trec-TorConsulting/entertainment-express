"""
Quote API — build, PDF, send, accept.
All functions are whitelisted (callable from portal/front-end via REST).
Money computations use frappe.utils.flt — never float arithmetic.
"""

import frappe
from frappe.utils import flt, now_datetime, add_days, today
from frappe.model.document import Document


@frappe.whitelist()
def build_quote(
    quotation_name: str,
    service_area_name: str | None = None,
    venue_address: str | None = None,
    deposit_percent: float = 25.0,
) -> dict:
    """
    Compute and save quote totals (items + travel fee + tax + deposit).
    Returns the updated Quotation document as dict.
    """
    _check_role(["EE Tenant Admin", "EE Sales", "System Manager"])
    quote = frappe.get_doc("Quotation", quotation_name)

    # Set EE fields
    if service_area_name:
        quote.ee_service_area = service_area_name
    if venue_address:
        quote.ee_venue_address = venue_address
    quote.ee_deposit_percent = flt(deposit_percent)

    # Compute travel fee from Service Area
    if quote.ee_service_area:
        area = frappe.get_doc("Service Area", quote.ee_service_area)
        quote.ee_travel_fee = flt(area.travel_fee)
    else:
        quote.ee_travel_fee = flt(0)

    # Frappe computes item totals in Quotation's validate(); call that logic
    quote.run_method("calculate_taxes_and_totals")

    # Grand total includes travel fee (add as a separate line if not already present)
    # Simpler: store travel fee separately and compute grand_total ourselves
    items_total = flt(quote.total)
    tax_total = flt(quote.total_taxes_and_charges) if hasattr(quote, "total_taxes_and_charges") else flt(0)
    grand_total = flt(items_total) + flt(quote.ee_travel_fee) + flt(tax_total)
    deposit_amount = flt(grand_total * flt(quote.ee_deposit_percent) / 100)

    quote.grand_total = grand_total
    quote.ee_deposit_percent = flt(deposit_percent)
    quote.save(ignore_permissions=False)
    frappe.db.commit()
    return quote.as_dict()


@frappe.whitelist()
def check_asset_availability(quotation_name: str) -> dict:
    """
    Check availability for every Service Asset referenced in the quote's items.
    Returns {available: bool, conflicts: [...]}.
    """
    from entertainment_express.booking.availability import check
    from datetime import datetime, date, time, timedelta

    quote = frappe.get_doc("Quotation", quotation_name)
    if not quote.ee_event_date:
        return {"available": True, "message": "No event date set — skipping check"}

    event_date = quote.ee_event_date
    event_start_t = quote.ee_event_start or time(9, 0)
    event_end_t = quote.ee_event_end or time(17, 0)

    event_start = datetime.combine(event_date, event_start_t)
    event_end = datetime.combine(event_date, event_end_t)

    all_conflicts = []
    for item in quote.items:
        # Find Service Asset linked to this item
        assets = frappe.get_all(
            "Service Asset Linked Item",
            filters={"item": item.item_code},
            fields=["parent"],
            ignore_permissions=True,
        )
        for asset_row in assets:
            result = check(asset_row["parent"], event_start, event_end)
            if not result.get("available"):
                all_conflicts.append({
                    "asset": asset_row["parent"],
                    "reason": result.get("reason"),
                })

    return {"available": len(all_conflicts) == 0, "conflicts": all_conflicts}


@frappe.whitelist()
def send_quote(quotation_name: str) -> dict:
    """
    Send quote to the customer via email and set status to 'Open' (Frappe) / 'sent' (EE).
    Schedules a follow-up reminder task.
    """
    _check_role(["EE Tenant Admin", "EE Sales", "System Manager"])
    quote = frappe.get_doc("Quotation", quotation_name)

    customer_email = frappe.db.get_value("Customer", quote.party_name, "email_id") or ""
    if not customer_email and quote.contact_email:
        customer_email = quote.contact_email

    if not customer_email:
        frappe.throw("No email found for customer — cannot send quote.")

    # Build accept link
    site_url = frappe.utils.get_url()
    accept_link = f"{site_url}/api/method/entertainment_express.api.quote.accept_quote?quotation={quotation_name}&token={_quote_token(quotation_name)}"

    from entertainment_express.notifications import send
    send("quote_sent", customer_email, {
        "customer_name": quote.party_name,
        "company_name": frappe.db.get_single_value("Global Defaults", "default_company"),
        "quote_number": quotation_name,
        "event_date": str(quote.ee_event_date or ""),
        "grand_total": flt(quote.grand_total),
        "accept_link": accept_link,
    })

    # Schedule follow-up reminder (7 days)
    frappe.enqueue(
        "entertainment_express.api.quote._schedule_followup",
        quotation_name=quotation_name,
        after_commit=True,
        queue="long",
    )

    quote.db_set("status", "Open")
    return {"status": "sent", "quotation": quotation_name}


@frappe.whitelist(allow_guest=True)
def accept_quote(quotation=None, token=None) -> dict:
    """
    Customer-facing: accept a quote (called via tokenized link).
    Marks the Quotation as 'Ordered' and creates a draft EE Contract.
    """
    if not quotation or not token:
        frappe.throw("Invalid request.", frappe.PermissionError)
    if token != _quote_token(quotation):
        frappe.throw("Invalid or expired token.", frappe.PermissionError)

    quote = frappe.get_doc("Quotation", quotation)
    if quote.status not in ("Open", "Draft"):
        return {"status": "already_processed", "quotation": quotation}

    # Mark quotation as ordered
    quote.submit()
    frappe.db.set_value("Quotation", quotation, "status", "Ordered")

    # Create a draft contract
    from entertainment_express.api.contract import create_contract
    contract = create_contract(quotation)

    return {"status": "accepted", "quotation": quotation, "contract": contract["name"]}


def _schedule_followup(quotation_name: str) -> None:
    """Send a follow-up reminder if quote is still Open after 7 days."""
    import time as _time
    _time.sleep(7 * 86400)  # This runs in a long-queue worker; real impl uses scheduler
    quote = frappe.get_doc("Quotation", quotation_name)
    if quote.status == "Open":
        customer_email = frappe.db.get_value("Customer", quote.party_name, "email_id") or ""
        if customer_email:
            from entertainment_express.notifications import send
            send("quote_followup", customer_email, {
                "customer_name": quote.party_name,
                "quote_number": quotation_name,
                "event_date": str(quote.ee_event_date or ""),
            })


def _quote_token(quotation_name: str) -> str:
    """Deterministic HMAC token for quote accept link (no stored state needed)."""
    import hmac, hashlib
    secret = frappe.conf.get("ee_signing_secret") or frappe.generate_hash(length=32)
    return hmac.new(
        secret.encode(), quotation_name.encode(), hashlib.sha256
    ).hexdigest()[:32]


def _check_role(allowed_roles: list[str]) -> None:
    if frappe.session.user == "Guest":
        frappe.throw("Authentication required.", frappe.PermissionError)
    user_roles = frappe.get_roles(frappe.session.user)
    if not any(r in user_roles for r in allowed_roles):
        frappe.throw("Insufficient permissions.", frappe.PermissionError)
