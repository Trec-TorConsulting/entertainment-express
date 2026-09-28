"""Header chrome: search, inbox, and identity for the portals."""

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
            results.append({"type": "customer", "id": row.name, "label": row.customer_name or row.name, "meta": "Client"})
    except Exception:
        pass
    try:
        for row in frappe.get_all(
            "Lead",
            filters={"lead_name": ["like", like]},
            fields=["name", "lead_name", "status"],
            limit_page_length=5,
        ):
            results.append({"type": "lead", "id": row.name, "label": row.lead_name or row.name, "meta": row.status or "Inquiry"})
    except Exception:
        pass
    return results


@frappe.whitelist()
def get_my_account() -> dict:
    user = frappe.session.user
    if not user or user == "Guest":
        frappe.throw("Authentication required.", frappe.PermissionError)

    roles = frappe.get_roles(user) or []
    row = frappe.db.get_value(
        "User",
        user,
        ["full_name", "first_name", "last_name", "email", "mobile_no", "phone", "user_image"],
        as_dict=True,
    ) or {}

    phone = row.get("mobile_no") or row.get("phone") or ""
    if not phone and frappe.db.exists("Employee", {"user_id": user}):
        phone = frappe.db.get_value("Employee", {"user_id": user}, "cell_number") or ""

    company = (
        frappe.db.get_default("company")
        or frappe.db.get_single_value("Global Defaults", "default_company")
        or frappe.db.get_single_value("Website Settings", "app_name")
        or "Your Company"
    )

    plan_info = {"plan": "Enterprise", "status": "active", "price": "$149 / mo"}
    try:
        from entertainment_express.api.saas_billing import my_plan
        plan_info = my_plan()
    except Exception:
        pass

    require_2fa = False
    try:
        from entertainment_express.api.hardening import security_status
        sec = security_status()
        require_2fa = bool(sec.get("require_2fa"))
    except Exception:
        pass

    return {
        "user": user,
        "full_name": row.get("full_name") or row.get("first_name") or user,
        "first_name": row.get("first_name") or "",
        "last_name": row.get("last_name") or "",
        "email": row.get("email") or user,
        "phone": phone,
        "image": row.get("user_image"),
        "roles": roles,
        "company": company,
        "plan": plan_info,
        "require_2fa": require_2fa,
        "site": getattr(frappe.local, "site", "") or "",
    }


@frappe.whitelist()
def update_my_profile(full_name: str | None = None, phone: str | None = None) -> dict:
    user = frappe.session.user
    if not user or user == "Guest":
        frappe.throw("Authentication required.", frappe.PermissionError)

    updates = {}
    if full_name is not None:
        full_name = full_name.strip()
        if full_name:
            updates["full_name"] = full_name
            parts = full_name.split(" ", 1)
            updates["first_name"] = parts[0]
            updates["last_name"] = parts[1] if len(parts) > 1 else ""

    if phone is not None:
        updates["mobile_no"] = phone.strip()
        updates["phone"] = phone.strip()

    if updates:
        frappe.db.set_value("User", user, updates)
        if frappe.db.exists("Employee", {"user_id": user}):
            emp_updates = {}
            if "first_name" in updates:
                emp_updates["first_name"] = updates["first_name"]
                emp_updates["last_name"] = updates.get("last_name", "")
            if "mobile_no" in updates:
                emp_updates["cell_number"] = updates["mobile_no"]
            if emp_updates:
                emp_name = frappe.db.get_value("Employee", {"user_id": user}, "name")
                frappe.db.set_value("Employee", emp_name, emp_updates)
        frappe.db.commit()

    return {"ok": True, "user": user, "full_name": updates.get("full_name")}

