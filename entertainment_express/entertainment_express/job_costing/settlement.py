# Copyright (c) 2026, Trec-Tor Consulting and contributors
# For license information, please see license.txt

import frappe
from frappe.utils import flt, now_datetime, add_days, get_datetime
from entertainment_express.job_costing.cost_engine import recompute_event_cost_sheet


def validate_expense_against_locked_ledger(doc, method=None):
    """
    Enforces write-protection on locked Cost Centers / Event Cost Sheets.
    If a booking's ledger is locked (is_ledger_locked = 1), any subsequent
    Timesheet, Purchase Invoice, or Stock Entry submission without admin override is rejected.
    """
    booking_name = getattr(doc, "ee_booking", None)
    if not booking_name and getattr(doc, "booking", None):
        booking_name = doc.booking
    if not booking_name and getattr(doc, "project", None) and hasattr(frappe, "db"):
        booking_name = frappe.db.get_value("Event Booking", {"project": doc.project}, "name")
    if not booking_name and getattr(doc, "cost_center", None) and hasattr(frappe, "db"):
        booking_name = frappe.db.get_value("Event Booking", {"cost_center": doc.cost_center}, "name")

    if not booking_name and doc.doctype == "Timesheet" and getattr(doc, "time_logs", None):
        for log in doc.time_logs:
            if getattr(log, "ee_booking", None):
                booking_name = log.ee_booking
                break

    if not booking_name or not hasattr(frappe, "db"):
        return

    sheet_name = frappe.db.get_value("Event Cost Sheet", {"event_booking": booking_name}, "name")
    if not sheet_name:
        return

    is_locked = frappe.db.get_value("Event Cost Sheet", sheet_name, "is_ledger_locked")
    if is_locked:
        roles = frappe.get_roles() if hasattr(frappe, "get_roles") else []
        if "EE Tenant Admin" not in roles and "System Manager" not in roles:
            frappe.throw(
                f"Cannot post {doc.doctype} '{getattr(doc, 'name', '')}': Cost Center for booking '{booking_name}' is locked post-event settlement.",
                frappe.ValidationError,
            )


@frappe.whitelist(methods=["POST"])
def settle_event_cost_center(booking_name: str, force: bool = False) -> dict:
    """
    Reconciles cost sheet variances, generates closing ERPNext Journal Entry,
    and locks the booking's Cost Center against further journal postings.
    """
    if not booking_name or not frappe.db.exists("Event Booking", booking_name):
        frappe.throw(f"Event Booking {booking_name} not found.", frappe.DoesNotExistError)

    booking = frappe.get_doc("Event Booking", booking_name)
    status = getattr(booking, "status", "")

    if status != "completed" and not force:
        frappe.throw(
            f"Cannot settle booking '{booking_name}' with status '{status}'. Event must be completed.",
            frappe.ValidationError,
        )

    # Recompute cost sheet to ensure latest numbers
    recompute_event_cost_sheet(booking_name)

    sheet_name = frappe.db.get_value("Event Cost Sheet", {"event_booking": booking_name}, "name")
    if not sheet_name:
        frappe.throw(f"No Event Cost Sheet found for booking {booking_name}.", frappe.DoesNotExistError)

    cost_sheet = frappe.get_doc("Event Cost Sheet", sheet_name)

    if getattr(cost_sheet, "is_ledger_locked", 0) and not force:
        return {
            "booking_name": booking_name,
            "cost_sheet": cost_sheet.name,
            "journal_entry": getattr(cost_sheet, "settlement_journal_entry", None),
            "locked": True,
            "final_margin": flt(cost_sheet.margin_percent),
            "message": "Ledger is already locked.",
        }

    # Generate ERPNext reconciliation Journal Entry for equipment wear & overhead allocations
    je_name = None
    wear_cost = flt(cost_sheet.equipment_wear_cost)
    if wear_cost > 0 and frappe.db.table_exists("Journal Entry"):
        try:
            company = getattr(booking, "company", None) or frappe.defaults.get_user_default("Company") or "Main Company"
            cost_center = getattr(booking, "cost_center", None) or "Main Cost Center"
            je_doc = frappe.get_doc({
                "doctype": "Journal Entry",
                "voucher_type": "Journal Entry",
                "company": company,
                "user_remark": f"Post-event equipment wear & ledger settlement for {booking_name}",
                "accounts": [
                    {
                        "account": f"Equipment Wear Expense - {company[:3].upper()}",
                        "debit_in_account_currency": wear_cost,
                        "credit_in_account_currency": 0.0,
                        "cost_center": cost_center,
                    },
                    {
                        "account": f"Equipment Wear Clearing - {company[:3].upper()}",
                        "debit_in_account_currency": 0.0,
                        "credit_in_account_currency": wear_cost,
                        "cost_center": cost_center,
                    },
                ],
            })
            je_doc.insert(ignore_permissions=True)
            if hasattr(je_doc, "submit"):
                try:
                    je_doc.submit()
                except Exception:
                    pass
            je_name = je_doc.name
        except Exception as e:
            if hasattr(frappe, "log_error"):
                frappe.log_error(f"Failed creating settlement Journal Entry for {booking_name}: {e}", "Ledger Settlement")

    current_user = getattr(frappe.session, "user", "Administrator") if hasattr(frappe, "session") else "Administrator"

    cost_sheet.is_ledger_locked = 1
    cost_sheet.locked_at = now_datetime()
    cost_sheet.locked_by = current_user
    if je_name:
        cost_sheet.settlement_journal_entry = je_name
    cost_sheet.save(ignore_permissions=True)

    # Disable Cost Center directly if field exists
    if getattr(booking, "cost_center", None) and frappe.db.exists("Cost Center", booking.cost_center):
        try:
            cc = frappe.get_doc("Cost Center", booking.cost_center)
            if hasattr(cc, "disabled"):
                cc.disabled = 1
                cc.save(ignore_permissions=True)
        except Exception:
            pass

    return {
        "booking_name": booking_name,
        "cost_sheet": cost_sheet.name,
        "journal_entry": je_name,
        "locked": True,
        "final_margin": flt(cost_sheet.margin_percent),
    }


def auto_settle_completed_bookings():
    """
    Scheduled daily background job to auto-settle completed bookings older than auto_lock_cost_center_days.
    """
    lock_days = 7
    if hasattr(frappe, "db") and frappe.db.table_exists("EE Portal Settings"):
        val = frappe.db.get_single_value("EE Portal Settings", "auto_lock_cost_center_days")
        if val is not None and val != "":
            lock_days = int(val)

    cutoff_date = add_days(now_datetime(), -lock_days)

    if not hasattr(frappe, "db") or not frappe.db.table_exists("Event Booking"):
        return

    bookings = frappe.db.get_all(
        "Event Booking",
        filters={"status": "completed"},
        fields=["name", "modified", "cost_sheet"],
    )

    settled_count = 0
    for b in bookings:
        sheet_name = b.get("cost_sheet")
        if not sheet_name and frappe.db.table_exists("Event Cost Sheet"):
            sheet_name = frappe.db.get_value("Event Cost Sheet", {"event_booking": b["name"]}, "name")

        if sheet_name:
            is_locked = frappe.db.get_value("Event Cost Sheet", sheet_name, "is_ledger_locked")
            if is_locked:
                continue

        b_modified = get_datetime(b.get("modified"))
        if b_modified and b_modified <= get_datetime(cutoff_date):
            try:
                settle_event_cost_center(b["name"])
                settled_count += 1
            except Exception as e:
                if hasattr(frappe, "log_error"):
                    frappe.log_error(f"Auto settlement failed for {b['name']}: {e}", "Auto Settlement")

    return settled_count
