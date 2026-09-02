"""Event timeline APIs."""

from __future__ import annotations

import json
from datetime import datetime, timedelta

import frappe
from frappe.utils import get_time

from entertainment_express.notifications import send
from entertainment_express.security.access import assert_booking_access, is_staff, require_roles


STAFF = ["EE Tenant Admin", "EE Sales", "EE Dispatcher", "System Manager"]


@frappe.whitelist()
def list_timeline_templates() -> list:
    require_roles(*STAFF)
    rows = frappe.get_all(
        "Timeline Template",
        fields=["name", "template_name", "event_type", "active"],
        order_by="template_name",
    )
    for row in rows:
        row["items"] = frappe.get_all(
            "Timeline Template Item",
            filters={"parent": row.name},
            fields=["offset_minutes", "duration_minutes", "title", "description", "moment_key"],
            order_by="idx",
        )
    return rows


@frappe.whitelist()
def save_timeline_template(template: dict) -> dict:
    require_roles(*STAFF)
    name = template.get("name")
    if name and frappe.db.exists("Timeline Template", name):
        doc = frappe.get_doc("Timeline Template", name)
        doc.update({k: v for k, v in template.items() if k != "items"})
        doc.set("items", [])
        for item in template.get("items") or []:
            doc.append("items", item)
        doc.save()
    else:
        doc = frappe.get_doc({"doctype": "Timeline Template", **template})
        doc.insert()
    return {"name": doc.name}


@frappe.whitelist()
def get_timeline(booking_name: str) -> dict:
    assert_booking_access(booking_name)
    name = frappe.db.get_value("Event Timeline", {"booking": booking_name}, "name")
    if not name:
        return {"booking": booking_name, "status": "missing", "items": []}
    doc = frappe.get_doc("Event Timeline", name)
    items = doc.as_dict()["items"]
    if not is_staff():
        items = [i for i in items if i.get("visible_to_client")]
        if not doc.share_with_client and doc.status != "finalized":
            frappe.throw("This timeline has not been shared yet.", frappe.PermissionError)
    pending = frappe.get_all(
        "Timeline Change Request",
        filters={"timeline": doc.name, "status": "pending"},
        fields=["name", "item_idx", "requested_by", "payload_json", "status"],
    )
    return {
        "name": doc.name,
        "booking": doc.booking,
        "status": doc.status,
        "timezone": doc.timezone,
        "share_with_client": doc.share_with_client,
        "items": items,
        "pending_requests": pending if is_staff() else [],
    }


@frappe.whitelist()
def save_timeline(booking_name: str, items: list, timezone: str | None = None) -> dict:
    require_roles(*STAFF)
    name = frappe.db.get_value("Event Timeline", {"booking": booking_name}, "name")
    if name:
        doc = frappe.get_doc("Event Timeline", name)
        if doc.status == "finalized":
            frappe.throw("This timeline is finalized. Re-open it before editing.")
    else:
        booking = frappe.get_doc("Event Booking", booking_name)
        doc = frappe.get_doc(
            {
                "doctype": "Event Timeline",
                "booking": booking_name,
                "timezone": timezone or booking.timezone or "America/New_York",
            }
        )
        doc.insert()
    if timezone:
        doc.timezone = timezone
    doc.set("items", [])
    for item in items or []:
        doc.append("items", item)
    doc.save()
    return get_timeline(booking_name)


@frappe.whitelist()
def apply_template(booking_name: str, template_name: str) -> dict:
    require_roles(*STAFF)
    template = frappe.get_doc("Timeline Template", template_name)
    booking = frappe.get_doc("Event Booking", booking_name)
    start = get_time(booking.start_time) if booking.start_time else datetime.strptime("18:00:00", "%H:%M:%S").time()
    base = datetime.combine(datetime.today().date(), start)
    items = []
    for row in template.items:
        s = base + timedelta(minutes=int(row.offset_minutes or 0))
        e = s + timedelta(minutes=int(row.duration_minutes or 15))
        items.append(
            {
                "start_time": s.time().strftime("%H:%M:%S"),
                "end_time": e.time().strftime("%H:%M:%S"),
                "title": row.title,
                "description": row.description,
                "visible_to_client": 1,
            }
        )
    return save_timeline(booking_name, items, booking.timezone)


@frappe.whitelist()
def suggest_change(booking_name: str, item_idx: int, payload: dict) -> dict:
    assert_booking_access(booking_name)
    timeline_name = frappe.db.get_value("Event Timeline", {"booking": booking_name}, "name")
    if not timeline_name:
        frappe.throw("No timeline to edit yet.")
    doc = frappe.get_doc("Event Timeline", timeline_name)
    if doc.status == "finalized":
        frappe.throw("This timeline is locked. Ask your coordinator if you need a change.")
    req = frappe.get_doc(
        {
            "doctype": "Timeline Change Request",
            "timeline": timeline_name,
            "item_idx": item_idx,
            "requested_by": frappe.session.user,
            "payload_json": json.dumps(payload or {}),
            "status": "pending",
        }
    )
    req.insert(ignore_permissions=True)
    frappe.db.commit()
    return {"request": req.name, "status": "pending"}


@frappe.whitelist()
def review_change(request_name: str, approve: int = 1, staff_note: str = "") -> dict:
    require_roles(*STAFF)
    req = frappe.get_doc("Timeline Change Request", request_name)
    timeline = frappe.get_doc("Event Timeline", req.timeline)
    req.status = "approved" if int(approve) else "rejected"
    req.staff_note = staff_note
    req.save()
    if req.status == "approved":
        payload = json.loads(req.payload_json or "{}")
        idx = int(req.item_idx or 0)
        if 0 <= idx < len(timeline.items):
            for key, val in payload.items():
                if key in timeline.items[idx].as_dict():
                    timeline.items[idx].set(key, val)
            timeline.save()
    email = req.requested_by
    if email and "@" in email:
        send(
            "timeline_change_reviewed",
            email,
            {
                "status": req.status,
                "staff_note": staff_note,
                "booking_name": timeline.booking,
            },
        )
    return {"status": req.status}


@frappe.whitelist()
def finalize(booking_name: str, share_with_client: int = 1) -> dict:
    require_roles(*STAFF)
    name = frappe.db.get_value("Event Timeline", {"booking": booking_name}, "name")
    if not name:
        frappe.throw("Create a timeline before finalizing.")
    frappe.db.set_value(
        "Event Timeline",
        name,
        {"status": "finalized", "share_with_client": 1 if int(share_with_client) else 0},
    )
    frappe.db.commit()
    return get_timeline(booking_name)
