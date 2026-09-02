"""People workforce for /owner and /employee. Person/job language, never DocType names."""

from __future__ import annotations

import frappe

from entertainment_express.api import hr_workforce
from entertainment_express.api.portal_employee import EMPLOYEE_ROLES
from entertainment_express.api.portal_owner import OWNER_ROLES

PAY_ROLES = OWNER_ROLES | {"EE Accounting", "EE HR", "EE Finance", "System Manager"}
WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]


def _roles() -> set[str]:
    return set(frappe.get_roles(frappe.session.user) or [])


def _require_owner() -> None:
    if not _roles().intersection(OWNER_ROLES):
        frappe.throw("Owner portal access denied.", frappe.PermissionError)


def _require_employee() -> set[str]:
    roles = _roles()
    if not roles.intersection(EMPLOYEE_ROLES | OWNER_ROLES):
        frappe.throw("Employee portal access denied.", frappe.PermissionError)
    return roles


def _require_pay() -> None:
    if not _roles().intersection(PAY_ROLES):
        frappe.throw("Pay access denied.", frappe.PermissionError)


def _employee_for_user(user: str | None = None) -> str | None:
    user = user or frappe.session.user
    return frappe.db.get_value("Employee", {"user_id": user}, "name")


def _assert_self_or_owner(employee: str) -> None:
    roles = _roles()
    if roles.intersection(OWNER_ROLES | {"EE HR", "System Manager"}):
        return
    mine = _employee_for_user()
    if mine and mine == employee:
        return
    frappe.throw("Not allowed.", frappe.PermissionError)


@frappe.whitelist()
def list_people() -> list[dict]:
    _require_owner()
    from entertainment_express.api.portal_owner import list_staff

    rows = list_staff() or []
    out = []
    for row in rows:
        emp_name = _employee_for_user(row.get("name"))
        profile = {
            "user": row.get("name"),
            "email": row.get("email"),
            "full_name": row.get("full_name"),
            "access": row.get("access"),
            "roles": row.get("roles") or [],
            "employee": emp_name,
            "worker_type": "",
            "skills": "",
            "pay_basis": "",
            "pay_rate": 0,
            "block_reason": None,
        }
        if emp_name:
            emp = frappe.db.get_value(
                "Employee",
                emp_name,
                ["ee_employment_type", "ee_crew_roles", "ee_pay_basis", "ee_default_pay_rate"],
                as_dict=True,
            ) or {}
            profile["worker_type"] = emp.get("ee_employment_type") or ""
            profile["skills"] = emp.get("ee_crew_roles") or ""
            profile["pay_basis"] = emp.get("ee_pay_basis") or ""
            profile["pay_rate"] = emp.get("ee_default_pay_rate") or 0
            profile["block_reason"] = hr_workforce.compliance_block_reason(emp_name)
        out.append(profile)
    return out


@frappe.whitelist()
def save_profile(employee: str = None, user: str = None, values: dict | None = None) -> dict:
    _require_owner()
    values = values or frappe.form_dict.get("values") or {}
    if isinstance(values, str):
        values = frappe.parse_json(values) if hasattr(frappe, "parse_json") else {}
    emp_name = employee or (_employee_for_user(user) if user else None)
    if not emp_name:
        frappe.throw("No worker record for this person yet. Give them field access first.")
    allowed = {
        "ee_employment_type": values.get("worker_type") or values.get("ee_employment_type"),
        "ee_crew_roles": values.get("skills") or values.get("ee_crew_roles"),
        "ee_pay_basis": values.get("pay_basis") or values.get("ee_pay_basis"),
        "ee_default_pay_rate": values.get("pay_rate") or values.get("ee_default_pay_rate"),
        "ee_payout_account": values.get("payout_account") or values.get("ee_payout_account"),
        "ee_service_areas": values.get("service_areas") or values.get("ee_service_areas"),
        "ee_home_base": values.get("home_base") or values.get("ee_home_base"),
    }
    for field, value in allowed.items():
        if value is None:
            continue
        frappe.db.set_value("Employee", emp_name, field, value)
    frappe.db.commit()
    return {"employee": emp_name}


@frappe.whitelist()
def get_hours(employee: str) -> dict:
    _assert_self_or_owner(employee)
    wa_name = frappe.db.get_value("Worker Availability", {"employee": employee}, "name")
    days = {}
    if wa_name:
        wa = frappe.get_doc("Worker Availability", wa_name)
        for day in WEEKDAYS:
            days[day] = {
                "start": getattr(wa, f"{day}_start_time", None),
                "end": getattr(wa, f"{day}_end_time", None),
            }
    return {"employee": employee, "days": days}


@frappe.whitelist()
def save_hours(employee: str, days: dict | None = None) -> dict:
    _assert_self_or_owner(employee)
    days = days or {}
    if isinstance(days, str):
        days = frappe.parse_json(days) if hasattr(frappe, "parse_json") else {}
    wa_name = frappe.db.get_value("Worker Availability", {"employee": employee}, "name")
    payload = {"doctype": "Worker Availability", "employee": employee}
    for day in WEEKDAYS:
        slot = days.get(day) or {}
        payload[f"{day}_start_time"] = slot.get("start") or None
        payload[f"{day}_end_time"] = slot.get("end") or None
    if wa_name:
        wa = frappe.get_doc("Worker Availability", wa_name)
        for key, value in payload.items():
            if key == "doctype":
                continue
            setattr(wa, key, value)
        wa.save(ignore_permissions=True)
    else:
        wa = frappe.get_doc(payload)
        wa.insert(ignore_permissions=True)
    frappe.db.commit()
    return {"employee": employee}


@frappe.whitelist()
def list_time_off(employee: str) -> list[dict]:
    _assert_self_or_owner(employee)
    if not getattr(frappe.db, "table_exists", lambda *_: True)("Worker Time Off"):
        return []
    return frappe.get_all(
        "Worker Time Off",
        filters={"employee": employee},
        fields=["name", "start_date", "end_date", "reason"],
        order_by="start_date desc",
        limit_page_length=50,
    )


@frappe.whitelist()
def save_time_off(employee: str, start_date: str, end_date: str, reason: str = "") -> dict:
    _assert_self_or_owner(employee)
    doc = frappe.get_doc(
        {
            "doctype": "Worker Time Off",
            "employee": employee,
            "start_date": start_date,
            "end_date": end_date or start_date,
            "reason": reason,
        }
    )
    doc.insert(ignore_permissions=True)
    frappe.db.commit()
    return {"name": doc.name}


@frappe.whitelist()
def my_hours() -> dict:
    _require_employee()
    emp = _employee_for_user()
    if not emp:
        return {"employee": None, "days": {}}
    return get_hours(emp)


@frappe.whitelist()
def save_my_hours(days: dict | None = None) -> dict:
    _require_employee()
    emp = _employee_for_user()
    if not emp:
        frappe.throw("No worker record.")
    return save_hours(emp, days)


@frappe.whitelist()
def my_time_off() -> list[dict]:
    _require_employee()
    emp = _employee_for_user()
    if not emp:
        return []
    return list_time_off(emp)


@frappe.whitelist()
def save_my_time_off(start_date: str, end_date: str = None, reason: str = "") -> dict:
    _require_employee()
    emp = _employee_for_user()
    if not emp:
        frappe.throw("No worker record.")
    return save_time_off(emp, start_date, end_date or start_date, reason)


@frappe.whitelist()
def list_timesheets(employee: str = None) -> list[dict]:
    _require_pay()
    filters = {}
    if employee:
        filters["employee"] = employee
    if not getattr(frappe.db, "table_exists", lambda *_: True)("Timesheet"):
        return []
    rows = frappe.get_all(
        "Timesheet",
        filters=filters,
        fields=["name", "employee", "start_date", "end_date", "total_hours"],
        order_by="start_date desc",
        limit_page_length=50,
    )
    out = []
    for row in rows:
        ts = frappe.get_doc("Timesheet", row["name"])
        pending = any(not d.get("ee_approved") for d in (ts.timesheets_detail or []))
        out.append(
            {
                "name": ts.name,
                "person": ts.employee,
                "from": str(ts.start_date),
                "to": str(ts.end_date),
                "hours": sum(float(d.working_hours or 0) for d in (ts.timesheets_detail or [])),
                "pending": pending,
            }
        )
    return out


@frappe.whitelist()
def approve_hours(timesheet: str) -> dict:
    _require_pay()
    return hr_workforce.approve_timesheet(timesheet)


@frappe.whitelist()
def list_pay_runs() -> list[dict]:
    _require_pay()
    if not getattr(frappe.db, "table_exists", lambda *_: True)("Pay Run"):
        return []
    return frappe.get_all(
        "Pay Run",
        fields=["name", "period_from", "period_to", "status", "total_amount"],
        order_by="period_from desc",
        limit_page_length=30,
    )


@frappe.whitelist()
def create_pay_run(period_from: str, period_to: str) -> dict:
    _require_pay()
    return hr_workforce.create_pay_run(period_from, period_to)


@frappe.whitelist()
def finalize_pay_run(name: str) -> dict:
    _require_pay()
    return hr_workforce.finalize_pay_run(name)


@frappe.whitelist()
def process_payout(name: str) -> dict:
    _require_pay()
    return hr_workforce.process_payout(name)


@frappe.whitelist()
def upload_document(employee: str, doc_type: str, file_path: str = None) -> dict:
    _require_owner()
    return hr_workforce.upload_compliance_document(employee, doc_type, file_path)


@frappe.whitelist()
def verify_document(name: str) -> dict:
    _require_owner()
    return hr_workforce.verify_compliance_document(name)


@frappe.whitelist()
def compliance(employee: str) -> dict:
    _require_owner()
    return hr_workforce.get_compliance_status(employee)
