"""Crew Field PWA APIs. Own-shift only. Guests denied. No tenant/site args."""

from __future__ import annotations

from urllib.parse import quote

import frappe
from frappe.utils import cint, flt, now_datetime

from entertainment_express.api import portal_dispatch as _pd
from entertainment_express.api import dispatch as _dispatch
from entertainment_express.white_label.urls import absolute_url

GUEST_ROLE = "EE Event Guest"
PAYER_ROLE = "EE Customer"
STAGES = ("en-route", "on-site", "setup-complete", "complete")
ISSUE_KINDS = ("damage", "no_show", "access", "other")
MAX_BYTES = 5 * 1024 * 1024


def _roles() -> set[str]:
    return set(frappe.get_roles() or [])


def _deny_guest() -> None:
    roles = _roles()
    user = getattr(getattr(frappe, "session", None), "user", "") or ""
    if user in ("Guest", "guest") or user == "Guest":
        frappe.throw("Not allowed.", frappe.PermissionError)
    if GUEST_ROLE in roles and PAYER_ROLE not in roles:
        frappe.throw("Not allowed.", frappe.PermissionError)


def _require_field() -> None:
    _deny_guest()
    _pd._require_field()


def _assignment(name: str):
    _require_field()
    _pd._assert_own_or_dispatch(name)
    return frappe.get_doc("Crew Assignment", name)


def _maps_url(address: str = "", geo: str = "") -> str:
    dest = (geo or address or "").strip()
    if not dest:
        return ""
    return "https://www.google.com/maps/dir/?api=1&destination=" + quote(dest)


def _checklist(booking: str) -> list[dict]:
    if not frappe.db.exists("Run Sheet", {"booking": booking}):
        return [
            {"id": f"new-{i}", "label": task, "done": False}
            for i, task in enumerate(_dispatch._default_checklist(frappe.get_doc("Event Booking", booking)), 1)
        ]
    rs = frappe.get_doc("Run Sheet", frappe.db.get_value("Run Sheet", {"booking": booking}, "name"))
    out = []
    for row in rs.checklist_items or []:
        out.append({"id": row.name or str(row.idx), "label": row.description, "done": bool(cint(row.done))})
    return out


def _job_payload(row: dict, booking) -> dict:
    geo = getattr(booking, "venue_geo", None) or ""
    place = booking.venue_address or ""
    status = row.get("status")
    stage = row.get("stage") or ""
    return {
        **row,
        "job_id": row.get("booking") or booking.name,
        "geo": geo,
        "maps_url": _maps_url(place, geo),
        "stage": stage,
        "checklist": _checklist(booking.name),
        "can_en_route": status == "accepted" and stage != "en-route",
        "can_setup_complete": status == "checked_in" and stage != "setup-complete",
    }


@frappe.whitelist()
def my_jobs() -> list[dict]:
    _require_field()
    out = []
    for row in _pd.my_shifts():
        booking_name = None
        try:
            ca = frappe.get_doc("Crew Assignment", row["id"])
            booking_name = ca.booking
            booking = frappe.get_doc("Event Booking", ca.booking)
            row["booking"] = ca.booking
            row["stage"] = getattr(ca, "stage", None) or ""
            out.append(_job_payload(row, booking))
        except Exception:
            row["job_id"] = booking_name or ""
            row["maps_url"] = _maps_url(row.get("place") or "")
            row["checklist"] = []
            out.append(row)
    return out


@frappe.whitelist()
def check_in(assignment: str, latitude: float | None = None, longitude: float | None = None) -> dict:
    _assignment(assignment)
    _dispatch.crew_check_in(assignment, latitude=latitude, longitude=longitude)
    return {"status": "On site"}


@frappe.whitelist()
def check_out(assignment: str) -> dict:
    _assignment(assignment)
    _dispatch.crew_check_out(assignment)
    return {"status": "Done"}


@frappe.whitelist()
def set_stage(assignment: str, stage: str) -> dict:
    ca = _assignment(assignment)
    key = (stage or "").strip().lower()
    if key not in STAGES:
        frappe.throw("Unknown stage.")
    if key == "on-site" and ca.status == "accepted":
        _dispatch.crew_check_in(assignment)
        try:
            from entertainment_express.api import tracking

            tracking.on_stage_change(assignment, "on-site")
        except Exception:
            pass
        return {"stage": "on-site"}
    if key == "complete" and ca.status == "checked_in":
        _dispatch.crew_check_out(assignment)
        try:
            from entertainment_express.api import tracking

            tracking.on_stage_change(assignment, "complete")
        except Exception:
            pass
        return {"stage": "complete"}
    ca.db_set("stage", key)
    frappe.db.commit()
    try:
        from entertainment_express.api import tracking

        tracking.on_stage_change(assignment, key)
    except Exception:
        pass
    return {"stage": key}


@frappe.whitelist()
def tracking_ping(assignment: str, latitude: float = 0, longitude: float = 0) -> dict:
    _assignment(assignment)
    from entertainment_express.api import tracking

    return tracking.ping(assignment=assignment, latitude=latitude, longitude=longitude)


@frappe.whitelist()
def toggle_checklist(assignment: str, item: str, done: int = 1) -> dict:
    ca = _assignment(assignment)
    _dispatch._build_run_sheet(ca.booking)
    rs_name = frappe.db.get_value("Run Sheet", {"booking": ca.booking}, "name")
    rs = frappe.get_doc("Run Sheet", rs_name)
    matched = False
    for row in rs.checklist_items or []:
        if str(row.name) == str(item) or str(row.idx) == str(item) or f"new-{row.order}" == str(item):
            row.done = 1 if cint(done) else 0
            matched = True
            break
    if not matched and str(item).startswith("new-"):
        try:
            idx = int(str(item).split("-", 1)[1])
        except ValueError:
            idx = 0
        for row in rs.checklist_items or []:
            if cint(row.order) == idx:
                row.done = 1 if cint(done) else 0
                matched = True
                break
    if not matched:
        frappe.throw("That checklist step was not found.")
    rs.save(ignore_permissions=True)
    return {"ok": 1}


@frappe.whitelist()
def upload_photo(assignment: str, title: str, content_b64: str, file_name: str = "", kind: str = "photo") -> dict:
    ca = _assignment(assignment)
    from entertainment_express.api import deliverables

    return deliverables.save_deliverable(
        ca.booking,
        title or "Field photo",
        content_b64,
        file_name=file_name or "photo.jpg",
        kind=kind or "photo",
    )


@frappe.whitelist()
def capture_signature(assignment: str, signer_name: str, content_b64: str = "") -> dict:
    ca = _assignment(assignment)
    name = (signer_name or "").strip()
    if not name:
        frappe.throw("Type the name they are signing as.")
    raw = (content_b64 or "").split(",")[-1].strip()
    if raw:
        import base64
        import binascii

        try:
            blob = base64.b64decode(raw, validate=False)
        except (binascii.Error, ValueError):
            frappe.throw("That signature could not be read.")
        if len(blob) > MAX_BYTES:
            frappe.throw("That file is too large. Keep it under 5 MB.")
    doc = frappe.get_doc(
        {
            "doctype": "EE Field Signature",
            "booking": ca.booking,
            "assignment": ca.name,
            "signer_name": name[:140],
            "content_b64": raw,
            "signed_at": now_datetime(),
            "signed_by": frappe.session.user,
        }
    )
    doc.insert(ignore_permissions=True)
    return {"id": doc.name, "signed_at": str(doc.signed_at)}


@frappe.whitelist()
def report_issue(assignment: str, kind: str, detail: str, photo_b64: str = "") -> dict:
    ca = _assignment(assignment)
    key = (kind or "other").strip().lower()
    if key not in ISSUE_KINDS:
        key = "other"
    text = (detail or "").strip()
    if not text:
        frappe.throw("Describe what happened.")
    raw = (photo_b64 or "").split(",")[-1].strip()
    if raw:
        import base64
        import binascii

        try:
            blob = base64.b64decode(raw, validate=False)
        except (binascii.Error, ValueError):
            frappe.throw("That photo could not be read.")
        if len(blob) > MAX_BYTES:
            frappe.throw("That file is too large. Keep it under 5 MB.")
    doc = frappe.get_doc(
        {
            "doctype": "EE Field Issue",
            "booking": ca.booking,
            "assignment": ca.name,
            "kind": key,
            "detail": text[:1000],
            "photo_b64": raw,
            "status": "open",
            "reported_by": frappe.session.user,
        }
    )
    doc.insert(ignore_permissions=True)
    labels = {"damage": "Damage", "no_show": "No-show", "access": "Access", "other": "Issue"}
    _dispatch._notify_dispatcher(
        "field_issue",
        {
            "kind_label": labels.get(key, "Issue"),
            "detail": text[:400],
            "job": _pd._job_title(ca.booking),
            "person": frappe.session.user,
            "field_link": absolute_url("/employee/dispatch"),
        },
    )
    return {"id": doc.name, "status": "open"}


@frappe.whitelist()
def register_push_token(token: str, platform: str = "web") -> dict:
    _require_field()
    value = (token or "").strip()
    if not value:
        frappe.throw("Missing device token.")
    plat = (platform or "web").strip().lower()
    if plat not in ("web", "android", "ios"):
        plat = "web"
    if not frappe.db.table_exists("EE Push Device"):
        return {"ok": 0}
    existing = frappe.db.get_value(
        "EE Push Device",
        {"user": frappe.session.user, "token": value},
        "name",
    )
    if existing:
        frappe.db.set_value("EE Push Device", existing, "platform", plat)
        return {"id": existing}
    doc = frappe.get_doc(
        {
            "doctype": "EE Push Device",
            "user": frappe.session.user,
            "token": value,
            "platform": plat,
        }
    )
    doc.insert(ignore_permissions=True)
    return {"id": doc.name}


def _ensure_templates() -> None:
    if not frappe.db.table_exists("Notification Template"):
        return
    if frappe.db.exists("Notification Template", {"template_key": "field_issue"}):
        return
    frappe.get_doc(
        {
            "doctype": "Notification Template",
            "template_key": "field_issue",
            "name": "field_issue",
            "subject": "On-site issue: {{ kind_label }} — {{ job }}",
            "body_html": "<p><b>{{ person }}</b> reported {{ kind_label }} on {{ job }}.</p><p>{{ detail }}</p>",
            "active": 1,
            "channels": "email,push",
            "priority": "transactional",
        }
    ).insert(ignore_permissions=True)


# flt imported so tests can assert money is not computed in this module
_ = flt


@frappe.whitelist()
def log_sanitization(values: dict | str | None = None) -> dict:
    """Crew records post-use cleaning."""
    _require_field()
    from entertainment_express.api import safety

    return safety.log_sanitization(values)


@frappe.whitelist()
def attendee_waiver_qr(booking: str) -> dict:
    """QR URL for on-site attendee waivers."""
    _require_field()
    from entertainment_express.api import safety

    return safety.attendee_waiver_qr(booking)


@frappe.whitelist()
def media_gallery(booking: str) -> dict:
    _require_field()
    from entertainment_express.api import media_gallery as mg

    return mg.ensure_gallery(booking)


@frappe.whitelist()
def media_upload(gallery: str, title: str, content_b64: str, file_name: str = "") -> dict:
    _require_field()
    from entertainment_express.api import media_gallery as mg

    return mg.upload_item(gallery, title, content_b64, file_name=file_name)
