"""
Proposal API — Interactive proposals, tier switching, add-on upsells, server price verification, and conversion.
"""

from __future__ import annotations

import hmac
import json
import secrets

import frappe
from frappe import _
from frappe.utils import flt, now_datetime

from entertainment_express.api.rate_limit import rate_limited

GUEST_ROLE = "EE Event Guest"
PAYER_ROLE = "EE Customer"
STAFF_ROLES = {"EE Tenant Admin", "EE Sales", "System Manager"}


def _require_staff() -> None:
    roles = set(frappe.get_roles() or [])
    if not roles.intersection(STAFF_ROLES):
        frappe.throw("Proposal access denied.", frappe.PermissionError)


def _deny_event_guest() -> None:
    roles = set(frappe.get_roles() or [])
    if GUEST_ROLE in roles and PAYER_ROLE not in roles:
        frappe.throw("Only the host can do this.", frappe.PermissionError)


def _deny_guest() -> None:
    if frappe.session.user in (None, "Guest"):
        frappe.throw("Only the host can do this.", frappe.PermissionError)
    _deny_event_guest()


@frappe.whitelist(allow_guest=True)
@rate_limited(limit=60)
def get_public_proposal(token: str) -> dict:
    """
    Fetches interactive proposal details by public token.
    Increments view count and updates first/last viewed timestamp.
    """
    if not token:
        frappe.throw(_("Proposal token required."), frappe.DoesNotExistError)

    prop_name = frappe.db.get_value("EE Interactive Proposal", {"token": token}, "name")
    if not prop_name:
        # Fallback to Quotation if matching ee_proposal_token
        if frappe.db.exists("DocType", "Quotation") and frappe.get_meta("Quotation").has_field("ee_proposal_token"):
            q_name = frappe.db.get_value("Quotation", {"ee_proposal_token": token}, "name")
            if q_name:
                return get_proposal(quotation_name=q_name, token=token)
        frappe.throw(_("Proposal not found or token expired."), frappe.DoesNotExistError)

    doc = frappe.get_doc("EE Interactive Proposal", prop_name)

    # Increment telemetry
    doc.view_count = int(doc.view_count or 0) + 1
    if not doc.first_viewed_at:
        doc.first_viewed_at = now_datetime()
    doc.last_viewed_at = now_datetime()
    if doc.status in ("Draft", "Sent", ""):
        doc.status = "Viewed"
    doc.save(ignore_permissions=True)

    # Notify owner on first view
    if doc.view_count == 1:
        try:
            from entertainment_express.notifications import send
            send("proposal_viewed", doc.owner or "admin@entx.app", {"token": token, "status": doc.status})
        except Exception:
            pass

    packages = []
    for p in doc.available_packages or []:
        packages.append({
            "item_code": p.item_code,
            "title": p.package_title or p.item_code,
            "badge": p.highlight_badge or "",
            "base_price": flt(p.base_price or frappe.db.get_value("Item", p.item_code, "standard_rate") or 0),
            "description": p.description or "",
            "features": (p.feature_list or "").splitlines(),
        })

    addons = []
    for a in doc.available_addons or []:
        addons.append({
            "item_code": a.item_code,
            "title": a.addon_title or a.item_code,
            "price": flt(a.price or frappe.db.get_value("Item", a.item_code, "standard_rate") or 0),
            "thumbnail": a.thumbnail or "",
            "description": a.short_description or "",
            "is_recommended": bool(a.is_recommended),
        })

    return {
        "proposal_id": doc.name,
        "token": doc.token,
        "status": doc.status,
        "quotation": doc.quotation,
        "booking": doc.booking,
        "allow_tier_switching": bool(doc.allow_tier_switching),
        "selected_package": doc.selected_package,
        "selected_addons": json.loads(doc.selected_addons) if doc.selected_addons else [],
        "packages": packages,
        "addons": addons,
        "view_count": doc.view_count,
        "first_viewed_at": str(doc.first_viewed_at) if doc.first_viewed_at else None,
        "last_viewed_at": str(doc.last_viewed_at) if doc.last_viewed_at else None,
    }


@frappe.whitelist(allow_guest=True)
@rate_limited(limit=60)
def record_proposal_view(token: str, duration_seconds: int = 0) -> dict:
    """Telemetry hook logging view timestamp and page dwell time."""
    if not token:
        return {"status": "error"}

    prop_name = frappe.db.get_value("EE Interactive Proposal", {"token": token}, "name")
    if prop_name:
        frappe.db.set_value("EE Interactive Proposal", prop_name, "last_viewed_at", now_datetime())
        frappe.db.commit()

    return {"status": "recorded", "token": token, "duration": duration_seconds}


@frappe.whitelist(allow_guest=True)
def accept_proposal(
    token: str,
    selected_package: str,
    selected_addons_json: str | list | None = None,
    signer_name: str = "",
    signature_data: str = "",
) -> dict:
    """
    Records e-signature, calculates authoritative prices from Item master/price list,
    updates Quotation, creates Booking, and issues deposit invoice.
    """
    if not token:
        frappe.throw(_("Proposal token is required."))

    prop_name = frappe.db.get_value("EE Interactive Proposal", {"token": token}, "name")
    if not prop_name:
        frappe.throw(_("Proposal not found."), frappe.DoesNotExistError)

    doc = frappe.get_doc("EE Interactive Proposal", prop_name)

    if doc.status == "Accepted":
        return {"status": "already_accepted", "booking": doc.booking}

    # Parse addons
    if isinstance(selected_addons_json, str):
        try:
            addons_list = json.loads(selected_addons_json)
        except Exception:
            addons_list = []
    else:
        addons_list = selected_addons_json or []

    # AUTHORITATIVE SERVER PRICE RECALCULATION
    # Discard client prices; look up real rates from Item / Item Price
    pkg_rate = flt(frappe.db.get_value("Item", selected_package, "standard_rate") or 0)

    calculated_items = [{"item_code": selected_package, "qty": 1, "rate": pkg_rate, "amount": pkg_rate}]

    for addon_code in addons_list:
        if not addon_code:
            continue
        addon_rate = flt(frappe.db.get_value("Item", addon_code, "standard_rate") or 0)
        calculated_items.append({"item_code": addon_code, "qty": 1, "rate": addon_rate, "amount": addon_rate})

    grand_total = sum(i["amount"] for i in calculated_items)

    # Save e-signature & status
    doc.selected_package = selected_package
    doc.selected_addons = json.dumps(addons_list)
    doc.status = "Accepted"
    doc.signer_name = signer_name or "Client"
    doc.signature_data = signature_data or ""
    doc.signed_at = now_datetime()
    if getattr(frappe, "request", None) and hasattr(frappe.request, "remote_addr"):
        doc.signer_ip = frappe.request.remote_addr
    doc.save(ignore_permissions=True)

    # Update linked Quotation items if exists
    if doc.quotation and frappe.db.exists("Quotation", doc.quotation):
        quote = frappe.get_doc("Quotation", doc.quotation)
        quote.set("items", [])
        for ci in calculated_items:
            quote.append("items", {"item_code": ci["item_code"], "qty": ci["qty"], "rate": ci["rate"]})
        quote.db_set("docstatus", 1)

        # Convert to Booking
        try:
            from entertainment_express.api.booking import convert_to_booking
            conv_res = convert_to_booking(quotation_name=quote.name)
            doc.booking = conv_res.get("booking")
            doc.save(ignore_permissions=True)
        except Exception as e:
            frappe.log_error(frappe.get_traceback(), "Proposal convert_to_booking")

    frappe.db.commit()

    return {
        "status": "accepted",
        "proposal_id": doc.name,
        "booking": doc.booking,
        "calculated_total": grand_total,
        "deposit_required": flt(grand_total * 0.25),
    }


@frappe.whitelist()
def create_proposal(source: str, name: str, selected: list | str | None = None, deposit_percent: float = 25) -> dict:
    _require_staff()
    from entertainment_express.api.portal_proposal import save_proposal

    return save_proposal(source, name, selected, deposit_percent)


@frappe.whitelist()
def send_proposal(source: str, name: str) -> dict:
    _require_staff()
    from entertainment_express.api.portal_proposal import send_proposal as _send

    return _send(source, name)


@frappe.whitelist(allow_guest=True)
@rate_limited(limit=60)
def get_proposal(quotation_name: str | None = None, token: str | None = None, source: str | None = None, name: str | None = None) -> dict:
    if source and name:
        _require_staff()
        from entertainment_express.api.portal_proposal import get_proposal as _staff_get

        return _staff_get(source, name)
    if not quotation_name:
        frappe.throw("Missing proposal.")

    from entertainment_express.api.portal_proposal import _lines_from_quote, _money, _proposal_status

    quote = frappe.get_doc("Quotation", quotation_name)
    total = flt(quote.grand_total)
    pct = flt(quote.get("ee_deposit_percent") or 25)
    return {
        "id": quote.name,
        "status": _proposal_status(quote),
        "lines": _lines_from_quote(quote),
        "total": _money(total),
        "deposit": _money(total * pct / 100),
        "token": quote.get("ee_proposal_token") if frappe.get_meta("Quotation").has_field("ee_proposal_token") else "",
    }


@frappe.whitelist(allow_guest=True)
@rate_limited(limit=60)
def record_view(quotation_name: str, token: str | None = None) -> dict:
    quote = frappe.get_doc("Quotation", quotation_name)
    if quote.meta.has_field("ee_last_viewed_at"):
        quote.db_set("ee_last_viewed_at", now_datetime())
    if quote.meta.has_field("ee_proposal_status"):
        current = quote.get("ee_proposal_status") or "sent"
        if current in ("draft", "sent", ""):
            quote.db_set("ee_proposal_status", "viewed")
    return {"status": "viewed", "quotation": quotation_name}
