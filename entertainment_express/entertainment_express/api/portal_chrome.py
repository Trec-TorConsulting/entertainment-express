"""Header chrome: search, inbox, and identity from Frappe/ERPNext primitives."""

from __future__ import annotations

import frappe


def _person() -> dict:
    user = frappe.session.user or "Guest"
    if user == "Guest":
        return {"name": "Guest", "full_name": "Guest", "email": "", "image": None}
    row = frappe.db.get_value("User", user, ["full_name", "user_image", "email", "first_name"], as_dict=True) or {}
    return {
        "name": user,
        "full_name": row.get("full_name") or row.get("first_name") or user,
        "email": row.get("email") or user,
        "image": row.get("user_image"),
    }


@frappe.whitelist()
def list_inbox() -> list[dict]:
    user = frappe.session.user
    if not user or user == "Guest":
        return []
    items: list[dict] = []
    try:
        for row in frappe.get_all(
            "ToDo",
            filters={"allocated_to": user, "status": "Open"},
            fields=["name", "description", "date", "reference_type", "reference_name", "priority"],
            order_by="date asc",
            limit_page_length=20,
        ):
            items.append(
                {
                    "id": row.name,
                    "kind": "task",
                    "title": row.description or "Open task",
                    "when": str(row.date or ""),
                    "ref_type": row.reference_type,
                    "ref_name": row.reference_name,
                    "priority": row.priority,
                }
            )
    except Exception:
        pass
    return items


@frappe.whitelist()
def complete_task(name: str) -> dict:
    user = frappe.session.user
    doc = frappe.get_doc("ToDo", name)
    if doc.allocated_to != user and "EE Tenant Admin" not in set(frappe.get_roles() or []):
        frappe.throw("Not your task.", frappe.PermissionError)
    doc.status = "Closed"
    doc.save(ignore_permissions=True)
    return {"ok": True}


@frappe.whitelist()
def search(query: str) -> list[dict]:
    text = (query or "").strip()
    if len(text) < 2:
        return []
    like = f"%{text}%"
    results: list[dict] = []
    try:
        for row in frappe.get_all(
            "Event Booking",
            filters=[["event_name", "like", like]],
            fields=["name", "event_name", "event_date", "status"],
            limit_page_length=8,
        ):
            results.append(
                {
                    "type": "booking",
                    "id": row.name,
                    "label": row.event_name or row.name,
                    "meta": f"{row.event_date or ''} · {row.status or ''}".strip(" ·"),
                }
            )
    except Exception:
        pass
    try:
        for row in frappe.get_all(
            "Customer",
            filters={"customer_name": ["like", like]},
            fields=["name", "customer_name"],
            limit_page_length=5,
        ):
            results.append({"type": "customer", "id": row.name, "label": row.customer_name or row.name, "meta": "Customer"})
    except Exception:
        pass
    try:
        for row in frappe.get_all(
            "Lead",
            filters={"lead_name": ["like", like]},
            fields=["name", "lead_name", "status"],
            limit_page_length=5,
        ):
            results.append({"type": "lead", "id": row.name, "label": row.lead_name or row.name, "meta": row.status or "Lead"})
    except Exception:
        pass
    return results
