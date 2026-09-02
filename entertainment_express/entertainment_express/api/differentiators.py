"""Category differentiators — ops score, live event page, overflow, AI surfaces, entitlements."""

from __future__ import annotations

import json
import secrets

import frappe
from frappe.utils import cint, flt, now_datetime, nowdate

from entertainment_express.api.portal_collaboration import is_booking_member
from entertainment_express.api.portal_owner import OWNER_ROLES

GUEST_ROLE = "EE Event Guest"
PAYER_ROLE = "EE Customer"
STAFF = OWNER_ROLES | {"EE Sales", "EE Dispatcher", "System Manager"}

ENTITLEMENT_KEYS = (
    "diff_copilot",
    "diff_overflow",
    "diff_paas",
    "diff_live_page",
    "diff_ops_score",
    "diff_starter_kits",
)


def _roles() -> set[str]:
    return set(frappe.get_roles() or [])


def _require_staff() -> None:
    roles = _roles()
    if GUEST_ROLE in roles and PAYER_ROLE not in roles:
        frappe.throw("Not allowed.", frappe.PermissionError)
    if not roles.intersection(STAFF):
        frappe.throw("Not allowed.", frappe.PermissionError)


def _feature_flags() -> dict:
    raw = frappe.db.get_single_value("EE Portal Settings", "feature_flags") or "{}"
    try:
        return frappe.parse_json(raw) if isinstance(raw, str) else (raw or {})
    except Exception:
        return {}


def has_entitlement(key: str) -> bool:
    flags = _feature_flags()
    # default allow when unset so early tenants aren't locked out in v1
    if key not in flags:
        return True
    return bool(flags.get(key))


def _require_entitlement(key: str) -> None:
    if not has_entitlement(key):
        frappe.throw("Plan entitlement required.", frappe.PermissionError)


@frappe.whitelist()
def entitlements() -> dict:
    flags = _feature_flags()
    return {k: has_entitlement(k) for k in ENTITLEMENT_KEYS} | {"raw": flags}


@frappe.whitelist()
def compute_ops_score(period_start: str, period_end: str) -> dict:
    _require_staff()
    _require_entitlement("diff_ops_score")
    # Lightweight heuristic from completed vs assigned crew
    total = frappe.db.count("Crew Assignment", {"creation": ["between", [period_start, period_end]]}) or 0
    done = (
        frappe.db.count(
            "Crew Assignment",
            {"creation": ["between", [period_start, period_end]], "status": ["in", ["checked_out", "Done", "complete"]]},
        )
        or 0
    )
    fill = flt((done / total) * 100) if total else 100.0
    on_time = fill  # placeholder until check-in timestamps are richer
    score = flt((on_time * 0.5) + (fill * 0.5))
    doc = frappe.get_doc(
        {
            "doctype": "EE Ops Score",
            "period_start": period_start,
            "period_end": period_end,
            "score": score,
            "on_time_pct": on_time,
            "fill_rate_pct": fill,
            "notes": "Auto-computed",
        }
    )
    doc.insert(ignore_permissions=True)
    return {"name": doc.name, "score": score, "on_time_pct": on_time, "fill_rate_pct": fill}


@frappe.whitelist()
def publish_live_event_page(booking: str, title: str = "", show_votes: int = 1) -> dict:
    _require_staff()
    _require_entitlement("diff_live_page")
    existing = frappe.db.get_value("EE Live Event Page", {"booking": booking}, "name")
    token = secrets.token_urlsafe(16)
    if existing:
        doc = frappe.get_doc("EE Live Event Page", existing)
        doc.published = 1
        if title:
            doc.title = title
        doc.show_votes = 1 if cint(show_votes) else 0
        if not doc.public_token:
            doc.public_token = token
        doc.save(ignore_permissions=True)
    else:
        doc = frappe.get_doc(
            {
                "doctype": "EE Live Event Page",
                "booking": booking,
                "title": title or frappe.db.get_value("Event Booking", booking, "event_name") or booking,
                "published": 1,
                "public_token": token,
                "show_timeline": 1,
                "show_votes": 1 if cint(show_votes) else 0,
                "show_gallery": 1,
            }
        )
        doc.insert(ignore_permissions=True)
    return {
        "name": doc.name,
        "public_token": doc.public_token,
        "url": f"{frappe.utils.get_url()}/live/{doc.public_token}",
    }


@frappe.whitelist(allow_guest=True)
def public_live_event(token: str) -> dict:
    if not token:
        frappe.throw("Not found.", frappe.PermissionError)
    name = frappe.db.get_value("EE Live Event Page", {"public_token": token, "published": 1}, "name")
    if not name:
        frappe.throw("Not found.", frappe.PermissionError)
    doc = frappe.get_doc("EE Live Event Page", name)
    event_name = frappe.db.get_value("Event Booking", doc.booking, "event_name") or ""
    return {
        "title": doc.title or event_name,
        "event_name": event_name,
        "show_timeline": bool(cint(doc.show_timeline)),
        "show_votes": bool(cint(doc.show_votes)),
        "show_gallery": bool(cint(doc.show_gallery)),
        "safety_rules": doc.safety_rules or "",
        # No customer PII on public live page
    }


@frappe.whitelist()
def offer_overflow(
    source_booking: str,
    event_date: str | None = None,
    service_area: str = "",
    vertical_tag: str = "",
    notes_public: str = "",
) -> dict:
    _require_staff()
    _require_entitlement("diff_overflow")
    # Strip anything that looks like email/phone from public notes
    notes = notes_public or ""
    for token in notes.replace(",", " ").split():
        if "@" in token or token.replace("-", "").isdigit() and len(token) >= 7:
            frappe.throw("Public notes cannot include contact details.")
    doc = frappe.get_doc(
        {
            "doctype": "EE Overflow Offer",
            "source_booking": source_booking,
            "status": "open",
            "event_date": event_date or nowdate(),
            "service_area": service_area,
            "vertical_tag": vertical_tag,
            "notes_public": notes[:500],
        }
    )
    doc.insert(ignore_permissions=True)
    return {"name": doc.name, "status": "open"}


@frappe.whitelist()
def list_overflow_offers() -> list:
    _require_staff()
    _require_entitlement("diff_overflow")
    return frappe.get_all(
        "EE Overflow Offer",
        filters={"status": "open"},
        fields=["name", "event_date", "service_area", "vertical_tag", "notes_public", "status"],
        order_by="event_date asc",
        limit=100,
    )


@frappe.whitelist()
def claim_overflow(offer: str) -> dict:
    _require_staff()
    _require_entitlement("diff_overflow")
    doc = frappe.get_doc("EE Overflow Offer", offer)
    if doc.status != "open":
        frappe.throw("Offer not available.", frappe.ValidationError)
    doc.status = "claimed"
    doc.claimed_by_tenant = frappe.local.site
    doc.claimed_at = now_datetime()
    doc.save(ignore_permissions=True)
    return {"name": doc.name, "status": "claimed", "next": "Obtain customer consent before sharing PII."}


@frappe.whitelist()
def event_day_copilot(booking: str) -> dict:
    """Suggest checklist nudges — confirm before any money action."""
    _require_staff()
    _require_entitlement("diff_copilot")
    if not booking:
        frappe.throw("Booking required.")
    suggestions = [
        {"id": "confirm_crew", "text": "Confirm all crew checked in", "money": False},
        {"id": "weather", "text": "Review weather status if outdoor", "money": False},
        {"id": "balance", "text": "Collect remaining balance — confirm with customer first", "money": True},
    ]
    return {"booking": booking, "suggestions": suggestions, "confirm_before_money": True}


@frappe.whitelist()
def demand_nudges() -> list:
    _require_staff()
    _require_entitlement("diff_copilot")
    return [
        {"id": "weekday_promo", "text": "Weekday inquiry volume is soft — consider a midweek package nudge", "money": False},
        {"id": "review_ask", "text": "Events completed last week without a review ask", "money": False},
    ]


@frappe.whitelist()
def starter_kits() -> list:
    _require_staff()
    _require_entitlement("diff_starter_kits")
    return [
        {"id": "wedding_dj", "label": "Wedding DJ starter", "packages": ["Ceremony", "Reception"]},
        {"id": "photo_booth", "label": "Photo booth starter", "packages": ["2hr Booth", "Prints"]},
        {"id": "school_dance", "label": "School dance starter", "packages": ["DJ + Lighting"]},
    ]


@frappe.whitelist()
def paas_webhook_catalog() -> dict:
    _require_staff()
    _require_entitlement("diff_paas")
    return {
        "webhooks": [
            {"event": "booking.confirmed", "payload": ["booking", "event_date", "status"]},
            {"event": "payment.received", "payload": ["invoice", "amount", "currency"]},
            {"event": "crew.checked_in", "payload": ["assignment", "booking"]},
        ],
        "docs": "/docs/paas",
    }
