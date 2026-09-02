"""Site-fit evaluation: area, surface, power, clearance, water vs item requirements."""

from __future__ import annotations

import frappe
from frappe.utils import cint, flt

from entertainment_express.api.portal_owner import OWNER_ROLES

STAFF = OWNER_ROLES | {"EE Sales", "EE Dispatcher", "EE Accounting", "System Manager", "EE Office"}
GUEST_ROLE = "EE Event Guest"
PAYER_ROLE = "EE Customer"
SURFACES = {"lawn", "concrete", "asphalt", "indoor", "other"}


def _require_staff() -> None:
    roles = set(frappe.get_roles() or [])
    if GUEST_ROLE in roles and PAYER_ROLE not in roles:
        frappe.throw("Not allowed.", frappe.PermissionError)
    if not roles.intersection(STAFF):
        frappe.throw("Not allowed.", frappe.PermissionError)


def _deny_guest() -> None:
    roles = set(frappe.get_roles() or [])
    if GUEST_ROLE in roles and PAYER_ROLE not in roles:
        frappe.throw("Only the host can do this.", frappe.PermissionError)


def _require_payer_or_staff() -> None:
    roles = set(frappe.get_roles() or [])
    if GUEST_ROLE in roles and PAYER_ROLE not in roles:
        frappe.throw("Only the host can do this.", frappe.PermissionError)
    if PAYER_ROLE not in roles and not roles.intersection(STAFF):
        frappe.throw("Not allowed.", frappe.PermissionError)


def _config() -> dict:
    try:
        doc = frappe.get_single("EE Booking Site Config")
        return {
            "enabled": cint(getattr(doc, "enabled", 1)),
            "unfit_action": getattr(doc, "unfit_action", None) or "warn",
            "overweight_action": getattr(doc, "overweight_action", None) or "warn",
            "require_client_site_answers": cint(getattr(doc, "require_client_site_answers", 1)),
        }
    except Exception:
        return {
            "enabled": 1,
            "unfit_action": "warn",
            "overweight_action": "warn",
            "require_client_site_answers": 1,
        }


@frappe.whitelist()
def get_config() -> dict:
    _require_staff()
    return _config()


@frappe.whitelist()
def save_config(values: dict | str | None = None) -> dict:
    _require_staff()
    if isinstance(values, str):
        values = frappe.parse_json(values) or {}
    values = values or {}
    doc = frappe.get_single("EE Booking Site Config")
    for key in ("enabled", "unfit_action", "overweight_action", "require_client_site_answers"):
        if key in values:
            setattr(doc, key, values[key])
    if getattr(doc, "unfit_action", None) not in ("warn", "block"):
        doc.unfit_action = "warn"
    if getattr(doc, "overweight_action", None) not in ("warn", "block"):
        doc.overweight_action = "warn"
    doc.save(ignore_permissions=True)
    return _config()


def _parse_surfaces(raw) -> set[str]:
    if not raw:
        return set()
    if isinstance(raw, (list, tuple, set)):
        return {str(s).strip().lower() for s in raw if str(s).strip()}
    return {p.strip().lower() for p in str(raw).replace(";", ",").split(",") if p.strip()}


def _item_requirements(item_code: str) -> list[dict]:
    if not item_code:
        return []
    rows = []
    # Child table via custom field
    try:
        item = frappe.get_doc("Item", item_code)
        for row in getattr(item, "ee_site_fit_requirements", None) or []:
            rows.append(
                {
                    "item": item_code,
                    "min_sq_ft": flt(getattr(row, "min_sq_ft", 0)),
                    "surfaces": _parse_surfaces(getattr(row, "surfaces", None)),
                    "power_amps": flt(getattr(row, "power_amps", 0)),
                    "clearance_ft": flt(getattr(row, "clearance_ft", 0)),
                    "water_required": cint(getattr(row, "water_required", 0)),
                    "fulfillment_mode": getattr(item, "ee_fulfillment_mode", None) or "attended",
                }
            )
    except Exception:
        pass
    return rows


def _answers_from_booking(booking) -> dict:
    answers = {
        "sq_ft": flt(getattr(booking, "site_sq_ft", 0) or 0),
        "surface": (getattr(booking, "site_surface", None) or "").strip().lower(),
        "power_amps": flt(getattr(booking, "site_power_amps", 0) or 0),
        "clearance_ft": flt(getattr(booking, "site_clearance_ft", 0) or 0),
        "water_available": cint(getattr(booking, "site_water_available", 0)),
    }
    # Fill gaps from venue
    if getattr(booking, "venue", None) and frappe.db.exists("EE Venue", booking.venue):
        venue = frappe.get_doc("EE Venue", booking.venue)
        if not answers["sq_ft"]:
            answers["sq_ft"] = flt(getattr(venue, "usable_sq_ft", 0) or 0)
        if not answers["surface"]:
            answers["surface"] = (getattr(venue, "surface", None) or "").strip().lower()
        if not answers["power_amps"]:
            answers["power_amps"] = flt(getattr(venue, "power_amps", 0) or 0)
        if not answers["clearance_ft"]:
            answers["clearance_ft"] = flt(getattr(venue, "clearance_ft", 0) or 0)
        if not answers["water_available"]:
            answers["water_available"] = cint(getattr(venue, "water_available", 0))
    return answers


def evaluate_site_fit(booking_name: str | None = None, booking=None, answers: dict | None = None) -> dict:
    """
    Compare booking/venue/client answers to item site-fit requirements.
    Returns status ok|warn|block plus unmet list. Never cancels a booking.
    """
    cfg = _config()
    if not cfg.get("enabled"):
        return {"status": "ok", "unmet": [], "action": "warn", "enabled": False}

    if booking is None:
        booking = frappe.get_doc("Event Booking", booking_name)
    site = answers or _answers_from_booking(booking)

    reqs = []
    for row in getattr(booking, "service_items", None) or []:
        item = getattr(row, "item", None) or getattr(row, "item_code", None)
        reqs.extend(_item_requirements(item))

    unmet = []
    for req in reqs:
        if req["min_sq_ft"] and site["sq_ft"] and site["sq_ft"] < req["min_sq_ft"]:
            unmet.append({"item": req["item"], "field": "sq_ft", "needed": req["min_sq_ft"], "have": site["sq_ft"]})
        if req["min_sq_ft"] and not site["sq_ft"]:
            unmet.append({"item": req["item"], "field": "sq_ft", "needed": req["min_sq_ft"], "have": None})
        if req["surfaces"] and site["surface"] and site["surface"] not in req["surfaces"]:
            unmet.append(
                {
                    "item": req["item"],
                    "field": "surface",
                    "needed": sorted(req["surfaces"]),
                    "have": site["surface"],
                }
            )
        if req["surfaces"] and not site["surface"]:
            unmet.append({"item": req["item"], "field": "surface", "needed": sorted(req["surfaces"]), "have": None})
        if req["power_amps"] and site["power_amps"] < req["power_amps"]:
            unmet.append(
                {"item": req["item"], "field": "power_amps", "needed": req["power_amps"], "have": site["power_amps"]}
            )
        if req["clearance_ft"] and site["clearance_ft"] and site["clearance_ft"] < req["clearance_ft"]:
            unmet.append(
                {
                    "item": req["item"],
                    "field": "clearance_ft",
                    "needed": req["clearance_ft"],
                    "have": site["clearance_ft"],
                }
            )
        if req["clearance_ft"] and not site["clearance_ft"]:
            unmet.append({"item": req["item"], "field": "clearance_ft", "needed": req["clearance_ft"], "have": None})
        if req["water_required"] and not site["water_available"]:
            unmet.append({"item": req["item"], "field": "water", "needed": True, "have": False})

    action = cfg.get("unfit_action") or "warn"
    if not unmet:
        status = "ok"
    elif action == "block":
        status = "block"
    else:
        status = "warn"

    return {
        "status": status,
        "unmet": unmet,
        "action": action,
        "answers": site,
        "enabled": True,
    }


def fulfillment_crew_required(booking) -> dict:
    """Attended items need crew; drop_off/self_serve skip attendant unless other roles listed."""
    modes = []
    requires_crew = False
    for row in getattr(booking, "service_items", None) or []:
        item = getattr(row, "item", None) or getattr(row, "item_code", None)
        if not item:
            continue
        mode = frappe.db.get_value("Item", item, "ee_fulfillment_mode") or "attended"
        modes.append({"item": item, "mode": mode})
        if mode == "attended":
            requires_crew = True
        elif mode == "drop_off":
            # Other explicit crew roles still apply via ee_requires_crew_role
            role = frappe.db.get_value("Item", item, "ee_requires_crew_role")
            if role:
                requires_crew = True
        # self_serve: no attendant by default
    return {"requires_crew": requires_crew, "modes": modes}


@frappe.whitelist()
def evaluate(booking: str) -> dict:
    _require_staff()
    result = evaluate_site_fit(booking_name=booking)
    try:
        frappe.db.set_value("Event Booking", booking, "site_fit_status", result["status"])
    except Exception:
        pass
    return result


@frappe.whitelist()
def booking_logistics(booking: str) -> dict:
    """Owner/employee payload: windows + site fit + fulfillment."""
    _require_staff()
    doc = frappe.get_doc("Event Booking", booking)
    fit = evaluate_site_fit(booking=doc)
    crew = fulfillment_crew_required(doc)
    return {
        "booking": booking,
        "delivery_window_start": str(getattr(doc, "delivery_window_start", None) or ""),
        "delivery_window_end": str(getattr(doc, "delivery_window_end", None) or ""),
        "pickup_window_start": str(getattr(doc, "pickup_window_start", None) or ""),
        "pickup_window_end": str(getattr(doc, "pickup_window_end", None) or ""),
        "site_fit": fit,
        "fulfillment": crew,
        "site_answers": {
            "site_sq_ft": flt(getattr(doc, "site_sq_ft", 0) or 0),
            "site_surface": getattr(doc, "site_surface", None) or "",
            "site_power_amps": flt(getattr(doc, "site_power_amps", 0) or 0),
            "site_clearance_ft": flt(getattr(doc, "site_clearance_ft", 0) or 0),
            "site_water_available": cint(getattr(doc, "site_water_available", 0)),
        },
    }


@frappe.whitelist()
def save_windows(booking: str, values: dict | str | None = None) -> dict:
    _require_staff()
    if isinstance(values, str):
        values = frappe.parse_json(values) or {}
    values = values or {}
    doc = frappe.get_doc("Event Booking", booking)
    for key in (
        "delivery_window_start",
        "delivery_window_end",
        "pickup_window_start",
        "pickup_window_end",
    ):
        if key in values:
            setattr(doc, key, values.get(key) or None)
    doc.save(ignore_permissions=True)
    return booking_logistics(booking)


@frappe.whitelist()
def save_site_answers(booking: str, values: dict | str | None = None) -> dict:
    """Client or staff site questionnaire."""
    _require_payer_or_staff()
    if isinstance(values, str):
        values = frappe.parse_json(values) or {}
    values = values or {}
    doc = frappe.get_doc("Event Booking", booking)
    mapping = {
        "site_sq_ft": "site_sq_ft",
        "sq_ft": "site_sq_ft",
        "site_surface": "site_surface",
        "surface": "site_surface",
        "site_power_amps": "site_power_amps",
        "power_amps": "site_power_amps",
        "site_clearance_ft": "site_clearance_ft",
        "clearance_ft": "site_clearance_ft",
        "site_water_available": "site_water_available",
        "water_available": "site_water_available",
    }
    for src, dest in mapping.items():
        if src in values:
            setattr(doc, dest, values[src])
    fit = evaluate_site_fit(booking=doc)
    doc.site_fit_status = fit["status"]
    if fit["status"] == "block" and (_config().get("unfit_action") == "block"):
        # Persist status but do not auto-cancel; callers gate confirm/book
        pass
    doc.save(ignore_permissions=True)
    return {"booking": booking, "site_fit": fit}


@frappe.whitelist()
def client_site_form(booking: str) -> dict:
    """Questions for customer portal when config requires answers."""
    _require_payer_or_staff()
    cfg = _config()
    doc = frappe.get_doc("Event Booking", booking)
    reqs = []
    for row in getattr(doc, "service_items", None) or []:
        item = getattr(row, "item", None)
        reqs.extend(_item_requirements(item))
    needed = bool(reqs) and bool(cfg.get("require_client_site_answers"))
    return {
        "required": needed,
        "enabled": bool(cfg.get("enabled")),
        "answers": {
            "site_sq_ft": flt(getattr(doc, "site_sq_ft", 0) or 0),
            "site_surface": getattr(doc, "site_surface", None) or "",
            "site_power_amps": flt(getattr(doc, "site_power_amps", 0) or 0),
            "site_clearance_ft": flt(getattr(doc, "site_clearance_ft", 0) or 0),
            "site_water_available": cint(getattr(doc, "site_water_available", 0)),
        },
        "site_fit": evaluate_site_fit(booking=doc) if needed else {"status": "ok", "unmet": []},
        "surfaces": sorted(SURFACES),
    }


@frappe.whitelist()
def confirm_allowed(booking: str) -> dict:
    """Gate instant book / confirm when site unfit under block policy; attended needs crew."""
    _require_staff()
    doc = frappe.get_doc("Event Booking", booking)
    fit = evaluate_site_fit(booking=doc)
    crew = fulfillment_crew_required(doc)
    if fit["status"] == "block":
        return {
            "allowed": False,
            "reason": "site_fit",
            "message": "Site does not meet item requirements.",
            "site_fit": fit,
            "fulfillment": crew,
        }
    return {"allowed": True, "site_fit": fit, "fulfillment": crew, "warn": fit["status"] == "warn"}
