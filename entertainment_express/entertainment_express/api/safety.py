"""Safety compliance ops — inspection certs, sanitization logs, attendee waiver QR."""

from __future__ import annotations

import hashlib
import secrets

import frappe
from frappe.utils import cint, getdate, now_datetime, nowdate

from entertainment_express.api.portal_owner import OWNER_ROLES

STAFF = OWNER_ROLES | {"EE Sales", "EE Dispatcher", "EE Accounting", "System Manager", "EE Office"}
FIELD = STAFF | {"EE Crew", "EE Entertainer"}
GUEST_ROLE = "EE Event Guest"
PAYER_ROLE = "EE Customer"


def _require_staff() -> None:
    roles = set(frappe.get_roles() or [])
    if GUEST_ROLE in roles and PAYER_ROLE not in roles:
        frappe.throw("Not allowed.", frappe.PermissionError)
    if not roles.intersection(STAFF):
        frappe.throw("Not allowed.", frappe.PermissionError)


def _require_field() -> None:
    roles = set(frappe.get_roles() or [])
    if not roles.intersection(FIELD):
        frappe.throw("Not allowed.", frappe.PermissionError)


def inspection_block_reason(asset_name: str, on_date=None) -> str | None:
    """Return reason if a required inspection cert is missing/expired."""
    if not frappe.db.table_exists("EE Asset Inspection Certificate"):
        return None
    on_date = getdate(on_date or nowdate())
    rows = frappe.get_all(
        "EE Asset Inspection Certificate",
        filters={"asset": asset_name, "required_to_book": 1},
        fields=["name", "expires_on", "certificate_no", "authority"],
        limit_page_length=20,
    )
    if not rows:
        return None
    # Need at least one non-expired required cert
    for row in rows:
        if row.expires_on and getdate(row.expires_on) >= on_date:
            return None
    # All required certs expired (or none dated)
    latest = rows[0]
    return (
        f"Inspection certificate expired"
        + (f" ({latest.certificate_no})" if latest.certificate_no else "")
        + f" for asset {asset_name}"
    )


def sanitization_block_reason(asset_name: str) -> str | None:
    """Optional gate: require sanitization log after last completed booking."""
    if not cint(frappe.db.get_value("Service Asset", asset_name, "require_sanitization_before_book")):
        return None
    if not frappe.db.table_exists("EE Sanitization Log"):
        return None
    last_booking = frappe.db.get_value(
        "Event Booking Asset",
        {"asset": asset_name},
        "parent",
        order_by="modified desc",
    )
    # Prefer last completed booking date
    last_completed = frappe.db.sql(
        """
        SELECT eb.name, eb.event_date
        FROM `tabEvent Booking` eb
        INNER JOIN `tabEvent Booking Asset` eba ON eba.parent = eb.name
        WHERE eba.asset = %s AND eb.status IN ('completed', 'in_progress')
        ORDER BY eb.event_date DESC
        LIMIT 1
        """,
        (asset_name,),
        as_dict=True,
    )
    if not last_completed:
        return None
    booking_name = last_completed[0].name
    log = frappe.db.exists(
        "EE Sanitization Log",
        {"asset": asset_name, "booking": booking_name},
    )
    if log:
        return None
    # Any sanitization after that event date is also OK
    event_date = last_completed[0].event_date
    later = frappe.db.sql(
        """
        SELECT name FROM `tabEE Sanitization Log`
        WHERE asset = %s AND cleaned_at >= %s
        LIMIT 1
        """,
        (asset_name, str(event_date)),
    )
    if later:
        return None
    return f"Sanitization required for asset {asset_name} after booking {booking_name}"


@frappe.whitelist()
def list_certificates(asset: str | None = None) -> list[dict]:
    _require_staff()
    if not frappe.db.table_exists("EE Asset Inspection Certificate"):
        return []
    filters = {}
    if asset:
        filters["asset"] = asset
    rows = []
    today = getdate(nowdate())
    for row in frappe.get_all(
        "EE Asset Inspection Certificate",
        filters=filters,
        fields=["name", "asset", "authority", "certificate_no", "expires_on", "required_to_book", "file"],
        order_by="expires_on asc",
        limit_page_length=100,
    ):
        expired = bool(row.expires_on and getdate(row.expires_on) < today)
        rows.append(
            {
                "id": row.name,
                "asset": row.asset,
                "asset_name": frappe.db.get_value("Service Asset", row.asset, "asset_name") or row.asset,
                "authority": row.authority or "",
                "certificate_no": row.certificate_no or "",
                "expires_on": str(row.expires_on or ""),
                "required_to_book": cint(row.required_to_book),
                "file": row.file or "",
                "expired": expired,
            }
        )
    return rows


@frappe.whitelist()
def save_certificate(values: dict | str | None = None, name: str | None = None) -> dict:
    _require_staff()
    if isinstance(values, str):
        values = frappe.parse_json(values) or {}
    values = values or {}
    payload = {
        "asset": values.get("asset"),
        "authority": values.get("authority") or "",
        "certificate_no": values.get("certificate_no") or values.get("number") or "",
        "expires_on": values.get("expires_on") or values.get("expires"),
        "required_to_book": 1 if cint(values.get("required_to_book", 1)) else 0,
        "file": values.get("file") or "",
        "notes": values.get("notes") or "",
    }
    if not payload["asset"]:
        frappe.throw("Asset is required.")
    if not payload["expires_on"]:
        frappe.throw("Expiry date is required.")
    if name:
        doc = frappe.get_doc("EE Asset Inspection Certificate", name)
        doc.update(payload)
        doc.save()
    else:
        doc = frappe.get_doc({"doctype": "EE Asset Inspection Certificate", **payload})
        doc.insert()
    return {"id": doc.name}


@frappe.whitelist()
def list_sanitization(asset: str | None = None, booking: str | None = None) -> list[dict]:
    _require_field()
    if not frappe.db.table_exists("EE Sanitization Log"):
        return []
    filters = {}
    if asset:
        filters["asset"] = asset
    if booking:
        filters["booking"] = booking
    rows = []
    for row in frappe.get_all(
        "EE Sanitization Log",
        filters=filters,
        fields=["name", "asset", "booking", "cleaned_by", "cleaned_at", "method", "photos"],
        order_by="cleaned_at desc",
        limit_page_length=50,
    ):
        rows.append(
            {
                "id": row.name,
                "asset": row.asset,
                "booking": row.booking or "",
                "cleaned_by": row.cleaned_by or "",
                "cleaned_at": str(row.cleaned_at or ""),
                "method": row.method or "",
                "photos": row.photos or "",
            }
        )
    return rows


@frappe.whitelist()
def log_sanitization(values: dict | str | None = None) -> dict:
    _require_field()
    if isinstance(values, str):
        values = frappe.parse_json(values) or {}
    values = values or {}
    asset = values.get("asset")
    if not asset:
        frappe.throw("Asset is required.")
    doc = frappe.get_doc(
        {
            "doctype": "EE Sanitization Log",
            "asset": asset,
            "booking": values.get("booking") or None,
            "cleaned_by": frappe.session.user,
            "cleaned_at": values.get("cleaned_at") or now_datetime(),
            "method": values.get("method") or "standard",
            "photos": values.get("photos") or "",
            "notes": values.get("notes") or "",
        }
    )
    doc.insert(ignore_permissions=True)
    return {"id": doc.name, "cleaned_at": str(doc.cleaned_at)}


@frappe.whitelist()
def issue_attendee_waiver(booking: str, template: str | None = None) -> dict:
    """Create pending attendee waiver with public token for QR."""
    _require_field()
    token = secrets.token_urlsafe(24)
    payload = {
        "doctype": "EE Waiver",
        "booking": booking,
        "template": template,
        "waiver_kind": "attendee",
        "status": "pending",
        "public_token": token,
    }
    doc = frappe.get_doc(payload)
    doc.insert(ignore_permissions=True)
    url = f"{frappe.utils.get_url()}/w/{token}"
    return {"id": doc.name, "token": token, "url": url}


@frappe.whitelist()
def attendee_waiver_qr(booking: str) -> dict:
    """Return existing open attendee waiver URL or issue a new one."""
    _require_field()
    existing = frappe.db.get_value(
        "EE Waiver",
        {"booking": booking, "waiver_kind": "attendee", "status": "pending"},
        ["name", "public_token"],
        as_dict=True,
    )
    if existing and existing.public_token:
        return {
            "id": existing.name,
            "token": existing.public_token,
            "url": f"{frappe.utils.get_url()}/w/{existing.public_token}",
        }
    return issue_attendee_waiver(booking)


@frappe.whitelist(allow_guest=True)
def get_attendee_waiver(token: str) -> dict:
    """Public QR page payload — attendee waivers only."""
    if not token:
        frappe.throw("Invalid link.", frappe.PermissionError)
    name = frappe.db.get_value("EE Waiver", {"public_token": token, "waiver_kind": "attendee"}, "name")
    if not name:
        frappe.throw("Waiver not found.", frappe.PermissionError)
    doc = frappe.get_doc("EE Waiver", name)
    title = body = ""
    if doc.template:
        title = frappe.db.get_value("EE Waiver Template", doc.template, "title") or "Attendee Waiver"
        body = frappe.db.get_value("EE Waiver Template", doc.template, "body") or ""
    else:
        title = "Attendee Waiver"
    event = frappe.db.get_value("Event Booking", doc.booking, "event_name") or doc.booking
    return {
        "id": doc.name,
        "token": token,
        "title": title,
        "body": body,
        "status": doc.status,
        "event": event,
        "can_sign": doc.status == "pending",
        "waiver_kind": "attendee",
    }


@frappe.whitelist(allow_guest=True)
def sign_attendee_waiver(token: str, signer_name: str, signer_email: str | None = None) -> dict:
    """Guest/attendee sign — never grants payment rights."""
    if not token:
        frappe.throw("Invalid link.", frappe.PermissionError)
    name = frappe.db.get_value("EE Waiver", {"public_token": token, "waiver_kind": "attendee"}, "name")
    if not name:
        frappe.throw("Waiver not found.", frappe.PermissionError)
    doc = frappe.get_doc("EE Waiver", name)
    if getattr(doc, "waiver_kind", None) != "attendee":
        frappe.throw("Only attendee waivers can be signed here.", frappe.PermissionError)
    if doc.status == "signed":
        return {"ok": True, "status": "signed", "already": True}
    signer_name = (signer_name or "").strip()
    if not signer_name:
        frappe.throw("Name is required.")
    ip = ""
    try:
        ip = getattr(frappe.local, "request_ip", None) or ""
    except Exception:
        ip = ""
    stamp = str(now_datetime())
    doc.status = "signed"
    doc.signer_name = signer_name[:140]
    doc.signer_email = (signer_email or frappe.session.user or "guest")[:140]
    doc.signed_at = now_datetime()
    doc.signer_ip = str(ip)[:40]
    doc.signature_hash = hashlib.sha256(f"{name}:{signer_name}:{stamp}:{ip}".encode()).hexdigest()[:40]
    doc.save(ignore_permissions=True)
    return {"ok": True, "status": "signed", "signed_at": str(doc.signed_at)}


@frappe.whitelist()
def safety_overview() -> dict:
    """Owner Coverage/Safety workspace aggregate."""
    _require_staff()
    certs = list_certificates()
    today = getdate(nowdate())
    expiring = [c for c in certs if c["expires_on"] and getdate(c["expires_on"]) <= today]
    return {
        "certificates": certs[:40],
        "expired_or_due": expiring[:20],
        "sanitization": list_sanitization()[:20],
    }
