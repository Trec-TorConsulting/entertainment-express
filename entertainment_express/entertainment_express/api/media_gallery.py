"""Media gallery pipeline — upload, publish, share tokens, print counts."""

from __future__ import annotations

import base64
import binascii
import secrets
from datetime import timedelta

import frappe
from frappe.utils import cint, get_datetime, now_datetime

from entertainment_express.api.portal_collaboration import is_booking_member
from entertainment_express.api.portal_owner import OWNER_ROLES

GUEST_ROLE = "EE Event Guest"
PAYER_ROLE = "EE Customer"
STAFF = OWNER_ROLES | {"EE Sales", "EE Dispatcher", "System Manager"}
CREW = {"EE Crew", "EE Entertainer"}
MAX_BYTES = 8 * 1024 * 1024


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


def _require_upload(booking: str) -> None:
    if _is_staff():
        return
    roles = _roles()
    if GUEST_ROLE in roles and PAYER_ROLE not in roles:
        frappe.throw("Not allowed.", frappe.PermissionError)
    if roles.intersection(CREW):
        emp = frappe.db.get_value("Employee", {"user_id": frappe.session.user}, "name")
        if emp and frappe.db.exists("Crew Assignment", {"booking": booking, "crew_member": emp}):
            return
    frappe.throw("Not allowed.", frappe.PermissionError)


def _require_member(booking: str) -> None:
    if _is_staff():
        return
    if not is_booking_member(booking):
        frappe.throw("Not allowed for this event.", frappe.PermissionError)


def _notify(key: str, email: str, ctx: dict) -> None:
    if not email:
        return
    try:
        from entertainment_express.notifications import send

        send(key, email, ctx)
    except Exception:
        frappe.logger().error("media notify failed")


def _ensure_gallery_ready_template() -> None:
    if not frappe.db.table_exists("Notification Template"):
        return
    if frappe.db.exists("Notification Template", {"template_key": "gallery_ready"}):
        return
    frappe.get_doc(
        {
            "doctype": "Notification Template",
            "name": "gallery_ready",
            "template_key": "gallery_ready",
            "subject": "Your photos from {{ event_name }} are ready",
            "body_html": "<p>Your gallery for <b>{{ event_name }}</b> is ready.</p><p><a href='{{ gallery_url }}'>Open gallery</a></p>",
            "active": 1,
        }
    ).insert(ignore_permissions=True)


def _gallery_payload(doc, include_items: bool = False, include_files: bool = False) -> dict:
    data = {
        "id": doc.name,
        "booking": doc.booking,
        "title": doc.title,
        "published": bool(cint(doc.published)),
        "share_token": doc.share_token or "",
        "share_url": f"{frappe.utils.get_url()}/g/{doc.share_token}" if doc.share_token else "",
        "share_expires_on": str(doc.share_expires_on or ""),
        "template_name": doc.template_name or "",
        "print_count": cint(doc.print_count),
        "session_count": cint(doc.session_count),
    }
    if include_items and frappe.db.table_exists("EE Media Item"):
        items = []
        for row in frappe.get_all(
            "EE Media Item",
            filters={"gallery": doc.name},
            fields=["name", "title", "file_name", "mime", "print_count", "template_name", "uploaded_at", "content_b64"],
            order_by="uploaded_at desc",
            limit_page_length=200,
        ):
            item = {
                "id": row.name,
                "title": row.title or row.file_name or "Photo",
                "file_name": row.file_name or "",
                "mime": row.mime or "",
                "print_count": cint(row.print_count),
                "template_name": row.template_name or "",
                "uploaded_at": str(row.uploaded_at or ""),
            }
            if include_files:
                item["content_b64"] = row.content_b64 or ""
            items.append(item)
        data["items"] = items
    return data


@frappe.whitelist()
def ensure_gallery(booking: str, title: str | None = None, template_name: str | None = None) -> dict:
    _require_upload(booking)
    existing = frappe.db.get_value("EE Media Gallery", {"booking": booking}, "name")
    if existing:
        return _gallery_payload(frappe.get_doc("EE Media Gallery", existing), include_items=True)
    event = frappe.db.get_value("Event Booking", booking, "event_name") or booking
    doc = frappe.get_doc(
        {
            "doctype": "EE Media Gallery",
            "booking": booking,
            "title": (title or f"{event} gallery")[:140],
            "template_name": template_name or "",
            "published": 0,
            "share_token": secrets.token_urlsafe(20),
            "print_count": 0,
            "session_count": 0,
        }
    )
    doc.insert(ignore_permissions=True)
    return _gallery_payload(doc, include_items=True)


@frappe.whitelist()
def list_galleries(booking: str | None = None) -> list[dict]:
    if booking:
        _require_member(booking)
        filters = {"booking": booking}
    else:
        _require_staff()
        filters = {}
    if not frappe.db.table_exists("EE Media Gallery"):
        return []
    rows = []
    for row in frappe.get_all(
        "EE Media Gallery",
        filters=filters,
        fields=["name", "booking", "title", "published", "share_token", "print_count", "session_count", "template_name"],
        order_by="modified desc",
        limit_page_length=50,
    ):
        # Clients only see published unless staff
        if not _is_staff() and not cint(row.published):
            continue
        rows.append(
            {
                "id": row.name,
                "booking": row.booking,
                "title": row.title,
                "published": bool(cint(row.published)),
                "share_url": f"{frappe.utils.get_url()}/g/{row.share_token}" if row.share_token else "",
                "print_count": cint(row.print_count),
                "session_count": cint(row.session_count),
                "template_name": row.template_name or "",
            }
        )
    return rows


@frappe.whitelist()
def get_gallery(name: str) -> dict:
    doc = frappe.get_doc("EE Media Gallery", name)
    if _is_staff():
        return _gallery_payload(doc, include_items=True, include_files=True)
    _require_member(doc.booking)
    if not cint(doc.published):
        frappe.throw("Gallery not published.", frappe.PermissionError)
    return _gallery_payload(doc, include_items=True, include_files=True)


@frappe.whitelist()
def upload_item(
    gallery: str,
    title: str,
    content_b64: str,
    file_name: str = "",
    template_name: str = "",
) -> dict:
    gal = frappe.get_doc("EE Media Gallery", gallery)
    _require_upload(gal.booking)
    raw = (content_b64 or "").split(",")[-1].strip()
    if not raw:
        frappe.throw("Pick a file.")
    try:
        blob = base64.b64decode(raw, validate=False)
    except (binascii.Error, ValueError):
        frappe.throw("That file could not be read.")
    if len(blob) > MAX_BYTES:
        frappe.throw("That file is too large. Keep it under 8 MB.")
    mime = "image/jpeg"
    lower = (file_name or "").lower()
    if lower.endswith(".png"):
        mime = "image/png"
    elif lower.endswith(".webp"):
        mime = "image/webp"
    elif lower.endswith(".gif"):
        mime = "image/gif"
    elif lower.endswith(".mp4"):
        mime = "video/mp4"
    item = frappe.get_doc(
        {
            "doctype": "EE Media Item",
            "gallery": gallery,
            "title": (title or file_name or "Photo")[:140],
            "file_name": (file_name or "photo.jpg")[:140],
            "mime": mime,
            "content_b64": raw,
            "print_count": 0,
            "template_name": template_name or gal.template_name or "",
            "uploaded_by": frappe.session.user,
            "uploaded_at": now_datetime(),
        }
    )
    item.insert(ignore_permissions=True)
    gal.session_count = cint(gal.session_count) + 1
    gal.save(ignore_permissions=True)
    return {
        "id": item.name,
        "title": item.title,
        "gallery": gallery,
        "print_count": 0,
    }


@frappe.whitelist()
def publish(gallery: str, published: int = 1, notify: int = 1) -> dict:
    _require_staff()
    doc = frappe.get_doc("EE Media Gallery", gallery)
    doc.published = 1 if cint(published) else 0
    if not doc.share_token:
        doc.share_token = secrets.token_urlsafe(20)
    if cint(published) and not doc.share_expires_on:
        doc.share_expires_on = now_datetime() + timedelta(days=90)
    doc.save(ignore_permissions=True)
    if cint(published) and cint(notify):
        _ensure_gallery_ready_template()
        customer = frappe.db.get_value("Event Booking", doc.booking, "customer")
        email = frappe.db.get_value("Customer", customer, "email_id") if customer else ""
        event = frappe.db.get_value("Event Booking", doc.booking, "event_name") or doc.booking
        _notify(
            "gallery_ready",
            email or "",
            {
                "event_name": event,
                "gallery_url": f"{frappe.utils.get_url()}/client/events",
                "share_url": f"{frappe.utils.get_url()}/g/{doc.share_token}",
            },
        )
    return _gallery_payload(doc, include_items=True)


@frappe.whitelist()
def increment_print(item: str | None = None, gallery: str | None = None, count: int = 1) -> dict:
    roles = _roles()
    if not (_is_staff() or roles.intersection(CREW)):
        frappe.throw("Not allowed.", frappe.PermissionError)
    n = max(1, cint(count))
    if item:
        doc = frappe.get_doc("EE Media Item", item)
        doc.print_count = cint(doc.print_count) + n
        doc.save(ignore_permissions=True)
        gal = frappe.get_doc("EE Media Gallery", doc.gallery)
        gal.print_count = cint(gal.print_count) + n
        gal.save(ignore_permissions=True)
        return {"item": doc.name, "print_count": cint(doc.print_count), "gallery_prints": cint(gal.print_count)}
    if gallery:
        gal = frappe.get_doc("EE Media Gallery", gallery)
        gal.print_count = cint(gal.print_count) + n
        gal.save(ignore_permissions=True)
        return {"gallery": gal.name, "print_count": cint(gal.print_count)}
    frappe.throw("item or gallery is required.")


@frappe.whitelist(allow_guest=True)
def public_gallery(token: str) -> dict:
    """Guest share link — published only, not expired."""
    if not token:
        frappe.throw("Not found.", frappe.PermissionError)
    name = frappe.db.get_value("EE Media Gallery", {"share_token": token, "published": 1}, "name")
    if not name:
        frappe.throw("Gallery not found.", frappe.PermissionError)
    doc = frappe.get_doc("EE Media Gallery", name)
    if doc.share_expires_on and get_datetime(doc.share_expires_on) < now_datetime():
        frappe.throw("This share link has expired.", frappe.PermissionError)
    return _gallery_payload(doc, include_items=True, include_files=True)
