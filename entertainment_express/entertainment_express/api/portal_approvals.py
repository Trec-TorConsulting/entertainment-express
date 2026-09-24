"""
Unified Approvals & Checks-and-Balances API for Owner & Employee portals.
Handles Time Off requests, Entertainer Gig Offers, Client Change Requests, and Timesheets.
"""

from __future__ import annotations

import frappe
from frappe.utils import flt

from entertainment_express.api.portal_owner import OWNER_ROLES
from entertainment_express.api.portal_employee import EMPLOYEE_ROLES

APPROVAL_ROLES = OWNER_ROLES | {"EE HR", "EE Dispatcher", "System Manager"}


def _roles() -> set[str]:
    return set(frappe.get_roles(frappe.session.user) or [])


def _check_approval_access() -> None:
    if frappe.session.user == "Guest":
        frappe.throw("Authentication required.", frappe.PermissionError)
    if frappe.session.user == "Administrator":
        return
    roles = _roles()
    if not roles.intersection(APPROVAL_ROLES | EMPLOYEE_ROLES):
        frappe.throw("Approval access denied.", frappe.PermissionError)


@frappe.whitelist()
def get_approval_summary() -> dict:
    """Returns summary counts of pending items across all approval categories."""
    _check_approval_access()

    time_off_count = 0
    if frappe.db.table_exists("Worker Time Off"):
        try:
            time_off_count = frappe.db.count("Worker Time Off", {"status": ["in", ["Pending Review", "pending", "Pending"]]}) or 0
        except Exception:
            time_off_count = 0

    gig_count = 0
    if frappe.db.table_exists("Crew Assignment"):
        try:
            gig_count = frappe.db.count("Crew Assignment", {"status": "offered"}) or 0
        except Exception:
            gig_count = 0

    client_req_count = 0
    if frappe.db.table_exists("EE Booking Change"):
        try:
            client_req_count = frappe.db.count("EE Booking Change", {"status": ["in", ["pending", "Pending"]]}) or 0
        except Exception:
            client_req_count = 0

    timesheet_count = 0
    if frappe.db.table_exists("Timesheet"):
        try:
            timesheet_count = frappe.db.count("Timesheet", {"docstatus": 0}) or 0
        except Exception:
            timesheet_count = 0

    total_pending = time_off_count + gig_count + client_req_count + timesheet_count

    return {
        "total_pending": total_pending,
        "time_off": time_off_count,
        "gig_offers": gig_count,
        "client_requests": client_req_count,
        "timesheets": timesheet_count,
    }


@frappe.whitelist()
def list_pending_approvals(category: str | None = None) -> list[dict]:
    """Returns structured pending items for approval workflows."""
    _check_approval_access()
    items = []

    # 1. Time Off Requests
    if (not category or category == "time_off") and frappe.db.table_exists("Worker Time Off"):
        try:
            time_offs = frappe.get_all(
                "Worker Time Off",
                filters={"status": ["in", ["Pending Review", "pending", "Pending"]]},
                fields=["name", "employee", "start_date", "end_date", "reason", "creation"],
                order_by="creation desc",
                limit_page_length=50
            )
            for r in time_offs:
                emp_name = frappe.db.get_value("Employee", r.employee, "employee_name") or r.employee
                items.append({
                    "id": r.name,
                    "category": "time_off",
                    "category_label": "Time Off Request",
                    "title": f"Time Off: {emp_name}",
                    "subtitle": f"{r.start_date} to {r.end_date}",
                    "requester": emp_name,
                    "details": r.reason or "Scheduled leave request",
                    "date": str(r.start_date),
                    "creation": str(r.creation),
                    "status": "pending_review",
                    "raw": r
                })
        except Exception:
            pass

    # 2. Gig / Job Offers
    if (not category or category == "gig_offer") and frappe.db.table_exists("Crew Assignment"):
        try:
            assignments = frappe.get_all(
                "Crew Assignment",
                filters={"status": "offered"},
                fields=["name", "booking", "crew_member", "role", "call_time", "pay_rate", "creation"],
                order_by="creation desc",
                limit_page_length=50
            )
            for a in assignments:
                emp_name = frappe.db.get_value("Employee", a.crew_member, "employee_name") or a.crew_member
                event_name = frappe.db.get_value("Event Booking", a.booking, "event_name") or a.booking
                items.append({
                    "id": a.name,
                    "category": "gig_offer",
                    "category_label": "Gig Offer / Assignment",
                    "title": f"Gig Offer: {event_name}",
                    "subtitle": f"Role: {a.role or 'Talent/Crew'} | Call: {a.call_time or 'TBD'}",
                    "requester": emp_name,
                    "details": f"Pay Rate: ${flt(a.pay_rate):,.2f}",
                    "date": str(a.call_time or a.creation),
                    "creation": str(a.creation),
                    "status": "offered",
                    "raw": a
                })
        except Exception:
            pass

    # 3. Client Booking Change Requests
    if (not category or category == "client_request") and frappe.db.table_exists("EE Booking Change"):
        try:
            changes = frappe.get_all(
                "EE Booking Change",
                filters={"status": ["in", ["pending", "Pending"]]},
                fields=["name", "booking", "request_type", "requested_date", "item_code", "notes", "creation"],
                order_by="creation desc",
                limit_page_length=50
            )
            for c in changes:
                event_name = frappe.db.get_value("Event Booking", c.booking, "event_name") or c.booking
                customer = frappe.db.get_value("Event Booking", c.booking, "customer") or "Client"
                items.append({
                    "id": c.name,
                    "category": "client_request",
                    "category_label": "Client Change Request",
                    "title": f"{c.request_type.title()} Request: {event_name}",
                    "subtitle": f"Requested Date: {c.requested_date or 'N/A'}",
                    "requester": customer,
                    "details": c.notes or f"Client requested {c.request_type}",
                    "date": str(c.requested_date or c.creation),
                    "creation": str(c.creation),
                    "status": "pending",
                    "raw": c
                })
        except Exception:
            pass

    # 4. Timesheets
    if (not category or category == "timesheet") and frappe.db.table_exists("Timesheet"):
        try:
            sheets = frappe.get_all(
                "Timesheet",
                filters={"docstatus": 0},
                fields=["name", "employee", "start_date", "end_date", "total_hours", "creation"],
                order_by="creation desc",
                limit_page_length=50
            )
            for s in sheets:
                emp_name = frappe.db.get_value("Employee", s.employee, "employee_name") or s.employee
                items.append({
                    "id": s.name,
                    "category": "timesheet",
                    "category_label": "Timesheet Review",
                    "title": f"Timesheet: {emp_name}",
                    "subtitle": f"Total Hours: {flt(s.total_hours):.1f} hrs",
                    "requester": emp_name,
                    "details": f"Period: {s.start_date} to {s.end_date}",
                    "date": str(s.start_date),
                    "creation": str(s.creation),
                    "status": "draft",
                    "raw": s
                })
        except Exception:
            pass

    return items


@frappe.whitelist()
def approve_item(category: str, item_id: str, notes: str = "") -> dict:
    """Approve a pending item by category."""
    _check_approval_access()

    if category == "time_off":
        from entertainment_express.api.portal_hr import approve_time_off
        return approve_time_off(name=item_id, decision_notes=notes)

    elif category == "gig_offer":
        if frappe.db.exists("Crew Assignment", item_id):
            ca = frappe.get_doc("Crew Assignment", item_id)
            ca.status = "accepted"
            if notes:
                ca.notes = f"{ca.notes or ''}\nApproval note: {notes}".strip()
            ca.save(ignore_permissions=True)
            frappe.db.commit()
            return {"ok": True, "id": item_id, "status": "accepted"}
        frappe.throw("Gig assignment not found.")

    elif category == "client_request":
        if frappe.db.exists("EE Booking Change", item_id):
            bc = frappe.get_doc("EE Booking Change", item_id)
            from entertainment_express.api.booking_changes import _apply
            _apply(bc)
            bc.save(ignore_permissions=True)
            frappe.db.commit()
            return {"ok": True, "id": item_id, "status": "approved"}
        frappe.throw("Client request not found.")

    elif category == "timesheet":
        from entertainment_express.api.portal_hr import approve_hours
        return approve_hours(timesheet=item_id)

    else:
        frappe.throw("Invalid approval category.")


@frappe.whitelist()
def decline_item(category: str, item_id: str, notes: str = "") -> dict:
    """Decline / reject a pending item by category."""
    _check_approval_access()

    if category == "time_off":
        from entertainment_express.api.portal_hr import reject_time_off
        return reject_time_off(name=item_id, decision_notes=notes)

    elif category == "gig_offer":
        if frappe.db.exists("Crew Assignment", item_id):
            ca = frappe.get_doc("Crew Assignment", item_id)
            ca.status = "declined"
            if notes:
                ca.notes = f"{ca.notes or ''}\nDecline reason: {notes}".strip()
            ca.save(ignore_permissions=True)
            frappe.db.commit()
            return {"ok": True, "id": item_id, "status": "declined"}
        frappe.throw("Gig assignment not found.")

    elif category == "client_request":
        if frappe.db.exists("EE Booking Change", item_id):
            bc = frappe.get_doc("EE Booking Change", item_id)
            bc.status = "declined"
            bc.save(ignore_permissions=True)
            frappe.db.commit()
            return {"ok": True, "id": item_id, "status": "declined"}
        frappe.throw("Client request not found.")

    elif category == "timesheet":
        if frappe.db.exists("Timesheet", item_id):
            ts = frappe.get_doc("Timesheet", item_id)
            ts.db_set("docstatus", 2) # Cancelled
            frappe.db.commit()
            return {"ok": True, "id": item_id, "status": "declined"}
        frappe.throw("Timesheet not found.")

    else:
        frappe.throw("Invalid approval category.")
