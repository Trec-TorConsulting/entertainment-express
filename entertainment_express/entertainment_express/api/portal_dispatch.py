"""White-label dispatch for owner and employee portals.

Wraps entertainment_express.api.dispatch. Payloads use person/job language,
never DocType names. Guests are denied.
"""

from __future__ import annotations

import frappe

from entertainment_express.api import dispatch as _dispatch

STATUS_LABELS = {
    "offered": "Waiting on them",
    "accepted": "Confirmed",
    "declined": "Declined",
    "checked_in": "On site",
    "completed": "Done",
    "no_show": "No-show",
}

DISPATCH_ROLES = {"EE Tenant Admin", "EE Dispatcher", "System Manager"}
FIELD_ROLES = {"EE Crew", "EE Entertainer", "EE Dispatcher", "EE Tenant Admin", "System Manager"}


def _require_dispatch() -> None:
    roles = set(frappe.get_roles() or [])
    if not roles.intersection(DISPATCH_ROLES):
        frappe.throw("Dispatch access denied.", frappe.PermissionError)


def _require_field() -> None:
    roles = set(frappe.get_roles() or [])
    if not roles.intersection(FIELD_ROLES):
        frappe.throw("Field access denied.", frappe.PermissionError)


def _is_dispatcher() -> bool:
    return bool(set(frappe.get_roles() or []).intersection(DISPATCH_ROLES))


def _label_status(status: str | None) -> str:
    key = status or ""
    return STATUS_LABELS.get(key, key)


def _my_employee() -> str | None:
    return frappe.db.get_value("Employee", {"user_id": frappe.session.user}, "name")


def _assert_own_or_dispatch(assignment: str) -> None:
    ca = frappe.get_doc("Crew Assignment", assignment)
    emp = _my_employee()
    if emp and ca.crew_member == emp:
        return
    if _is_dispatcher():
        return
    frappe.throw("That shift is not yours.", frappe.PermissionError)


def _default_role() -> str:
    name = frappe.db.get_value("EE Crew Role", {"active": 1}, "name")
    if name:
        return name
    if frappe.db.exists("EE Crew Role", "Field"):
        return "Field"
    doc = frappe.get_doc({"doctype": "EE Crew Role", "role_name": "Field", "active": 1})
    doc.insert(ignore_permissions=True)
    return doc.name


def _job_title(booking: str, fallback: str = "") -> str:
    return frappe.db.get_value("Event Booking", booking, "event_name") or fallback or booking


@frappe.whitelist()
def board(day: str | None = None) -> dict:
    _require_dispatch()
    day = day or str(frappe.utils.today() if hasattr(frappe.utils, "today") else frappe.utils.nowdate())
    rows = []
    for job in _dispatch.get_dispatch_board(day):
        crew = []
        for ca in job.get("crew_assignments") or []:
            person = frappe.db.get_value("Employee", ca.get("crew_member"), "employee_name") or ca.get("crew_member")
            crew.append(
                {
                    "id": ca.get("name"),
                    "person": person,
                    "role": ca.get("role") or "",
                    "status": _label_status(ca.get("status")),
                    "status_key": ca.get("status"),
                }
            )
        rows.append(
            {
                "id": job["name"],
                "title": job.get("event_name") or _job_title(job["name"], job.get("customer") or ""),
                "when": str(job.get("start_time") or job.get("event_date") or ""),
                "place": job.get("venue_address") or "",
                "at_risk": bool(job.get("at_risk")),
                "crew": crew,
            }
        )
    return {"day": day, "jobs": rows}


@frappe.whitelist()
def people(job: str | None = None, day: str | None = None, role: str | None = None) -> list[dict]:
    _require_dispatch()
    from entertainment_express.api.portal_owner import backfill_field_employees

    backfill_field_employees()
    event_date = day
    if job and not event_date:
        event_date = str(frappe.db.get_value("Event Booking", job, "event_date") or "")
    out = []
    for row in _dispatch.list_available_crew(event_date=event_date or None, role_name=role or None):
        out.append(
            {
                "id": row["employee"],
                "name": row["employee_name"],
                "roles": row.get("roles") or [],
            }
        )
    return out


@frappe.whitelist()
def roles() -> list[dict]:
    _require_dispatch()
    rows = frappe.get_all(
        "EE Crew Role",
        filters={"active": 1},
        fields=["name", "role_name"],
        order_by="role_name asc",
        limit_page_length=50,
    )
    if not rows:
        return [{"id": _default_role(), "name": "Field"}]
    return [{"id": row["name"], "name": row.get("role_name") or row["name"]} for row in rows]


@frappe.whitelist()
def offer(job: str, person: str, role: str | None = None) -> dict:
    _require_dispatch()
    role_name = role or _default_role()
    result = _dispatch.assign_crew(job, person, role_name)
    return {"id": result.get("assignment"), "status": _label_status(result.get("status"))}


@frappe.whitelist()
def job_crew(job: str) -> list[dict]:
    _require_dispatch()
    rows = frappe.get_all(
        "Crew Assignment",
        filters={"booking": job},
        fields=["name", "crew_member", "role", "status"],
        order_by="creation asc",
        limit_page_length=50,
    )
    out = []
    for row in rows:
        out.append(
            {
                "id": row["name"],
                "person": frappe.db.get_value("Employee", row["crew_member"], "employee_name") or row["crew_member"],
                "role": row.get("role") or "",
                "status": _label_status(row.get("status")),
                "status_key": row.get("status"),
            }
        )
    return out


@frappe.whitelist()
def my_shifts() -> list[dict]:
    _require_field()
    emp = _my_employee()
    if not emp:
        return []
    rows = frappe.get_all(
        "Crew Assignment",
        filters={"crew_member": emp},
        fields=["name", "booking", "status", "role", "call_time"],
        order_by="modified desc",
        limit_page_length=50,
    )
    out = []
    for row in rows:
        when = frappe.db.get_value("Event Booking", row["booking"], "event_date")
        place = frappe.db.get_value("Event Booking", row["booking"], "venue_address") or ""
        out.append(
            {
                "id": row["name"],
                "job": _job_title(row["booking"]),
                "place": place,
                "when": str(when or row.get("call_time") or ""),
                "role": row.get("role") or "",
                "status": _label_status(row.get("status")),
                "status_key": row.get("status"),
                "can_accept": row.get("status") == "offered",
                "can_check_in": row.get("status") == "accepted",
                "can_check_out": row.get("status") == "checked_in",
            }
        )
    return out


@frappe.whitelist()
def respond(assignment: str, decision: str) -> dict:
    _require_field()
    ca = frappe.get_doc("Crew Assignment", assignment)
    emp = _my_employee()
    if ca.crew_member != emp and not _is_dispatcher():
        frappe.throw("That shift is not yours.", frappe.PermissionError)
    choice = (decision or "").strip().lower()
    if choice == "accept":
        _dispatch.accept_shift(assignment, ca.shift_token)
        return {"status": STATUS_LABELS["accepted"]}
    if choice == "decline":
        _dispatch.decline_shift(assignment, ca.shift_token)
        return {"status": STATUS_LABELS["declined"]}
    frappe.throw("Choose accept or decline.")


@frappe.whitelist()
def check_in(assignment: str) -> dict:
    _require_field()
    _assert_own_or_dispatch(assignment)
    _dispatch.crew_check_in(assignment)
    return {"status": STATUS_LABELS["checked_in"]}


@frappe.whitelist()
def check_out(assignment: str) -> dict:
    _require_field()
    _assert_own_or_dispatch(assignment)
    _dispatch.crew_check_out(assignment)
    return {"status": STATUS_LABELS["completed"]}
