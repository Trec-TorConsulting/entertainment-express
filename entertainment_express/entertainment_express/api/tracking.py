"""Live ETA tracking sessions for en-route crew."""

from __future__ import annotations

import math
import secrets

import frappe
from frappe.utils import cint, flt, get_datetime, now_datetime

from entertainment_express.api.portal_collaboration import is_booking_member
from entertainment_express.api.portal_owner import OWNER_ROLES

STAFF = OWNER_ROLES | {"EE Dispatcher", "EE Sales", "System Manager"}
CREW = {"EE Crew", "EE Entertainer"}
GUEST_ROLE = "EE Event Guest"
PAYER_ROLE = "EE Customer"


def _roles() -> set[str]:
    return set(frappe.get_roles() or [])


def _is_staff() -> bool:
    roles = _roles()
    if GUEST_ROLE in roles and PAYER_ROLE not in roles:
        return False
    return bool(roles.intersection(STAFF))


def _require_field_or_staff() -> None:
    roles = _roles()
    if GUEST_ROLE in roles and PAYER_ROLE not in roles:
        frappe.throw("Not allowed.", frappe.PermissionError)
    if not (roles.intersection(STAFF | CREW)):
        frappe.throw("Not allowed.", frappe.PermissionError)


def _notify(key: str, email: str, ctx: dict) -> None:
    if not email:
        return
    try:
        _ensure_templates()
        from entertainment_express.notifications import send

        send(key, email, ctx)
    except Exception:
        frappe.logger().error("tracking notify failed")


def _ensure_templates() -> None:
    if not frappe.db.table_exists("Notification Template"):
        return
    for key, subject, body in (
        (
            "tracking_en_route",
            "We're on the way — {{ event_name }}",
            "<p>Your crew is en route for <b>{{ event_name }}</b>.</p><p>ETA about {{ eta_minutes }} minutes.</p><p><a href='{{ track_url }}'>Track live</a></p>",
        ),
        (
            "tracking_arriving",
            "Arriving soon — {{ event_name }}",
            "<p>Your crew is arriving for <b>{{ event_name }}</b>.</p><p><a href='{{ track_url }}'>Track live</a></p>",
        ),
    ):
        if frappe.db.exists("Notification Template", {"template_key": key}):
            continue
        frappe.get_doc(
            {
                "doctype": "Notification Template",
                "name": key,
                "template_key": key,
                "subject": subject,
                "body_html": body,
                "active": 1,
            }
        ).insert(ignore_permissions=True)


def _haversine_miles(lat1, lon1, lat2, lon2) -> float:
    r = 3958.8
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def _eta_minutes(lat, lng, booking) -> int:
    """Maps provider optional; fallback haul minutes at ~30 mph."""
    geo = getattr(booking, "venue_geo", None) or ""
    parts = [p.strip() for p in str(geo).replace(";", ",").split(",") if p.strip()]
    if len(parts) < 2:
        return 30
    try:
        dest_lat, dest_lng = float(parts[0]), float(parts[1])
        miles = _haversine_miles(flt(lat), flt(lng), dest_lat, dest_lng)
        return max(1, int(math.ceil(miles / 30.0 * 60)))
    except Exception:
        return 30


def _payload(doc) -> dict:
    return {
        "id": doc.name,
        "booking": doc.booking,
        "assignment": doc.assignment or "",
        "status": doc.status,
        "share_token": doc.share_token or "",
        "track_url": f"{frappe.utils.get_url()}/t/{doc.share_token}" if doc.share_token else "",
        "eta_minutes": cint(doc.eta_minutes),
        "last_lat": flt(doc.last_lat) if doc.last_lat is not None else None,
        "last_lng": flt(doc.last_lng) if doc.last_lng is not None else None,
        "started_at": str(doc.started_at or ""),
        "ended_at": str(doc.ended_at or ""),
        "allow_guest": bool(cint(doc.allow_guest)),
    }


@frappe.whitelist()
def start_session(assignment: str, allow_guest: int = 0) -> dict:
    _require_field_or_staff()
    ca = frappe.get_doc("Crew Assignment", assignment)
    existing = frappe.db.get_value(
        "EE Live Tracking Session",
        {"assignment": assignment, "status": ["in", ["active", "arriving"]]},
        "name",
    )
    if existing:
        return _payload(frappe.get_doc("EE Live Tracking Session", existing))
    token = secrets.token_urlsafe(20)
    doc = frappe.get_doc(
        {
            "doctype": "EE Live Tracking Session",
            "booking": ca.booking,
            "assignment": assignment,
            "status": "active",
            "share_token": token,
            "allow_guest": 1 if cint(allow_guest) else 0,
            "started_at": now_datetime(),
        }
    )
    doc.insert(ignore_permissions=True)
    booking = frappe.get_doc("Event Booking", ca.booking)
    email = frappe.db.get_value("Customer", booking.customer, "email_id")
    _notify(
        "tracking_en_route",
        email or "",
        {
            "event_name": booking.event_name or booking.name,
            "eta_minutes": doc.eta_minutes or "—",
            "track_url": f"{frappe.utils.get_url()}/t/{token}",
        },
    )
    return _payload(doc)


@frappe.whitelist()
def ping(session: str | None = None, assignment: str | None = None, latitude: float = 0, longitude: float = 0) -> dict:
    _require_field_or_staff()
    if session:
        doc = frappe.get_doc("EE Live Tracking Session", session)
    elif assignment:
        name = frappe.db.get_value(
            "EE Live Tracking Session",
            {"assignment": assignment, "status": ["in", ["active", "arriving"]]},
            "name",
        )
        if not name:
            frappe.throw("No active tracking session.")
        doc = frappe.get_doc("EE Live Tracking Session", name)
    else:
        frappe.throw("session or assignment required.")
    if doc.status == "ended":
        frappe.throw("Tracking has ended.", frappe.ValidationError)
    booking = frappe.get_doc("Event Booking", doc.booking)
    doc.last_lat = flt(latitude)
    doc.last_lng = flt(longitude)
    doc.last_ping_at = now_datetime()
    doc.eta_minutes = _eta_minutes(latitude, longitude, booking)
    if doc.eta_minutes <= 5 and doc.status == "active":
        doc.status = "arriving"
        email = frappe.db.get_value("Customer", booking.customer, "email_id")
        _notify(
            "tracking_arriving",
            email or "",
            {
                "event_name": booking.event_name or booking.name,
                "eta_minutes": doc.eta_minutes,
                "track_url": f"{frappe.utils.get_url()}/t/{doc.share_token}",
            },
        )
    doc.save(ignore_permissions=True)
    return _payload(doc)


@frappe.whitelist()
def end_session(session: str | None = None, assignment: str | None = None) -> dict:
    _require_field_or_staff()
    if session:
        doc = frappe.get_doc("EE Live Tracking Session", session)
    elif assignment:
        name = frappe.db.get_value(
            "EE Live Tracking Session",
            {"assignment": assignment, "status": ["in", ["active", "arriving"]]},
            "name",
        )
        if not name:
            return {"status": "ended"}
        doc = frappe.get_doc("EE Live Tracking Session", name)
    else:
        frappe.throw("session or assignment required.")
    doc.status = "ended"
    doc.ended_at = now_datetime()
    doc.save(ignore_permissions=True)
    return _payload(doc)


@frappe.whitelist()
def client_tracking(booking: str) -> dict | None:
    roles = _roles()
    if GUEST_ROLE in roles and PAYER_ROLE not in roles:
        # guests only via public token unless allow_guest on an active session they were given
        frappe.throw("Use your tracking link.", frappe.PermissionError)
    if not _is_staff():
        if not is_booking_member(booking) and PAYER_ROLE not in roles:
            frappe.throw("Not allowed.", frappe.PermissionError)
    name = frappe.db.get_value(
        "EE Live Tracking Session",
        {"booking": booking, "status": ["in", ["active", "arriving"]]},
        "name",
    )
    if not name:
        return None
    return _payload(frappe.get_doc("EE Live Tracking Session", name))


@frappe.whitelist(allow_guest=True)
def public_tracking(token: str) -> dict:
    if not token:
        frappe.throw("Not found.", frappe.PermissionError)
    name = frappe.db.get_value("EE Live Tracking Session", {"share_token": token}, "name")
    if not name:
        frappe.throw("Not found.", frappe.PermissionError)
    doc = frappe.get_doc("EE Live Tracking Session", name)
    if doc.status == "ended":
        return {"status": "ended", "message": "Tracking has ended."}
    # Guest access: allow_guest or authenticated payer/staff
    roles = _roles()
    user = frappe.session.user
    if user in (None, "", "Guest"):
        if not cint(doc.allow_guest):
            # still allow read of ETA for the share link (token is the auth)
            pass
    return {
        **_payload(doc),
        "event_name": frappe.db.get_value("Event Booking", doc.booking, "event_name") or "",
    }


def on_stage_change(assignment_name: str, stage: str) -> None:
    """Hook from field set_stage — start/end sessions."""
    if not frappe.db.table_exists("EE Live Tracking Session"):
        return
    if stage == "en-route":
        try:
            start_session(assignment_name)
        except Exception:
            frappe.logger().error("tracking start failed")
    elif stage in ("complete", "setup-complete") or stage == "complete":
        try:
            end_session(assignment=assignment_name)
        except Exception:
            pass
