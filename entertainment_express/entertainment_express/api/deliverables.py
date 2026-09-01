"""Job files the client can download. Unpublished stays owner-only. No tenant args."""

from __future__ import annotations

import base64
import binascii

import frappe
from frappe.utils import cint, now_datetime

from entertainment_express.api.portal_collaboration import is_booking_member
from entertainment_express.api.portal_owner import OWNER_ROLES

GUEST_ROLE = "EE Event Guest"
PAYER_ROLE = "EE Customer"
STAFF = OWNER_ROLES | {"EE Sales", "EE Dispatcher", "System Manager"}
MAX_BYTES = 5 * 1024 * 1024
KINDS = ("photo", "video", "receipt", "other")


def _roles() -> set[str]:
    return set(frappe.get_roles() or [])


def _is_staff() -> bool:
    roles = _roles()
    if GUEST_ROLE in roles and PAYER_ROLE not in roles:
        return False
    return bool(roles.intersection(STAFF))


def _require_staff() -> None:
    if not _is_staff():
        frappe.throw("Not allowed.", frappe.PermissionError)


def _require_member(booking: str) -> None:
    if _is_staff():
        return
    if not is_booking_member(booking):
        frappe.throw("Not allowed for this event.", frappe.PermissionError)


def _mime(filename: str, fallback: str = "") -> str:
    name = (filename or "").lower()
    if name.endswith(".png"):
        return "image/png"
    if name.endswith(".jpg") or name.endswith(".jpeg"):
        return "image/jpeg"
    if name.endswith(".gif"):
        return "image/gif"
    if name.endswith(".webp"):
        return "image/webp"
    if name.endswith(".pdf"):
        return "application/pdf"
    if name.endswith(".mp4"):
        return "video/mp4"
    return fallback or "application/octet-stream"


def _payload(doc, include_file: bool = False) -> dict:
    data = {
        "id": doc.name,
        "booking": doc.booking,
        "title": doc.title,
        "kind": doc.kind,
        "file_name": doc.file_name or "",
        "mime": doc.mime or "",
        "published": bool(cint(doc.published)),
        "published_at": str(doc.published_at or ""),
    }
    if include_file:
        data["content_b64"] = doc.content_b64 or ""
        data["filename"] = doc.file_name or "file"
    return data


@frappe.whitelist()
def save_deliverable(booking: str, title: str, content_b64: str, file_name: str = "", kind: str = "photo", mime: str = "") -> dict:
    _require_staff()
    if not frappe.db.exists("Event Booking", booking):
        frappe.throw("That job was not found.")
    raw = (content_b64 or "").split(",")[-1].strip()
    if not raw:
        frappe.throw("Pick a file.")
    try:
        blob = base64.b64decode(raw, validate=False)
    except (binascii.Error, ValueError):
        frappe.throw("That file could not be read.")
    if len(blob) > MAX_BYTES:
        frappe.throw("That file is too large. Keep it under 5 MB.")
    kind = kind if kind in KINDS else "photo"
    doc = frappe.get_doc(
        {
            "doctype": "EE Deliverable",
            "booking": booking,
            "title": (title or file_name or "Photo")[:140],
            "kind": kind,
            "file_name": (file_name or "file")[:140],
            "mime": mime or _mime(file_name),
            "content_b64": raw,
            "published": 0,
        }
    )
    doc.insert(ignore_permissions=True)
    return _payload(doc)


@frappe.whitelist()
def publish_deliverable(name: str, published: int = 1) -> dict:
    _require_staff()
    doc = frappe.get_doc("EE Deliverable", name)
    doc.published = 1 if cint(published) else 0
    doc.published_at = now_datetime() if doc.published else None
    doc.save(ignore_permissions=True)
    return _payload(doc)


@frappe.whitelist()
def list_deliverables(booking: str) -> list[dict]:
    _require_member(booking)
    if not frappe.db.table_exists("EE Deliverable"):
        return []
    filters: dict = {"booking": booking}
    if not _is_staff():
        filters["published"] = 1
    rows = []
    for row in frappe.get_all(
        "EE Deliverable",
        filters=filters,
        fields=["name", "title", "kind", "file_name", "mime", "published", "published_at"],
        order_by="modified desc",
        limit_page_length=50,
    ):
        rows.append(
            {
                "id": row.name,
                "title": row.title,
                "kind": row.kind,
                "file_name": row.file_name or "",
                "mime": row.mime or "",
                "published": bool(cint(row.published)),
                "published_at": str(row.published_at or ""),
            }
        )
    return rows


@frappe.whitelist()
def get_deliverable(name: str) -> dict:
    doc = frappe.get_doc("EE Deliverable", name)
    _require_member(doc.booking)
    if not _is_staff() and not cint(doc.published):
        frappe.throw("Not allowed for this event.", frappe.PermissionError)
    return _payload(doc, include_file=True)
