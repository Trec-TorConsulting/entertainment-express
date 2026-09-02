"""Owner/staff portal CRUD. Allowlisted resources; no DocType names in the UI payload."""

from __future__ import annotations

import re
import secrets

import frappe
from frappe.utils import cint, flt, fmt_money, nowdate

from entertainment_express.api.portal_owner import _require_owner

INQUIRY_IN = {
    "New": "Open",
    "Contacted": "Replied",
    "Quote": "Opportunity",
    "Booked": "Converted",
    "Closed": "Do Not Contact",
}
INQUIRY_OUT = {v: k for k, v in INQUIRY_IN.items()}

JOB_STATUSES = [
    ("inquiry", "Inquiry"),
    ("quoted", "Quoted"),
    ("tentative", "Hold"),
    ("confirmed", "Confirmed"),
    ("in_progress", "On site"),
    ("completed", "Done"),
    ("canceled", "Canceled"),
]
GEAR_TYPES = [
    ("inflatable", "Inflatable"),
    ("booth", "Booth"),
    ("truck", "Truck"),
    ("dj_rig", "DJ rig"),
    ("casino_table", "Casino table"),
    ("karaoke_rig", "Karaoke"),
    ("prop", "Prop"),
    ("other", "Other"),
]


def _schema(kind: str) -> dict:
    catalogs = {
        "inquiry": {
            "kind": "inquiry",
            "title": "Pipeline",
            "singular": "Inquiry",
            "can_create": True,
            "can_delete": True,
            "empty": "No inquiries yet. Add one to start a conversation.",
            "columns": [
                {"key": "contact_name", "label": "Name"},
                {"key": "email", "label": "Email"},
                {"key": "status", "label": "Status"},
                {"key": "score", "label": "Follow-up"},
                {"key": "updated", "label": "Updated"},
            ],
            "fields": [
                {"key": "contact_name", "label": "Name", "type": "text", "required": True},
                {"key": "email", "label": "Email", "type": "email"},
                {"key": "phone", "label": "Phone", "type": "text"},
                {
                    "key": "status",
                    "label": "Status",
                    "type": "select",
                    "options": ["New", "Contacted", "Quote", "Booked", "Closed"],
                    "required": True,
                },
                {"key": "notes", "label": "Notes", "type": "textarea"},
            ],
        },
        "job": {
            "kind": "job",
            "title": "Calendar",
            "singular": "Job",
            "can_create": True,
            "can_delete": True,
            "empty": "No jobs on the books. Add a date to get started.",
            "columns": [
                {"key": "event_name", "label": "Event"},
                {"key": "event_date", "label": "Date"},
                {"key": "customer_name", "label": "Client"},
                {"key": "status", "label": "Status"},
            ],
            "fields": [
                {"key": "event_name", "label": "Event name", "type": "text", "required": True},
                {"key": "customer_name", "label": "Client name", "type": "text", "required": True},
                {"key": "event_date", "label": "Date", "type": "date", "required": True},
                {"key": "start_time", "label": "Start", "type": "time", "required": True},
                {"key": "end_time", "label": "End", "type": "time", "required": True},
                {"key": "venue_address", "label": "Venue", "type": "textarea"},
                {
                    "key": "status",
                    "label": "Status",
                    "type": "select",
                    "options": [label for _value, label in JOB_STATUSES],
                    "required": True,
                },
                {"key": "notes", "label": "Notes", "type": "textarea"},
            ],
        },
        "package": {
            "kind": "package",
            "title": "Packages",
            "singular": "Package",
            "can_create": True,
            "can_delete": True,
            "empty": "Add what you sell so quotes pick it up automatically.",
            "columns": [
                {"key": "item_name", "label": "Name"},
                {"key": "rate_display", "label": "Rate"},
                {"key": "unit", "label": "Unit"},
            ],
            "fields": [
                {"key": "item_name", "label": "Name", "type": "text", "required": True},
                {"key": "rate", "label": "Rate", "type": "number", "required": True},
                {"key": "unit", "label": "Unit", "type": "text"},
                {"key": "description", "label": "Description", "type": "textarea"},
            ],
        },
        "gear": {
            "kind": "gear",
            "title": "Gear",
            "singular": "Gear",
            "can_create": True,
            "can_delete": True,
            "empty": "Add trucks, booths, and bounce units you take to jobs.",
            "columns": [
                {"key": "asset_name", "label": "Name"},
                {"key": "asset_type_label", "label": "Type"},
                {"key": "status", "label": "Status"},
            ],
            "fields": [
                {"key": "asset_name", "label": "Name", "type": "text", "required": True},
                {
                    "key": "asset_type",
                    "label": "Type",
                    "type": "select",
                    "options": [label for _value, label in GEAR_TYPES],
                    "required": True,
                },
                {
                    "key": "status",
                    "label": "Status",
                    "type": "select",
                    "options": ["available", "maintenance", "out_of_service", "retired"],
                    "required": True,
                },
                {
                    "key": "condition",
                    "label": "Condition",
                    "type": "select",
                    "options": ["excellent", "good", "fair", "poor", "damaged"],
                },
                {"key": "notes", "label": "Notes", "type": "textarea"},
            ],
        },
        "invoice": {
            "kind": "invoice",
            "title": "Money",
            "singular": "Invoice",
            "can_create": False,
            "can_delete": False,
            "empty": "Invoices appear here after a job is billed.",
            "columns": [
                {"key": "title", "label": "Invoice"},
                {"key": "customer_name", "label": "Client"},
                {"key": "outstanding_display", "label": "Still owed"},
                {"key": "status", "label": "Status"},
            ],
            "fields": [
                {"key": "title", "label": "Invoice", "type": "text", "readonly": True},
                {"key": "customer_name", "label": "Client", "type": "text", "readonly": True},
                {"key": "outstanding", "label": "Still owed", "type": "text", "readonly": True},
                {"key": "status", "label": "Status", "type": "text", "readonly": True},
                {"key": "remarks", "label": "Notes", "type": "textarea"},
            ],
        },
    }
    if kind not in catalogs:
        frappe.throw("Unknown workspace.")
    return catalogs[kind]


def _currency() -> str:
    return frappe.db.get_default("currency") or "USD"


def _money(amount) -> str:
    return fmt_money(flt(amount), currency=_currency())


def _job_status_value(label: str) -> str:
    for value, pretty in JOB_STATUSES:
        if label == pretty or label == value:
            return value
    return "inquiry"


def _job_status_label(value: str) -> str:
    for raw, pretty in JOB_STATUSES:
        if raw == value:
            return pretty
    return value or "Inquiry"


@frappe.whitelist()
def describe(kind: str) -> dict:
    _require_owner()
    return _schema(kind)


@frappe.whitelist()
def list_records(kind: str) -> dict:
    _require_owner()
    schema = _schema(kind)
    rows = _LISTERS[kind]()
    return {"schema": schema, "rows": rows}


@frappe.whitelist()
def get_record(kind: str, name: str) -> dict:
    _require_owner()
    schema = _schema(kind)
    row = _GETTERS[kind](name)
    return {"schema": schema, "row": row}


@frappe.whitelist()
def save_record(kind: str, values: dict | str | None = None, name: str | None = None) -> dict:
    _require_owner()
    if isinstance(values, str):
        values = frappe.parse_json(values) or {}
    values = values or {}
    saved = _SAVERS[kind](name, values)
    return {"ok": True, "name": saved}


@frappe.whitelist()
def delete_record(kind: str, name: str) -> dict:
    _require_owner()
    schema = _schema(kind)
    if not schema.get("can_delete"):
        frappe.throw("This record cannot be removed here.", frappe.PermissionError)
    _DELETERS[kind](name)
    return {"ok": True}


def _list_inquiries() -> list[dict]:
    rows = []
    fields = ["name", "lead_name", "email_id", "mobile_no", "status", "modified"]
    try:
        if frappe.get_meta("Lead").has_field("ee_lead_score"):
            fields.append("ee_lead_score")
    except Exception:
        pass
    for row in frappe.get_all(
        "Lead",
        fields=fields,
        order_by="modified desc",
        limit_page_length=200,
    ):
        score = row.get("ee_lead_score")
        rows.append(
            {
                "id": row.name,
                "contact_name": row.lead_name or row.name,
                "email": row.email_id or "",
                "phone": row.mobile_no or "",
                "status": INQUIRY_OUT.get(row.status, row.status or "New"),
                "score": "" if score in (None, "") else str(score),
                "updated": str(row.modified or "")[:16],
            }
        )
    return rows


def _get_inquiry(name: str) -> dict:
    doc = frappe.get_doc("Lead", name)
    notes = ""
    if getattr(doc.meta, "has_field", None) and doc.meta.has_field("notes") and isinstance(getattr(doc, "notes", None), str):
        notes = doc.notes or ""
    return {
        "id": doc.name,
        "contact_name": doc.lead_name or getattr(doc, "first_name", None) or doc.name,
        "email": doc.email_id or "",
        "phone": doc.mobile_no or "",
        "status": INQUIRY_OUT.get(doc.status, doc.status or "New"),
        "notes": notes,
    }


def _save_inquiry(name: str | None, values: dict) -> str:
    contact = (values.get("contact_name") or "").strip()
    if not contact:
        frappe.throw("Name is required.")
    status = INQUIRY_IN.get(values.get("status") or "New", values.get("status") or "Open")
    payload = {
        "lead_name": contact,
        "first_name": contact.split()[0],
        "email_id": (values.get("email") or "").strip(),
        "mobile_no": (values.get("phone") or "").strip(),
        "status": status,
    }
    if name:
        doc = frappe.get_doc("Lead", name)
        doc.update(payload)
        _maybe_notes(doc, values.get("notes"))
        doc.save(ignore_permissions=True)
        return doc.name
    doc = frappe.get_doc({"doctype": "Lead", **payload})
    if doc.meta.has_field("naming_series") and not getattr(doc, "naming_series", None):
        options = [o for o in (doc.meta.get_field("naming_series").options or "").split("\n") if o.strip()]
        if options:
            doc.naming_series = options[0]
    _maybe_notes(doc, values.get("notes"))
    doc.insert(ignore_permissions=True)
    return doc.name


def _delete_inquiry(name: str) -> None:
    frappe.delete_doc("Lead", name, ignore_permissions=True, force=True)


def _maybe_notes(doc, notes) -> None:
    if notes is None:
        return
    if doc.meta.has_field("notes") and doc.meta.get_field("notes").fieldtype in {
        "Small Text",
        "Text",
        "Text Editor",
        "Long Text",
    }:
        doc.notes = notes


def _ensure_customer(customer_name: str) -> str:
    name = (customer_name or "").strip()
    if not name:
        frappe.throw("Client name is required.")
    existing = frappe.db.get_value("Customer", {"customer_name": name})
    if existing:
        return existing
    group = frappe.db.get_single_value("Selling Settings", "customer_group") or "All Customer Groups"
    territory = frappe.db.get_single_value("Selling Settings", "territory") or "All Territories"
    doc = frappe.get_doc(
        {
            "doctype": "Customer",
            "customer_name": name,
            "customer_type": "Individual",
            "customer_group": group,
            "territory": territory,
        }
    )
    doc.insert(ignore_permissions=True)
    return doc.name


def _not_template_filters(extra: dict | None = None) -> dict:
    filters = dict(extra or {})
    try:
        if frappe.get_meta("Event Booking").has_field("is_template"):
            filters["is_template"] = 0
    except Exception:
        pass
    return filters


def _list_jobs() -> list[dict]:
    rows = []
    for row in frappe.get_all(
        "Event Booking",
        filters=_not_template_filters(),
        fields=["name", "event_name", "event_date", "status", "customer"],
        order_by="event_date desc",
        limit_page_length=200,
    ):
        rows.append(
            {
                "id": row.name,
                "event_name": row.event_name or row.name,
                "event_date": str(row.event_date or ""),
                "status": _job_status_label(row.status or ""),
                "customer_name": frappe.db.get_value("Customer", row.customer, "customer_name") or row.customer or "",
            }
        )
    return rows


def _get_job(name: str) -> dict:
    doc = frappe.get_doc("Event Booking", name)
    return {
        "id": doc.name,
        "event_name": doc.event_name,
        "customer_name": frappe.db.get_value("Customer", doc.customer, "customer_name") or doc.customer,
        "event_date": str(doc.event_date or ""),
        "start_time": str(doc.start_time or "")[:8],
        "end_time": str(doc.end_time or "")[:8],
        "venue_address": doc.venue_address or "",
        "status": _job_status_label(doc.status or "inquiry"),
        "notes": (doc.notes or "") if isinstance(doc.notes, str) else "",
    }


def _save_job(name: str | None, values: dict) -> str:
    customer = _ensure_customer(values.get("customer_name") or "")
    payload = {
        "event_name": (values.get("event_name") or "").strip(),
        "customer": customer,
        "event_date": values.get("event_date") or nowdate(),
        "start_time": values.get("start_time") or "18:00:00",
        "end_time": values.get("end_time") or "22:00:00",
        "venue_address": values.get("venue_address") or "",
        "status": _job_status_value(values.get("status") or "inquiry"),
        "source": "staff",
        "timezone": "America/New_York",
    }
    if not payload["event_name"]:
        frappe.throw("Event name is required.")
    if name:
        doc = frappe.get_doc("Event Booking", name)
        doc.update(payload)
        _maybe_notes(doc, values.get("notes"))
        if values.get("venue"):
            from entertainment_express.api.venues import apply_venue_to_booking

            apply_venue_to_booking(doc, values.get("venue"))
        doc.save(ignore_permissions=True)
        return doc.name
    doc = frappe.get_doc({"doctype": "Event Booking", **payload})
    _maybe_notes(doc, values.get("notes"))
    if values.get("venue"):
        from entertainment_express.api.venues import apply_venue_to_booking

        apply_venue_to_booking(doc, values.get("venue"))
    doc.insert(ignore_permissions=True)
    return doc.name


def _delete_job(name: str) -> None:
    frappe.delete_doc("Event Booking", name, ignore_permissions=True, force=True)


def _list_packages() -> list[dict]:
    filters: dict = {"disabled": 0}
    if frappe.get_meta("Item").has_field("ee_item_type"):
        filters["ee_item_type"] = ["in", ["service", "package", "addon", "rental"]]
    rows = []
    for row in frappe.get_all(
        "Item",
        filters=filters,
        fields=["name", "item_name", "standard_rate", "ee_unit", "description"],
        order_by="item_name asc",
        limit_page_length=200,
    ):
        rows.append(
            {
                "id": row.name,
                "item_name": row.item_name or row.name,
                "rate": row.standard_rate,
                "rate_display": _money(row.standard_rate),
                "unit": row.ee_unit or "",
                "description": row.description or "",
            }
        )
    return rows


def _get_package(name: str) -> dict:
    doc = frappe.get_doc("Item", name)
    return {
        "id": doc.name,
        "item_name": doc.item_name,
        "rate": doc.standard_rate,
        "unit": getattr(doc, "ee_unit", None) or "",
        "description": doc.description or "",
    }


def _item_code(item_name: str) -> str:
    slug = re.sub(r"[^A-Z0-9]+", "-", (item_name or "PKG").upper()).strip("-")[:14]
    return f"EE-{slug}-{secrets.token_hex(2).upper()}"


def _save_package(name: str | None, values: dict) -> str:
    item_name = (values.get("item_name") or "").strip()
    if not item_name:
        frappe.throw("Name is required.")
    payload = {
        "item_name": item_name,
        "standard_rate": flt(values.get("rate") or 0),
        "description": values.get("description") or "",
        "ee_unit": (values.get("unit") or "event").strip() or "event",
        "ee_item_type": "service",
        "is_sales_item": 1,
        "is_stock_item": 0,
        "disabled": 0,
    }
    if name:
        doc = frappe.get_doc("Item", name)
        doc.update(payload)
        doc.save(ignore_permissions=True)
        return doc.name
    payload.update(
        {
            "item_code": _item_code(item_name),
            "item_group": "Services",
            "stock_uom": "Nos",
            "is_service_item": 1,
        }
    )
    doc = frappe.get_doc({"doctype": "Item", **payload})
    doc.insert(ignore_permissions=True)
    return doc.name


def _delete_package(name: str) -> None:
    frappe.delete_doc("Item", name, ignore_permissions=True, force=True)


def _gear_type_value(label: str) -> str:
    for value, pretty in GEAR_TYPES:
        if label == pretty or label == value:
            return value
    return "other"


def _gear_type_label(value: str) -> str:
    for raw, pretty in GEAR_TYPES:
        if raw == value:
            return pretty
    return value or "Other"


def _list_gear() -> list[dict]:
    rows = []
    for row in frappe.get_all(
        "Service Asset",
        fields=["name", "asset_name", "asset_type", "status"],
        order_by="asset_name asc",
        limit_page_length=200,
    ):
        rows.append(
            {
                "id": row.name,
                "asset_name": row.asset_name or row.name,
                "asset_type": row.asset_type,
                "asset_type_label": _gear_type_label(row.asset_type),
                "status": row.status or "available",
            }
        )
    return rows


def _get_gear(name: str) -> dict:
    doc = frappe.get_doc("Service Asset", name)
    return {
        "id": doc.name,
        "asset_name": doc.asset_name,
        "asset_type": _gear_type_label(doc.asset_type),
        "status": doc.status or "available",
        "condition": doc.condition or "good",
        "notes": doc.notes or "",
    }


def _save_gear(name: str | None, values: dict) -> str:
    asset_name = (values.get("asset_name") or "").strip()
    if not asset_name:
        frappe.throw("Name is required.")
    payload = {
        "asset_name": asset_name,
        "asset_type": _gear_type_value(values.get("asset_type") or "other"),
        "status": values.get("status") or "available",
        "condition": values.get("condition") or "good",
        "notes": values.get("notes") or "",
        "quantity": 1,
    }
    if name:
        doc = frappe.get_doc("Service Asset", name)
        doc.update(payload)
        doc.save(ignore_permissions=True)
        return doc.name
    doc = frappe.get_doc({"doctype": "Service Asset", **payload})
    doc.insert(ignore_permissions=True)
    return doc.name


def _delete_gear(name: str) -> None:
    frappe.delete_doc("Service Asset", name, ignore_permissions=True, force=True)


def _list_invoices() -> list[dict]:
    rows = []
    for row in frappe.get_all(
        "Sales Invoice",
        filters={"docstatus": ["<", 2]},
        fields=["name", "customer_name", "outstanding_amount", "status", "grand_total", "currency"],
        order_by="modified desc",
        limit_page_length=200,
    ):
        rows.append(
            {
                "id": row.name,
                "title": row.name,
                "customer_name": row.customer_name or "",
                "outstanding": row.outstanding_amount,
                "outstanding_display": _money(row.outstanding_amount),
                "status": row.status or "",
            }
        )
    return rows


def _get_invoice(name: str) -> dict:
    doc = frappe.get_doc("Sales Invoice", name)
    return {
        "id": doc.name,
        "title": doc.name,
        "customer_name": doc.customer_name or doc.customer,
        "outstanding": _money(doc.outstanding_amount),
        "status": doc.status,
        "remarks": doc.remarks or "",
        "readonly": int(doc.docstatus or 0) > 0,
    }


def _save_invoice(name: str | None, values: dict) -> str:
    if not name:
        frappe.throw("Invoices are created from a job, not from a blank form.")
    doc = frappe.get_doc("Sales Invoice", name)
    if int(doc.docstatus or 0) == 0:
        doc.remarks = values.get("remarks") or ""
        doc.save(ignore_permissions=True)
    elif values.get("remarks"):
        frappe.get_doc(
            {
                "doctype": "Comment",
                "comment_type": "Comment",
                "reference_doctype": "Sales Invoice",
                "reference_name": name,
                "content": values.get("remarks"),
            }
        ).insert(ignore_permissions=True)
    return doc.name


def _delete_invoice(_name: str) -> None:
    frappe.throw("Invoices cannot be deleted here.", frappe.PermissionError)


_LISTERS = {
    "inquiry": _list_inquiries,
    "job": _list_jobs,
    "package": _list_packages,
    "gear": _list_gear,
    "invoice": _list_invoices,
}
_GETTERS = {
    "inquiry": _get_inquiry,
    "job": _get_job,
    "package": _get_package,
    "gear": _get_gear,
    "invoice": _get_invoice,
}
_SAVERS = {
    "inquiry": _save_inquiry,
    "job": _save_job,
    "package": _save_package,
    "gear": _save_gear,
    "invoice": _save_invoice,
}
_DELETERS = {
    "inquiry": _delete_inquiry,
    "job": _delete_job,
    "package": _delete_package,
    "gear": _delete_gear,
    "invoice": _delete_invoice,
}


def _as_time(val, default: str = "18:00:00"):
    from datetime import time as dtime

    raw = str(val or default)
    parts = raw.replace(".", ":").split(":")
    hour = int(parts[0] or 0)
    minute = int(parts[1] or 0) if len(parts) > 1 else 0
    second = int(float(parts[2] or 0)) if len(parts) > 2 else 0
    return dtime(hour, minute, second)


@frappe.whitelist()
def clone_job(
    name: str,
    event_date: str,
    start_time: str | None = None,
    end_time: str | None = None,
    as_template: int = 0,
) -> dict:
    _require_owner()
    src = frappe.get_doc("Event Booking", name)
    start = _as_time(start_time or src.start_time)
    end = _as_time(end_time or src.end_time, "22:00:00")
    from datetime import datetime

    day = frappe.utils.getdate(event_date)
    window_start = datetime.combine(day, start)
    window_end = datetime.combine(day, end)
    from entertainment_express.booking.availability import check

    if not cint(as_template):
        for row in src.assigned_assets or []:
            result = check(row.asset, window_start, window_end)
            if not result.get("available"):
                frappe.throw("That date is not open for the gear on this job.")
    payload = {
        "doctype": "Event Booking",
        "event_name": f"{src.event_name} (copy)" if not cint(as_template) else f"{src.event_name} template",
        "customer": src.customer,
        "event_date": event_date,
        "start_time": str(start),
        "end_time": str(end),
        "venue_address": src.venue_address,
        "timezone": src.timezone or "America/New_York",
        "status": "inquiry",
        "source": "staff",
        "notes": src.notes if isinstance(src.notes, str) else "",
        "deposit_percent": src.deposit_percent or 25,
    }
    if src.meta.has_field("venue"):
        payload["venue"] = src.venue
    if src.meta.has_field("load_in_notes"):
        payload["load_in_notes"] = src.load_in_notes
        payload["parking_notes"] = src.parking_notes
        payload["power_notes"] = src.power_notes
        payload["noise_curfew"] = src.noise_curfew
    if src.meta.has_field("event_type"):
        payload["event_type"] = src.event_type
    if src.meta.has_field("is_template"):
        payload["is_template"] = 1 if cint(as_template) else 0
    doc = frappe.get_doc(payload)
    for row in src.service_items or []:
        item = {
            "item": row.item,
            "qty": row.qty,
            "rate": row.rate,
            "amount": row.amount,
            "service_package": getattr(row, "service_package", None),
        }
        if getattr(row, "client_visible", None) is not None:
            item["client_visible"] = row.client_visible
        doc.append("service_items", item)
    doc.insert(ignore_permissions=True)
    _clone_timeline(src.name, doc.name)
    _clone_planning_templates(src.name, doc.name)
    return {"name": doc.name, "id": doc.name}


def _clone_timeline(source: str, dest: str) -> None:
    if not frappe.db.table_exists("Event Timeline"):
        return
    src_name = frappe.db.get_value("Event Timeline", {"booking": source}, "name")
    if not src_name:
        return
    old = frappe.get_doc("Event Timeline", src_name)
    neu = frappe.get_doc(
        {
            "doctype": "Event Timeline",
            "booking": dest,
            "timezone": old.timezone,
            "status": "draft",
            "share_with_client": 0,
        }
    )
    for item in old.items or []:
        neu.append(
            "items",
            {
                "start_time": item.start_time,
                "end_time": item.end_time,
                "title": item.title,
                "description": item.description,
                "responsible": item.responsible,
                "location": item.location,
                "visible_to_client": getattr(item, "visible_to_client", 1),
                "song": getattr(item, "song", None),
            },
        )
    neu.insert(ignore_permissions=True)


def _clone_planning_templates(source: str, dest: str) -> None:
    if not frappe.db.table_exists("Planning Form Instance"):
        return
    for row in frappe.get_all("Planning Form Instance", filters={"booking": source}, fields=["template"]):
        if frappe.db.exists("Planning Form Instance", {"booking": dest, "template": row.template}):
            continue
        frappe.get_doc(
            {
                "doctype": "Planning Form Instance",
                "booking": dest,
                "template": row.template,
                "status": "not_started",
            }
        ).insert(ignore_permissions=True)
