"""
Booking API — CRUD, holds, conversion, reschedule, cancel.
All state mutations go through this module; never mutate Event Booking directly
from the portal without calling these functions.
"""

import secrets
import frappe
from frappe.utils import flt, now_datetime, add_to_date


@frappe.whitelist()
def convert_to_booking(contract_name: str = None, quotation_name: str = None) -> dict:
    """
    Convert a signed contract (or accepted quotation) into a confirmed Event Booking.
    Creates a deposit Sales Invoice.
    Idempotent — skips if a booking already exists for this contract/quotation.
    """
    if contract_name:
        contract = frappe.get_doc("EE Contract", contract_name)
        if contract.booking:
            return {"booking": contract.booking, "status": "already_exists"}
        quotation_name = contract.quotation

    if not quotation_name:
        frappe.throw("quotation_name or contract_name required.")

    quote = frappe.get_doc("Quotation", quotation_name)

    # Build booking
    booking = frappe.get_doc({
        "doctype": "Event Booking",
        "customer": quote.party_name,
        "status": "confirmed" if contract_name else "tentative",
        "source": "portal",
        "event_name": (
            getattr(quote, "ee_event_name", None)
            or f"{quote.party_name} — {quote.ee_event_date}"
        ),
        "event_type": (getattr(quote, "ee_event_type", None) or "") if hasattr(quote, "ee_event_type") else "",
        "event_date": quote.ee_event_date,
        "start_time": quote.ee_event_start,
        "end_time": quote.ee_event_end,
        "timezone": quote.ee_timezone or "America/New_York",
        "venue_address": quote.ee_venue_address,
        "venue_geo": quote.ee_venue_geo,
        "service_area": quote.ee_service_area,
        "travel_fee": flt(quote.ee_travel_fee),
        "quotation": quotation_name,
        "deposit_percent": flt(quote.ee_deposit_percent or 25),
    })

    # Copy items from quotation
    for item in quote.items:
        booking.append("service_items", {
            "item": item.item_code,
            "qty": flt(item.qty),
            "rate": flt(item.rate),
            "amount": flt(item.amount),
        })

    # Compute totals
    items_total = sum(flt(i.amount) for i in booking.service_items)
    grand_total = flt(items_total) + flt(booking.travel_fee)
    deposit_amount = flt(grand_total * flt(booking.deposit_percent) / 100)
    booking.grand_total = grand_total
    booking.deposit_amount = deposit_amount
    booking.balance_due = flt(grand_total - deposit_amount)
    booking.deposit_status = "none"

    booking.insert(ignore_permissions=False)

    # Link contract → booking
    if contract_name:
        frappe.db.set_value("EE Contract", contract_name, "booking", booking.name)
        frappe.db.set_value("Quotation", quotation_name, "ee_booking", booking.name)

    # Create deposit invoice
    _create_deposit_invoice(booking)

    frappe.db.commit()
    return {"booking": booking.name, "status": "created"}


@frappe.whitelist()
def create_hold(
    asset_names: list,
    event_start: str,
    event_end: str,
    customer_name: str = "",
    customer_email: str = "",
    ttl_minutes: int = 15,
) -> dict:
    """
    Reserve assets for a short window (default 15 min) during checkout.
    Uses DB row-level locking on the asset rows to prevent race conditions.
    Returns the hold token for use in the payment flow.
    """
    from datetime import datetime

    start_dt = frappe.utils.get_datetime(event_start)
    end_dt = frappe.utils.get_datetime(event_end)
    expires_at = frappe.utils.add_to_date(now_datetime(), minutes=ttl_minutes)

    # Check availability + acquire per-asset DB lock
    from entertainment_express.booking.availability import check

    for asset_name in asset_names:
        # FOR UPDATE lock: ensures only one hold wins for unique assets
        frappe.db.sql(
            "SELECT name FROM `tabService Asset` WHERE name = %s FOR UPDATE",
            (asset_name,),
        )
        result = check(asset_name, start_dt, end_dt)
        if not result.get("available"):
            frappe.db.rollback()
            frappe.throw(
                f"Asset '{asset_name}' is no longer available: {result.get('reason')}",
                frappe.ValidationError,
            )

    token = secrets.token_urlsafe(32)
    hold = frappe.get_doc({
        "doctype": "Event Booking Hold",
        "token": token,
        "event_start": start_dt,
        "event_end": end_dt,
        "expires_at": expires_at,
        "customer_name": customer_name,
        "customer_email": customer_email,
        "resources": [{"asset": a, "quantity_reserved": 1} for a in asset_names],
    })
    hold.insert(ignore_permissions=True)
    frappe.db.commit()

    return {"hold": hold.name, "token": token, "expires_at": str(expires_at)}


@frappe.whitelist()
def reschedule_booking(booking_name: str, new_event_date: str,
                       new_start_time: str = None, new_end_time: str = None) -> dict:
    """Reschedule a booking: re-check asset availability, update times."""
    _check_role(["EE Tenant Admin", "EE Sales", "EE Dispatcher", "System Manager"])
    from datetime import datetime, time

    booking = frappe.get_doc("Event Booking", booking_name)
    if booking.status in ("completed", "canceled"):
        frappe.throw(f"Cannot reschedule a {booking.status} booking.")

    new_date = frappe.utils.getdate(new_event_date)
    new_start = frappe.utils.get_time(new_start_time) if new_start_time else booking.start_time
    new_end = frappe.utils.get_time(new_end_time) if new_end_time else booking.end_time

    start_dt = datetime.combine(new_date, new_start)
    end_dt = datetime.combine(new_date, new_end)

    from entertainment_express.booking.availability import check
    for asset_row in booking.assigned_assets:
        result = check(asset_row.asset, start_dt, end_dt)
        if not result.get("available"):
            # Exclude current booking from conflict count
            conflicts = [c for c in result.get("conflicts", []) if c != booking_name]
            if conflicts:
                frappe.throw(
                    f"Asset '{asset_row.asset}' is not available for the new date.",
                    frappe.ValidationError,
                )

    booking.event_date = new_date
    booking.start_time = new_start
    booking.end_time = new_end
    booking.save(ignore_permissions=False)
    frappe.db.commit()
    return {"status": "rescheduled", "booking": booking_name}


@frappe.whitelist()
def cancel_booking(booking_name: str, reason: str = "") -> dict:
    """Cancel a booking, releasing its asset reservations."""
    _check_role(["EE Tenant Admin", "EE Sales", "System Manager"])
    booking = frappe.get_doc("Event Booking", booking_name)
    if booking.status == "canceled":
        return {"status": "already_canceled"}
    if booking.status == "completed":
        frappe.throw("Cannot cancel a completed booking.")

    booking.db_set("status", "canceled")
    frappe.db.commit()

    # Assets are implicitly released (availability query filters out canceled bookings)
    return {"status": "canceled", "booking": booking_name}


def expire_holds() -> None:
    """
    Called by the Frappe scheduler (hooks.py scheduler_events).
    Marks expired holds as converted=0 so they stop consuming availability.
    """
    expired = frappe.get_all(
        "Event Booking Hold",
        filters={"converted": 0, "expires_at": ("<", now_datetime())},
        fields=["name"],
    )
    for h in expired:
        frappe.db.set_value("Event Booking Hold", h["name"], "converted", 1)
    if expired:
        frappe.db.commit()


# ── Internal helpers ──────────────────────────────────────────────────────────

def _create_deposit_invoice(booking) -> None:
    """Create a deposit Sales Invoice linked to the booking."""
    company = (
        frappe.defaults.get_user_default("Company")
        or frappe.db.get_single_value("Global Defaults", "default_company")
        or frappe.db.get_value("Company", {}, "name")
    )
    if not company:
        frappe.throw("No Company found — cannot create a deposit invoice.")
    income_account = frappe.db.get_value(
        "Account",
        {"account_type": "Income Account", "company": company},
        "name",
    ) or ""

    si = frappe.get_doc({
        "doctype": "Sales Invoice",
        "customer": booking.customer,
        "company": company,
        "currency": "USD",
        "conversion_rate": 1,
        "posting_date": frappe.utils.today(),
        "ee_booking": booking.name,
        "ee_is_deposit": 1,
        "ee_event_date": booking.event_date,
        "items": [{
            "item_name": "Event Deposit",
            "description": f"Deposit for booking {booking.name} on {booking.event_date}",
            "qty": 1,
            "rate": flt(booking.deposit_amount),
            "uom": frappe.db.get_value("UOM", {"name": "Nos"}, "name") or "Unit",
            "income_account": income_account,
        }],
    })
    si.insert(ignore_permissions=True)
    si.submit()

    booking.deposit_status = "invoiced"
    booking.db_set("deposit_status", "invoiced")
    frappe.db.commit()


def _check_role(allowed_roles: list[str]) -> None:
    if frappe.session.user == "Guest":
        frappe.throw("Authentication required.", frappe.PermissionError)
    if not any(r in frappe.get_roles(frappe.session.user) for r in allowed_roles):
        frappe.throw("Insufficient permissions.", frappe.PermissionError)
