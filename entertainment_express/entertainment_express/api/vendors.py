"""Partner directory, referrals, overflow assignments. Money via flt + fmt_money."""

from __future__ import annotations

import frappe
from frappe.utils import cint, flt, fmt_money

from entertainment_express.api.portal_owner import OWNER_ROLES

STAFF = OWNER_ROLES | {"EE Sales", "EE Dispatcher", "System Manager"}
GUEST_ROLE = "EE Event Guest"
PAYER_ROLE = "EE Customer"


def _require_staff() -> None:
    roles = set(frappe.get_roles() or [])
    if GUEST_ROLE in roles and PAYER_ROLE not in roles:
        frappe.throw("Not allowed.", frappe.PermissionError)
    if not roles.intersection(STAFF):
        frappe.throw("Not allowed.", frappe.PermissionError)


def _money(amount) -> str:
    return fmt_money(flt(amount), currency=frappe.db.get_default("currency") or "USD")


def _contacts(doc) -> list[dict]:
    rows = []
    for row in doc.get("contacts") or []:
        rows.append(
            {
                "name": row.contact_name,
                "role": row.role or "",
                "phone": row.phone or "",
                "email": row.email or "",
            }
        )
    return rows


def _serialize_vendor(doc) -> dict:
    return {
        "id": doc.name,
        "name": doc.vendor_name,
        "category": doc.category or "",
        "preferred": bool(cint(doc.preferred)),
        "subcontractor": bool(cint(doc.subcontractor)),
        "rating": flt(doc.rating),
        "w9_on_file": bool(cint(doc.w9_on_file)),
        "coi_on_file": bool(cint(doc.coi_on_file)),
        "pay_terms": doc.default_pay_terms or "",
        "notes": doc.notes or "",
        "contacts": _contacts(doc),
    }


@frappe.whitelist()
def list_vendors() -> list[dict]:
    _require_staff()
    if not frappe.db.table_exists("EE Vendor"):
        return []
    return [_serialize_vendor(frappe.get_doc("EE Vendor", row.name)) for row in frappe.get_all("EE Vendor", fields=["name"], order_by="vendor_name asc", limit_page_length=200)]


@frappe.whitelist()
def save_vendor(values: dict | str | None = None, name: str | None = None) -> dict:
    _require_staff()
    if isinstance(values, str):
        values = frappe.parse_json(values) or {}
    values = values or {}
    payload = {
        "vendor_name": (values.get("name") or values.get("vendor_name") or "").strip(),
        "category": values.get("category") or "",
        "preferred": 1 if cint(values.get("preferred")) else 0,
        "subcontractor": 1 if cint(values.get("subcontractor")) else 0,
        "rating": flt(values.get("rating")),
        "w9_on_file": 1 if cint(values.get("w9_on_file")) else 0,
        "coi_on_file": 1 if cint(values.get("coi_on_file")) else 0,
        "default_pay_terms": values.get("pay_terms") or "",
        "notes": values.get("notes") or "",
    }
    if not payload["vendor_name"]:
        frappe.throw("Name is required.")
    if name:
        doc = frappe.get_doc("EE Vendor", name)
        doc.update(payload)
    else:
        doc = frappe.get_doc({"doctype": "EE Vendor", **payload})
    doc.set("contacts", [])
    for row in values.get("contacts") or []:
        if not row.get("name"):
            continue
        doc.append(
            "contacts",
            {
                "contact_name": row.get("name"),
                "role": row.get("role") or "",
                "phone": row.get("phone") or "",
                "email": row.get("email") or "",
            },
        )
    if name:
        doc.save()
    else:
        doc.insert()
    return _serialize_vendor(doc)


@frappe.whitelist()
def list_referrals() -> list[dict]:
    _require_staff()
    if not frappe.db.table_exists("EE Referral"):
        return []
    rows = []
    for row in frappe.get_all(
        "EE Referral",
        fields=["name", "direction", "vendor", "lead", "booking", "status", "commission"],
        order_by="modified desc",
        limit_page_length=80,
    ):
        rows.append(
            {
                "id": row.name,
                "direction": row.direction,
                "vendor": frappe.db.get_value("EE Vendor", row.vendor, "vendor_name") or row.vendor,
                "vendor_id": row.vendor,
                "lead": row.lead or "",
                "booking": row.booking or "",
                "status": row.status,
                "commission": _money(row.commission),
            }
        )
    return rows


@frappe.whitelist()
def save_referral(values: dict | str | None = None) -> dict:
    _require_staff()
    if isinstance(values, str):
        values = frappe.parse_json(values) or {}
    values = values or {}
    if not values.get("vendor"):
        frappe.throw("Pick a partner.")
    doc = frappe.get_doc(
        {
            "doctype": "EE Referral",
            "direction": values.get("direction") or "received",
            "vendor": values.get("vendor"),
            "lead": values.get("lead") or None,
            "booking": values.get("booking") or None,
            "status": values.get("status") or "open",
            "commission": flt(values.get("commission")),
            "notes": values.get("notes") or "",
        }
    )
    doc.insert()
    return {"id": doc.name, "commission": _money(doc.commission)}


@frappe.whitelist()
def list_assignments(booking: str) -> list[dict]:
    _require_staff()
    return _assignments_for(booking)


def _assignments_for(booking: str) -> list[dict]:
    if not booking or not frappe.db.table_exists("EE Vendor Assignment"):
        return []
    rows = []
    for row in frappe.get_all(
        "EE Vendor Assignment",
        filters={"booking": booking, "status": ["!=", "canceled"]},
        fields=["name", "vendor", "role", "agreed_cost", "status"],
        order_by="modified desc",
    ):
        contacts = []
        if frappe.db.exists("EE Vendor", row.vendor):
            contacts = _contacts(frappe.get_doc("EE Vendor", row.vendor))
        rows.append(
            {
                "id": row.name,
                "vendor": frappe.db.get_value("EE Vendor", row.vendor, "vendor_name") or row.vendor,
                "vendor_id": row.vendor,
                "role": row.role or "",
                "cost": _money(row.agreed_cost),
                "status": row.status,
                "phone": (contacts[0]["phone"] if contacts else ""),
                "contacts": contacts,
            }
        )
    return rows


@frappe.whitelist()
def save_assignment(booking: str, vendor: str, role: str = "", cost: float = 0) -> dict:
    _require_staff()
    doc = frappe.get_doc(
        {
            "doctype": "EE Vendor Assignment",
            "booking": booking,
            "vendor": vendor,
            "role": role,
            "agreed_cost": flt(cost),
            "status": "planned",
        }
    )
    doc.insert()
    return {"id": doc.name, "cost": _money(doc.agreed_cost)}


def field_vendors(booking: str) -> list[dict]:
    """Crew-safe list: name, role, phone only."""
    return [
        {"name": row["vendor"], "role": row["role"], "phone": row["phone"]}
        for row in _assignments_for(booking)
    ]
