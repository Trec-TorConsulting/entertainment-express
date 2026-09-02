"""
HR & Workforce API — hours, time-off, timesheets, payroll, compliance.
"""

from __future__ import annotations

from datetime import datetime, time, timedelta

import frappe
from frappe.utils import flt, get_datetime, getdate


WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
REQUIRED_DOCS = ("contract", "background_check")
LICENSE_DOCS = ("driver_license", "insurance")


def _check_role(allowed_roles: list[str]) -> None:
    if getattr(frappe.session, "user", None) == "Guest":
        frappe.throw("Authentication required.", frappe.PermissionError)
    user_roles = frappe.get_roles(frappe.session.user)
    if not any(r in user_roles for r in allowed_roles):
        frappe.throw("Insufficient permissions.", frappe.PermissionError)


def _to_time(value):
    if value is None or value == "":
        return None
    if isinstance(value, time):
        return value
    if hasattr(value, "total_seconds") and not isinstance(value, datetime):
        secs = int(value.total_seconds())
        return time(secs // 3600, (secs % 3600) // 60, secs % 60)
    raw = str(value)
    if " " in raw and "-" in raw:
        raw = raw.split(" ")[-1]
    parts = raw.split(":")
    return time(int(parts[0] or 0), int(parts[1] or 0) if len(parts) > 1 else 0, int(float(parts[2] or 0)) if len(parts) > 2 else 0)


def _table(name: str) -> bool:
    exists = getattr(frappe.db, "table_exists", None)
    if callable(exists):
        return bool(exists(name))
    return True


def _hours_between(start, end) -> float:
    seconds = (get_datetime(end) - get_datetime(start)).total_seconds()
    return max(0.25, round(seconds / 3600.0, 2))


def worker_on_time_off(employee: str, day) -> bool:
    """True if Worker Time Off or legacy Event Booking time_off covers this date."""
    day = getdate(day)
    if _table("Worker Time Off"):
        rows = frappe.get_all(
            "Worker Time Off",
            filters={"employee": employee, "start_date": ["<=", day], "end_date": [">=", day]},
            limit_page_length=1,
        )
        if rows:
            return True
    if _table("Event Booking"):
        if frappe.db.count(
            "Event Booking",
            {"status": "time_off", "event_date": day, "customer": employee},
        ):
            return True
    return False


def weekly_window(employee: str, day) -> tuple | None:
    """(start, end) for that weekday when a Worker Availability row exists and that day is set."""
    if not _table("Worker Availability"):
        return None
    wa_name = frappe.db.get_value("Worker Availability", {"employee": employee}, "name")
    if not wa_name:
        return None
    wa = frappe.get_doc("Worker Availability", wa_name)
    key = WEEKDAYS[getdate(day).weekday()]
    start = _to_time(getattr(wa, f"{key}_start_time", None))
    end = _to_time(getattr(wa, f"{key}_end_time", None))
    if not start or not end:
        return None
    return (start, end)


def has_availability_record(employee: str) -> bool:
    if not _table("Worker Availability"):
        return False
    return bool(frappe.db.get_value("Worker Availability", {"employee": employee}, "name"))


def hours_cover_window(employee: str, event_start, event_end) -> tuple[bool, str]:
    start = get_datetime(event_start)
    end = get_datetime(event_end)
    if worker_on_time_off(employee, start.date()):
        return False, f"{employee} has time-off scheduled for {start.date()}"
    window = weekly_window(employee, start.date())
    if window is None:
        if has_availability_record(employee):
            return False, f"{employee} does not work on {start.strftime('%A')}"
        return True, ""
    avail_start, avail_end = window
    if not (avail_start <= start.time() and end.time() <= avail_end):
        return False, (
            f"Event slot {start.time()}–{end.time()} outside "
            f"availability {avail_start}–{avail_end} on {start.strftime('%A')}"
        )
    return True, ""


def required_docs_for(employee: str) -> list[str]:
    emp_type = "w2"
    if _table("Employee"):
        emp_type = frappe.db.get_value("Employee", employee, "ee_employment_type") or "w2"
    required = list(REQUIRED_DOCS)
    if str(emp_type) == "1099":
        required.append("w9")
    return required


def _row_get(row, key, default=None):
    if row is None:
        return default
    if isinstance(row, dict):
        return row.get(key, default)
    return getattr(row, key, default)


def compliance_block_reason(employee: str) -> str | None:
    if not _table("Compliance Document"):
        return None
    for doc_type in required_docs_for(employee):
        doc = frappe.db.get_value(
            "Compliance Document",
            {"employee": employee, "doc_type": doc_type},
            ["name", "status", "expiry_date"],
            as_dict=True,
        )
        if not doc:
            return f"Missing required {doc_type.replace('_', ' ')}"
        status = (str(_row_get(doc, "status") or "")).lower()
        expiry = _row_get(doc, "expiry_date")
        if expiry and getdate(expiry) < getdate():
            return f"{doc_type.replace('_', ' ')} expired"
        if status in ("expired", "rejected"):
            return f"{doc_type.replace('_', ' ')} is {status}"
    for doc_type in LICENSE_DOCS:
        doc = frappe.db.get_value(
            "Compliance Document",
            {"employee": employee, "doc_type": doc_type},
            ["status", "expiry_date"],
            as_dict=True,
        )
        if not doc:
            continue
        expiry = _row_get(doc, "expiry_date")
        status = (str(_row_get(doc, "status") or "")).lower()
        if status == "expired" or (expiry and getdate(expiry) < getdate()):
            return f"{doc_type.replace('_', ' ')} expired"
    return None


def assignment_block_reason(employee: str, event_start=None, event_end=None) -> str | None:
    """Why this person cannot take the job, or None.

    Missing required docs only gate people who already have a weekly hours row
    (onboarded). Expired/rejected certs always gate. No hours row = legacy crew.
    """
    expired = None
    if _table("Compliance Document"):
        expired = _expired_cert_reason(employee)
    if expired:
        return expired
    if has_availability_record(employee):
        missing = compliance_block_reason(employee)
        if missing:
            return missing
    if event_start and event_end:
        ok, reason = hours_cover_window(employee, event_start, event_end)
        if not ok:
            return reason
    elif event_start and worker_on_time_off(employee, get_datetime(event_start).date()):
        return f"{employee} has time-off scheduled for {get_datetime(event_start).date()}"
    return None


def _expired_cert_reason(employee: str) -> str | None:
    docs = frappe.get_all(
        "Compliance Document",
        filters={"employee": employee},
        fields=["doc_type", "status", "expiry_date"],
        limit_page_length=20,
    )
    today = getdate()
    for doc in docs:
        status = (doc.get("status") if isinstance(doc, dict) else doc.status) or ""
        expiry = doc.get("expiry_date") if isinstance(doc, dict) else doc.expiry_date
        label = (doc.get("doc_type") if isinstance(doc, dict) else doc.doc_type) or "document"
        if str(status).lower() == "expired" or (expiry and getdate(expiry) < today):
            return f"{str(label).replace('_', ' ')} expired"
        if str(status).lower() == "rejected":
            return f"{str(label).replace('_', ' ')} is rejected"
    return None


@frappe.whitelist()
def check_worker_availability(employee: str, event_start_str: str, event_end_str: str) -> dict:
    _check_role(["EE Tenant Admin", "EE Dispatcher", "EE HR", "System Manager"])
    ok, reason = hours_cover_window(employee, event_start_str, event_end_str)
    return {"available": ok, "reason": reason}


@frappe.whitelist()
def get_or_create_timesheet(employee: str, start_date: str) -> dict:
    _check_role(["EE Tenant Admin", "EE HR", "EE Accounting", "EE Crew", "EE Entertainer", "System Manager"])
    start = getdate(start_date)
    start = start - timedelta(days=start.weekday())
    end = start + timedelta(days=6)
    existing = frappe.db.get_value("Timesheet", {"employee": employee, "start_date": start}, "name")
    if existing:
        return {"timesheet": existing, "created": False}
    ts = frappe.get_doc({"doctype": "Timesheet", "employee": employee, "start_date": start, "end_date": end})
    ts.insert(ignore_permissions=True)
    frappe.db.commit()
    return {"timesheet": ts.name, "created": True}


@frappe.whitelist()
def add_timesheet_detail(
    timesheet_name: str,
    booking: str = None,
    hours: float = None,
    role: str = None,
    bill_rate: float = None,
) -> dict:
    _check_role(["EE Tenant Admin", "EE HR", "EE Accounting", "EE Dispatcher", "EE Crew", "System Manager"])
    ts = frappe.get_doc("Timesheet", timesheet_name)
    if getattr(ts, "docstatus", 0) > 0:
        frappe.throw("Cannot edit a submitted timesheet.")
    if not hours or flt(hours) <= 0:
        frappe.throw("Hours must be > 0.")
    ts.append(
        "timesheets_detail",
        {
            "ee_booking": booking,
            "ee_crew_role": role,
            "working_hours": flt(hours),
            "ee_bill_rate": flt(bill_rate) if bill_rate else 0.0,
            "ee_approved": 0,
        },
    )
    ts.save(ignore_permissions=True)
    frappe.db.commit()
    return {"detail_row": len(ts.timesheets_detail), "timesheet": ts.name}


def record_checkout_hours(assignment) -> dict | None:
    """Append pending timesheet hours from a completed Crew Assignment. Caller authorizes."""
    check_in = getattr(assignment, "check_in", None)
    check_out = getattr(assignment, "check_out", None)
    if not check_in or not check_out:
        return None
    hours = _hours_between(check_in, check_out)
    rate = flt(getattr(assignment, "pay_rate", 0) or 0)
    if not rate:
        rate = flt(frappe.db.get_value("Employee", assignment.crew_member, "ee_default_pay_rate") or 0)
    created = get_or_create_timesheet(assignment.crew_member, str(getdate(check_in)))
    return add_timesheet_detail(
        created["timesheet"],
        booking=getattr(assignment, "booking", None),
        hours=hours,
        role=getattr(assignment, "role", None),
        bill_rate=rate,
    )


@frappe.whitelist()
def approve_timesheet(timesheet_name: str) -> dict:
    _check_role(["EE Tenant Admin", "EE HR", "EE Accounting", "System Manager"])
    ts = frappe.get_doc("Timesheet", timesheet_name)
    if getattr(ts, "docstatus", 0) > 0:
        frappe.throw("Already submitted.")
    for row in ts.timesheets_detail:
        row.ee_approved = 1
    ts.save(ignore_permissions=True)
    frappe.db.commit()
    emp = frappe.get_doc("Employee", ts.employee)
    emp_email = emp.user_id or getattr(emp, "prefered_email", "") or ""
    if emp_email:
        from entertainment_express.notifications import send

        send(
            "timesheet_approved",
            emp_email,
            {
                "employee_name": emp.employee_name,
                "timesheet": ts.name,
                "period": f"{ts.start_date} to {ts.end_date}",
                "total_hours": sum(flt(d.working_hours) for d in ts.timesheets_detail),
            },
        )
    return {"timesheet": ts.name, "status": "approved"}


def attributed_tips(employee: str, period_from, period_to) -> float:
    period_from, period_to = getdate(period_from), getdate(period_to)
    total = 0.0
    meta = getattr(frappe, "get_meta", None)
    has_tip = True
    if callable(meta):
        try:
            has_tip = meta("Sales Invoice").has_field("ee_tip_amount")
        except Exception:
            has_tip = False
    if not has_tip or not _table("Sales Invoice"):
        return 0.0
    invoices = frappe.get_all(
        "Sales Invoice",
        filters={"docstatus": ["<", 2], "ee_tip_amount": [">", 0]},
        fields=["name", "ee_booking", "ee_tip_amount"],
        limit_page_length=500,
    )
    for inv in invoices:
        booking = inv.get("ee_booking") if isinstance(inv, dict) else getattr(inv, "ee_booking", None)
        tip = flt(inv.get("ee_tip_amount") if isinstance(inv, dict) else getattr(inv, "ee_tip_amount", 0))
        if not booking or tip <= 0:
            continue
        event_date = frappe.db.get_value("Event Booking", booking, "event_date")
        if event_date and (getdate(event_date) < period_from or getdate(event_date) > period_to):
            continue
        crew = frappe.get_all(
            "Crew Assignment",
            filters={"booking": booking, "status": "completed"},
            fields=["crew_member"],
        )
        names = [(c.get("crew_member") if isinstance(c, dict) else c.crew_member) for c in crew]
        if employee not in names or not names:
            continue
        total += flt(tip) / len(names)
    return flt(total)


def pay_components(employee: str, period_from, period_to) -> dict:
    period_from, period_to = getdate(period_from), getdate(period_to)
    event_fees = 0.0
    hourly_pay = 0.0
    timesheets = frappe.get_all(
        "Timesheet",
        filters={"employee": employee, "start_date": ["between", [period_from, period_to]]},
        fields=["name"],
    )
    for ts_row in timesheets:
        name = ts_row["name"] if isinstance(ts_row, dict) else ts_row.name
        ts = frappe.get_doc("Timesheet", name)
        for detail in ts.timesheets_detail:
            if not detail.get("ee_approved"):
                continue
            rate = flt(detail.get("ee_bill_rate") or 0) or flt(
                frappe.db.get_value("Employee", employee, "ee_default_pay_rate") or 0
            )
            hourly_pay += flt(detail.working_hours) * rate
    if _table("Crew Assignment"):
        for ca in frappe.get_all(
            "Crew Assignment",
            filters={"crew_member": employee, "status": "completed"},
            fields=["pay_rate", "booking"],
        ):
            booking = ca.get("booking") if isinstance(ca, dict) else ca.booking
            event_date = frappe.db.get_value("Event Booking", booking, "event_date") if booking else None
            if event_date and (getdate(event_date) < period_from or getdate(event_date) > period_to):
                continue
            if event_date is None:
                continue
            event_fees += flt(ca.get("pay_rate") if isinstance(ca, dict) else ca.pay_rate)
    tips = attributed_tips(employee, period_from, period_to)
    return {
        "event_fees": flt(event_fees),
        "hourly_pay": flt(hourly_pay),
        "tips": flt(tips),
        "gross_amount": flt(event_fees + hourly_pay + tips),
    }


@frappe.whitelist()
def create_pay_run(period_from: str, period_to: str, worker_list: list = None) -> dict:
    _check_role(["EE Tenant Admin", "EE Finance", "EE Accounting", "System Manager"])
    period_from = getdate(period_from)
    period_to = getdate(period_to)
    if not worker_list:
        worker_list = [w["name"] for w in frappe.get_all("Employee", fields=["name"], limit_page_length=999)]
    pr = frappe.get_doc(
        {
            "doctype": "Pay Run",
            "period_from": period_from,
            "period_to": period_to,
            "status": "draft",
            "payout_processor": "stripe_connect",
        }
    )
    total = 0.0
    for emp_name in worker_list:
        parts = pay_components(emp_name, period_from, period_to)
        if parts["gross_amount"] <= 0:
            continue
        payout_method = ""
        try:
            if frappe.get_meta("Employee").has_field("ee_payout_account"):
                payout_method = frappe.db.get_value("Employee", emp_name, "ee_payout_account") or ""
        except Exception:
            pass
        pr.append(
            "workers",
            {
                "worker": emp_name,
                "event_fees": parts["event_fees"],
                "hourly_pay": parts["hourly_pay"],
                "tips": parts["tips"],
                "gross_amount": parts["gross_amount"],
                "payout_method": payout_method,
                "txn_id": "",
            },
        )
        total += parts["gross_amount"]
    pr.total_amount = flt(total)
    pr.insert(ignore_permissions=True)
    frappe.db.commit()
    return {"pay_run": pr.name, "total": flt(total)}


@frappe.whitelist()
def finalize_pay_run(pay_run_name: str) -> dict:
    _check_role(["EE Tenant Admin", "EE Finance", "EE Accounting", "System Manager"])
    pr = frappe.get_doc("Pay Run", pay_run_name)
    if pr.status != "draft":
        frappe.throw(f"Cannot finalize from status '{pr.status}'.")
    pr.total_amount = flt(sum(flt(d.gross_amount) for d in pr.workers))
    pr.status = "finalized"
    pr.save(ignore_permissions=True)
    frappe.db.commit()
    return {"pay_run": pr.name, "status": "finalized", "total": flt(pr.total_amount)}


@frappe.whitelist()
def process_payout(pay_run_name: str) -> dict:
    _check_role(["EE Tenant Admin", "EE Finance", "EE Accounting", "System Manager"])
    pr = frappe.get_doc("Pay Run", pay_run_name)
    if pr.status not in ("finalized",):
        frappe.throw(f"Cannot process from status '{pr.status}'.")
    pr.status = "pending_payout"
    processor = pr.payout_processor or "manual"
    for detail in pr.workers:
        acct = (detail.payout_method or "").strip()
        if processor == "stripe_connect" and acct.startswith("acct_"):
            detail.txn_id = f"STRIPE-{frappe.utils.random_string(12)}"
        else:
            detail.txn_id = f"MANUAL-{frappe.utils.random_string(12)}"
    pr.status = "paid"
    pr.save(ignore_permissions=True)
    frappe.db.commit()
    for detail in pr.workers:
        emp = frappe.get_doc("Employee", detail.worker)
        emp_email = emp.user_id or getattr(emp, "prefered_email", "") or ""
        if emp_email:
            from entertainment_express.notifications import send

            send(
                "payout_processed",
                emp_email,
                {
                    "employee_name": emp.employee_name,
                    "amount": detail.gross_amount,
                    "txn_id": detail.txn_id,
                    "period": f"{pr.period_from} to {pr.period_to}",
                },
            )
    return {"pay_run": pr.name, "status": "paid"}


@frappe.whitelist()
def get_compliance_status(employee: str) -> dict:
    _check_role(["EE Tenant Admin", "EE HR", "EE Accounting", "System Manager"])
    emp_type = frappe.db.get_value("Employee", employee, "ee_employment_type") or "w2"
    status = {}
    for doc_type in required_docs_for(employee):
        doc = frappe.db.get_value(
            "Compliance Document",
            {"employee": employee, "doc_type": doc_type},
            ["name", "status", "expiry_date"],
            as_dict=True,
        )
        if not doc:
            status[doc_type] = {"status": "missing", "expiry": None}
            continue
        expiry = doc.get("expiry_date") if isinstance(doc, dict) else getattr(doc, "expiry_date", None)
        st = (doc.get("status") if isinstance(doc, dict) else getattr(doc, "status", None)) or ""
        if expiry and getdate(expiry) < getdate():
            status[doc_type] = {"status": "expired", "expiry": expiry}
        else:
            status[doc_type] = {"status": st, "expiry": expiry}
    return {
        "employee": employee,
        "employment_type": emp_type,
        "documents": status,
        "assignable": compliance_block_reason(employee) is None,
        "block_reason": compliance_block_reason(employee),
    }


@frappe.whitelist()
def upload_compliance_document(employee: str, doc_type: str, file_path: str = None) -> dict:
    _check_role(["EE Tenant Admin", "EE HR", "System Manager"])
    allowed = ["w9", "contract", "background_check", "driver_license", "insurance"]
    if doc_type not in allowed:
        frappe.throw(f"Invalid doc_type: {doc_type}")
    existing = frappe.db.get_value("Compliance Document", {"employee": employee, "doc_type": doc_type}, "name")
    if existing:
        cd = frappe.get_doc("Compliance Document", existing)
    else:
        cd = frappe.get_doc(
            {"doctype": "Compliance Document", "employee": employee, "doc_type": doc_type, "status": "pending"}
        )
    if file_path:
        cd.file = file_path
    cd.status = "pending"
    cd.save(ignore_permissions=True)
    frappe.db.commit()
    return {"compliance_document": cd.name, "status": cd.status}


@frappe.whitelist()
def verify_compliance_document(name: str) -> dict:
    _check_role(["EE Tenant Admin", "EE HR", "System Manager"])
    cd = frappe.get_doc("Compliance Document", name)
    cd.status = "verified"
    cd.verified_by = frappe.session.user
    cd.verified_date = frappe.utils.now_datetime() if hasattr(frappe.utils, "now_datetime") else None
    cd.save(ignore_permissions=True)
    frappe.db.commit()
    return {"compliance_document": cd.name, "status": "verified"}
