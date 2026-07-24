"""
HR & Workforce API — worker availability, timesheets, payroll, compliance.

All functions @frappe.whitelist(), role-checked.
"""

import frappe
from frappe.utils import flt, now_datetime, get_datetime, getdate, date_diff
from datetime import datetime, time, timedelta


# ── Worker Availability ──────────────────────────────────────────────────────

@frappe.whitelist()
def check_worker_availability(employee: str, event_start_str: str, event_end_str: str) -> dict:
    """
    Check if an employee is available for a booking time slot.
    Returns (available: bool, reason: str).
    
    Checks:
    1. Worker Availability record exists and covers the slot
    2. No time-off / blackout for that date
    """
    _check_role(["EE Tenant Admin", "EE Dispatcher", "System Manager"])

    event_start = frappe.utils.get_datetime(event_start_str)
    event_end = frappe.utils.get_datetime(event_end_str)
    event_date = event_start.date()
    day_of_week = event_date.strftime("%A").lower()  # monday, tuesday, ...

    # Get Worker Availability
    wa_name = frappe.db.get_value("Worker Availability", {"employee": employee}, "name")
    if not wa_name:
        return {"available": False, "reason": f"No availability schedule set for {employee}"}

    wa = frappe.get_doc("Worker Availability", wa_name)
    start_field = f"{day_of_week}_start_time"
    end_field = f"{day_of_week}_end_time"

    if not hasattr(wa, start_field) or not getattr(wa, start_field):
        return {"available": False, "reason": f"{employee} does not work on {day_of_week.capitalize()}"}

    avail_start = getattr(wa, start_field)  # HH:MM format
    avail_end = getattr(wa, end_field)

    # Convert times to comparable format
    event_start_time = event_start.time()
    event_end_time = event_end.time()

    if not (avail_start <= event_start_time and event_end_time <= avail_end):
        return {
            "available": False,
            "reason": (
                f"Event slot {event_start_time}–{event_end_time} outside "
                f"availability {avail_start}–{avail_end} on {day_of_week.capitalize()}"
            ),
        }

    # Check for time-off: any Event Booking with status='time_off' for that employee/date
    time_off = frappe.db.count(
        "Event Booking",
        {"customer": employee, "event_date": event_date, "status": "time_off"},
    )
    if time_off:
        return {"available": False, "reason": f"{employee} has time-off scheduled for {event_date}"}

    return {"available": True, "reason": ""}


# ── Timesheets ──────────────────────────────────────────────────────────────

@frappe.whitelist()
def get_or_create_timesheet(employee: str, start_date: str) -> dict:
    """Get or create a Timesheet for the given employee and week."""
    _check_role(["EE Tenant Admin", "EE HR", "EE Crew", "System Manager"])

    start = frappe.utils.getdate(start_date)
    end = start + timedelta(days=6)

    existing = frappe.db.get_value(
        "Timesheet",
        {"employee": employee, "start_date": start},
        "name",
    )
    if existing:
        return {"timesheet": existing, "created": False}

    ts = frappe.get_doc({
        "doctype": "Timesheet",
        "employee": employee,
        "start_date": start,
        "end_date": end,
    })
    ts.insert(ignore_permissions=True)
    frappe.db.commit()
    return {"timesheet": ts.name, "created": True}


@frappe.whitelist()
def add_timesheet_detail(timesheet_name: str, booking: str = None, hours: float = None,
                         role: str = None, bill_rate: float = None) -> dict:
    """Add a detail row to a timesheet."""
    _check_role(["EE Tenant Admin", "EE HR", "System Manager"])

    ts = frappe.get_doc("Timesheet", timesheet_name)
    if ts.docstatus > 0:
        frappe.throw("Cannot edit a submitted timesheet.")

    if not hours or flt(hours) <= 0:
        frappe.throw("Hours must be > 0.")

    ts.append("timesheets_detail", {
        "project": None,
        "task": None,
        "ee_booking": booking,
        "ee_crew_role": role,
        "working_hours": flt(hours),
        "ee_bill_rate": flt(bill_rate) if bill_rate else 0.0,
        "ee_approved": 0,
    })
    ts.save(ignore_permissions=True)
    frappe.db.commit()
    return {"detail_row": len(ts.timesheets_detail), "timesheet": ts.name}


@frappe.whitelist()
def approve_timesheet(timesheet_name: str) -> dict:
    """Mark a timesheet as approved."""
    _check_role(["EE Tenant Admin", "EE HR", "System Manager"])

    ts = frappe.get_doc("Timesheet", timesheet_name)
    if ts.docstatus > 0:
        frappe.throw("Already submitted.")

    # Approve all details
    for row in ts.timesheets_detail:
        row.ee_approved = 1
    ts.save(ignore_permissions=True)
    frappe.db.commit()

    # Notify employee
    emp = frappe.get_doc("Employee", ts.employee)
    emp_email = emp.user_id or emp.prefered_email or ""
    if emp_email:
        from entertainment_express.notifications import send
        send("timesheet_approved", emp_email, {
            "employee_name": emp.employee_name,
            "timesheet": ts.name,
            "period": f"{ts.start_date} to {ts.end_date}",
            "total_hours": sum(d.working_hours for d in ts.timesheets_detail),
        })

    return {"timesheet": ts.name, "status": "approved"}


# ── Payroll & Payouts ────────────────────────────────────────────────────────

@frappe.whitelist()
def create_pay_run(period_from: str, period_to: str, worker_list: list = None) -> dict:
    """
    Build a Pay Run for the period, pulling approved timesheets and event fees.
    worker_list: list of employee names (if empty, all workers).
    """
    _check_role(["EE Tenant Admin", "EE Finance", "System Manager"])

    period_from = frappe.utils.getdate(period_from)
    period_to = frappe.utils.getdate(period_to)

    if not worker_list:
        worker_list = frappe.get_all("Employee", fields=["name"], limit=999)
        worker_list = [w["name"] for w in worker_list]

    pr = frappe.get_doc({
        "doctype": "Pay Run",
        "period_from": period_from,
        "period_to": period_to,
        "status": "draft",
        "payout_processor": "stripe_connect",
    })

    total = 0.0
    for emp_name in worker_list:
        # Approved timesheets for the period
        timesheets = frappe.get_all(
            "Timesheet",
            filters={"employee": emp_name, "start_date": [">=", period_from], "start_date": ["<=", period_to]},
            fields=["name"],
        )

        event_fees = 0.0
        hourly_pay = 0.0

        for ts_row in timesheets:
            ts = frappe.get_doc("Timesheet", ts_row["name"])
            for detail in ts.timesheets_detail:
                if detail.get("ee_approved"):
                    bill_rate = detail.get("ee_bill_rate") or frappe.db.get_value(
                        "Employee", emp_name, "ee_default_pay_rate"
                    ) or 0.0
                    hourly_pay += flt(detail.working_hours) * flt(bill_rate)

        # Event fees from Crew Assignments with status completed
        completed_assignments = frappe.get_all(
            "Crew Assignment",
            filters={"crew_member": emp_name, "status": "completed"},
            fields=["pay_rate"],
        )
        for ca in completed_assignments:
            event_fees += flt(ca.get("pay_rate", 0.0))

        tips = 0.0  # Placeholder; could pull from tips table in future
        gross = event_fees + hourly_pay + tips

        if gross > 0:
            pr.append("workers", {
                "worker": emp_name,
                "event_fees": event_fees,
                "hourly_pay": hourly_pay,
                "tips": tips,
                "gross_amount": gross,
                "payout_method": "",
                "txn_id": "",
            })
            total += gross

    pr.total_amount = total
    pr.insert(ignore_permissions=True)
    frappe.db.commit()
    return {"pay_run": pr.name, "total": total}


@frappe.whitelist()
def finalize_pay_run(pay_run_name: str) -> dict:
    """Lock pay run for payout."""
    _check_role(["EE Tenant Admin", "EE Finance", "System Manager"])

    pr = frappe.get_doc("Pay Run", pay_run_name)
    if pr.status != "draft":
        frappe.throw(f"Cannot finalize from status '{pr.status}'.")

    # Recalculate total
    total = sum(flt(d.gross_amount) for d in pr.workers)
    pr.total_amount = total
    pr.status = "finalized"
    pr.save(ignore_permissions=True)
    frappe.db.commit()
    return {"pay_run": pr.name, "status": "finalized", "total": total}


@frappe.whitelist()
def process_payout(pay_run_name: str) -> dict:
    """Process payout (stub: in production, call Stripe API or payroll processor)."""
    _check_role(["EE Tenant Admin", "EE Finance", "System Manager"])

    pr = frappe.get_doc("Pay Run", pay_run_name)
    if pr.status not in ("finalized",):
        frappe.throw(f"Cannot process from status '{pr.status}'.")

    # Stub: mark as submitted + set to pending_payout
    # In production, call Stripe Connect API per worker
    pr.status = "pending_payout"
    pr.save(ignore_permissions=True)

    # Stub: set txn_id for each worker (in production, get from Stripe response)
    for detail in pr.workers:
        detail.txn_id = f"STRIPE-{frappe.utils.random_string(12)}"

    pr.status = "paid"
    pr.save(ignore_permissions=True)
    frappe.db.commit()

    # Notify finance / workers
    for detail in pr.workers:
        emp = frappe.get_doc("Employee", detail.worker)
        emp_email = emp.user_id or emp.prefered_email or ""
        if emp_email:
            from entertainment_express.notifications import send
            send("payout_processed", emp_email, {
                "employee_name": emp.employee_name,
                "amount": detail.gross_amount,
                "txn_id": detail.txn_id,
                "period": f"{pr.period_from} to {pr.period_to}",
            })

    return {"pay_run": pr.name, "status": "paid"}


# ── Compliance Documents ─────────────────────────────────────────────────────

@frappe.whitelist()
def get_compliance_status(employee: str) -> dict:
    """
    Return required compliance documents for an employee and their status.
    Required: W9 for 1099, contract, background check.
    """
    _check_role(["EE Tenant Admin", "EE HR", "System Manager"])

    emp = frappe.get_doc("Employee", employee)
    emp_type = emp.get("ee_employment_type") or "w2"

    required = ["contract", "background_check"]
    if emp_type == "1099":
        required.append("w9")

    status = {}
    for doc_type in required:
        doc = frappe.db.get_value(
            "Compliance Document",
            {"employee": employee, "doc_type": doc_type},
            ["name", "status", "expiry_date"],
            as_dict=True,
        )
        if not doc:
            status[doc_type] = {"status": "missing", "expiry": None}
        else:
            # Check expiry
            if doc.expiry_date and frappe.utils.getdate(doc.expiry_date) < frappe.utils.today():
                status[doc_type] = {"status": "expired", "expiry": doc.expiry_date}
            else:
                status[doc_type] = {"status": doc.status, "expiry": doc.expiry_date}

    return {"employee": employee, "employment_type": emp_type, "documents": status}


@frappe.whitelist()
def upload_compliance_document(employee: str, doc_type: str, file_path: str = None) -> dict:
    """
    Create or update a compliance document.
    file_path: attach file to the document.
    """
    _check_role(["EE Tenant Admin", "EE HR", "System Manager"])

    doc_type_choices = ["w9", "contract", "background_check", "driver_license", "insurance"]
    if doc_type not in doc_type_choices:
        frappe.throw(f"Invalid doc_type: {doc_type}")

    existing = frappe.db.get_value(
        "Compliance Document",
        {"employee": employee, "doc_type": doc_type},
        "name",
    )
    if existing:
        cd = frappe.get_doc("Compliance Document", existing)
    else:
        cd = frappe.get_doc({
            "doctype": "Compliance Document",
            "employee": employee,
            "doc_type": doc_type,
            "status": "pending",
        })

    if file_path:
        cd.file = file_path

    cd.save(ignore_permissions=True)
    frappe.db.commit()
    return {"compliance_document": cd.name, "status": cd.status}


# ── Helpers ──────────────────────────────────────────────────────────────────

def _check_role(allowed_roles: list[str]) -> None:
    if frappe.session.user == "Guest":
        frappe.throw("Authentication required.", frappe.PermissionError)
    user_roles = frappe.get_roles(frappe.session.user)
    if not any(r in user_roles for r in allowed_roles):
        frappe.throw("Insufficient permissions.", frappe.PermissionError)
