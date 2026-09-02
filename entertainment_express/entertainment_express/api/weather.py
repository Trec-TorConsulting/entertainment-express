"""Weather / outdoor risk API — policy, forecast refresh, rain-date offers."""

from __future__ import annotations

from datetime import datetime, timedelta

import frappe
from frappe.utils import cint, flt, get_datetime, now_datetime

from entertainment_express.api.portal_owner import OWNER_ROLES
from entertainment_express.white_label.urls import absolute_url

STAFF = OWNER_ROLES | {"EE Sales", "EE Dispatcher", "EE Accounting", "System Manager", "EE Office"}
GUEST_ROLE = "EE Event Guest"
PAYER_ROLE = "EE Customer"
WATCH_RATIO = 0.8


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


def _require_payer() -> None:
    _deny_guest()
    roles = set(frappe.get_roles() or [])
    if PAYER_ROLE not in roles and not roles.intersection(OWNER_ROLES):
        frappe.throw("Not allowed.", frappe.PermissionError)


def _notify(key: str, email: str, ctx: dict) -> None:
    if not email:
        return
    try:
        _ensure_weather_templates()
        from entertainment_express.notifications import send

        send(key, email, ctx)
    except Exception:
        frappe.logger().error("weather notify failed")


def _ensure_weather_templates() -> None:
    if not frappe.db.table_exists("Notification Template"):
        return
    templates = {
        "weather_watch": (
            "Weather watch — {{ event_name }} on {{ event_date }}",
            "<p>Forecast conditions for <b>{{ event_name }}</b> ({{ event_date }}) are approaching outdoor thresholds (status: {{ weather_status }}).</p>",
        ),
        "weather_warning": (
            "Weather warning — {{ event_name }} on {{ event_date }}",
            "<p>Forecast for <b>{{ event_name }}</b> ({{ event_date }}) exceeds outdoor thresholds (status: {{ weather_status }}).</p>",
        ),
        "weather_block": (
            "Weather block — {{ event_name }} on {{ event_date }}",
            "<p>Outdoor policy is blocking <b>{{ event_name }}</b> ({{ event_date }}). Resolve or offer a rain date before confirm/dispatch.</p>",
        ),
        "weather_unknown": (
            "Weather forecast unavailable — {{ event_name }}",
            "<p>Could not refresh the outdoor forecast for <b>{{ event_name }}</b>. Status set to unknown — no automatic cancel.</p>",
        ),
        "weather_rain_date_offer": (
            "Rain date offer for {{ event_name }}",
            "<p>Due to weather risk for <b>{{ event_name }}</b>, we can move you to <b>{{ candidate_start }}</b>.</p><p><a href='{{ accept_link }}'>Review in your portal</a></p>",
        ),
    }
    for key, (subject, body) in templates.items():
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


def _policy_payload(doc=None) -> dict:
    if doc is None:
        try:
            doc = frappe.get_single("EE Weather Policy")
        except Exception:
            return {
                "enabled": 0,
                "wind_mph_max": 25,
                "precip_inch_hours": 0.25,
                "threshold_action": "warn",
                "lightning_policy": "warn",
                "lead_hours": 48,
                "auto_offer_rain_date": 0,
                "client_can_accept_rain_date": 1,
                "refund_mode": "manual",
                "provider": "open_meteo",
            }
    return {
        "enabled": cint(getattr(doc, "enabled", 0)),
        "wind_mph_max": flt(getattr(doc, "wind_mph_max", 25)),
        "precip_inch_hours": flt(getattr(doc, "precip_inch_hours", 0.25)),
        "threshold_action": getattr(doc, "threshold_action", None) or "warn",
        "lightning_policy": getattr(doc, "lightning_policy", None) or "warn",
        "lead_hours": cint(getattr(doc, "lead_hours", 48) or 48),
        "auto_offer_rain_date": cint(getattr(doc, "auto_offer_rain_date", 0)),
        "client_can_accept_rain_date": cint(getattr(doc, "client_can_accept_rain_date", 1)),
        "refund_mode": getattr(doc, "refund_mode", None) or "manual",
        "provider": getattr(doc, "provider", None) or "open_meteo",
    }


@frappe.whitelist()
def get_policy() -> dict:
    _require_staff()
    return _policy_payload()


@frappe.whitelist()
def save_policy(values: dict | str | None = None) -> dict:
    _require_staff()
    if isinstance(values, str):
        values = frappe.parse_json(values) or {}
    values = values or {}
    doc = frappe.get_single("EE Weather Policy")
    for key in (
        "enabled",
        "wind_mph_max",
        "precip_inch_hours",
        "threshold_action",
        "lightning_policy",
        "lead_hours",
        "auto_offer_rain_date",
        "client_can_accept_rain_date",
        "refund_mode",
        "provider",
    ):
        if key in values:
            setattr(doc, key, values[key])
    if getattr(doc, "threshold_action", None) not in ("warn", "block"):
        doc.threshold_action = "warn"
    if getattr(doc, "lightning_policy", None) not in ("warn", "block"):
        doc.lightning_policy = "warn"
    doc.save(ignore_permissions=True)
    return _policy_payload(doc)


def booking_is_weather_sensitive(booking) -> bool:
    """True if any assigned asset or service item is weather-sensitive."""
    if cint(getattr(booking, "weather_sensitive", 0)):
        return True
    for row in getattr(booking, "assigned_assets", None) or []:
        if frappe.db.get_value("Service Asset", row.asset, "weather_sensitive"):
            return True
    for row in getattr(booking, "service_items", None) or []:
        item = getattr(row, "item_code", None) or getattr(row, "item", None)
        if item and frappe.db.get_value("Item", item, "ee_weather_sensitive"):
            return True
    return False


def resolve_thresholds(booking, policy=None) -> dict:
    """Effective wind/precip max: tightest override from assets/items, else policy."""
    policy = policy or frappe.get_single("EE Weather Policy")
    wind = flt(getattr(policy, "wind_mph_max", 25) or 25)
    precip = flt(getattr(policy, "precip_inch_hours", 0.25) or 0.25)

    overrides_wind = []
    overrides_precip = []
    for row in getattr(booking, "assigned_assets", None) or []:
        asset = frappe.db.get_value(
            "Service Asset",
            row.asset,
            ["weather_sensitive", "wind_mph_max", "precip_inch_hours"],
            as_dict=True,
        )
        if asset and cint(asset.weather_sensitive):
            if asset.wind_mph_max:
                overrides_wind.append(flt(asset.wind_mph_max))
            if asset.precip_inch_hours:
                overrides_precip.append(flt(asset.precip_inch_hours))
    for row in getattr(booking, "service_items", None) or []:
        item = getattr(row, "item_code", None) or getattr(row, "item", None)
        if not item:
            continue
        vals = frappe.db.get_value(
            "Item",
            item,
            ["ee_weather_sensitive", "ee_wind_mph_max", "ee_precip_inch_hours"],
            as_dict=True,
        )
        if vals and cint(vals.ee_weather_sensitive):
            if vals.ee_wind_mph_max:
                overrides_wind.append(flt(vals.ee_wind_mph_max))
            if vals.ee_precip_inch_hours:
                overrides_precip.append(flt(vals.ee_precip_inch_hours))

    if overrides_wind:
        wind = min(overrides_wind)
    if overrides_precip:
        precip = min(overrides_precip)
    return {
        "wind_mph_max": wind,
        "precip_inch_hours": precip,
        "threshold_action": getattr(policy, "threshold_action", None) or "warn",
        "lightning_policy": getattr(policy, "lightning_policy", None) or "warn",
    }


def evaluate_status(
    wind_mph: float,
    precip_inch: float,
    lightning_risk: bool,
    thresholds: dict,
) -> str:
    """Derive clear|watch|warning|block from forecast vs thresholds."""
    wind_max = flt(thresholds.get("wind_mph_max") or 25) or 25
    precip_max = flt(thresholds.get("precip_inch_hours") or 0.25) or 0.25
    action = thresholds.get("threshold_action") or "warn"
    lightning_policy = thresholds.get("lightning_policy") or "warn"

    wind_ratio = flt(wind_mph) / wind_max if wind_max else 0
    precip_ratio = flt(precip_inch) / precip_max if precip_max else 0
    ratio = max(wind_ratio, precip_ratio)

    if lightning_risk and lightning_policy == "block":
        return "block"
    if ratio >= 1.0:
        return "block" if action == "block" else "warning"
    if lightning_risk and lightning_policy == "warn":
        return "warning" if ratio >= WATCH_RATIO else "watch"
    if ratio >= WATCH_RATIO:
        return "watch"
    return "clear"


def _parse_geo(venue_geo: str | None) -> tuple[float, float] | None:
    if not venue_geo:
        return None
    parts = [p.strip() for p in str(venue_geo).replace(";", ",").split(",") if p.strip()]
    if len(parts) < 2:
        return None
    try:
        return float(parts[0]), float(parts[1])
    except ValueError:
        return None


def _event_window(booking) -> tuple[datetime, datetime]:
    d = frappe.utils.getdate(booking.event_date)
    start_t = frappe.utils.get_time(booking.start_time or "12:00:00")
    end_t = frappe.utils.get_time(booking.end_time or "18:00:00")
    start = datetime.combine(d, start_t)
    end = datetime.combine(d, end_t)
    if end <= start:
        end = start + timedelta(hours=4)
    return start, end


def refresh_one_booking(booking_name: str, policy=None) -> dict:
    """Fetch forecast, store snapshot, update booking weather_status. Fail → unknown."""
    booking = frappe.get_doc("Event Booking", booking_name)
    sensitive = booking_is_weather_sensitive(booking)
    if sensitive and not cint(booking.weather_sensitive):
        booking.db_set("weather_sensitive", 1, update_modified=False)

    if not sensitive:
        return {"booking": booking_name, "status": booking.weather_status or "", "skipped": "not_sensitive"}

    policy = policy or frappe.get_single("EE Weather Policy")
    if not cint(getattr(policy, "enabled", 0)):
        return {"booking": booking_name, "status": booking.weather_status or "", "skipped": "disabled"}

    geo = _parse_geo(getattr(booking, "venue_geo", None))
    if not geo and getattr(booking, "venue", None):
        venue_geo = frappe.db.get_value("EE Venue", booking.venue, "geo") or frappe.db.get_value(
            "EE Venue", booking.venue, "venue_geo"
        )
        geo = _parse_geo(venue_geo)

    status = "unknown"
    wind = precip = 0.0
    lightning = False
    source = "none"
    raw = ""

    if geo:
        try:
            start, end = _event_window(booking)
            from entertainment_express.weather.provider import fetch_forecast

            forecast = fetch_forecast(
                geo[0],
                geo[1],
                start.isoformat(timespec="minutes"),
                end.isoformat(timespec="minutes"),
                provider=getattr(policy, "provider", None) or "open_meteo",
            )
            wind = flt(forecast.get("wind_mph"))
            precip = flt(forecast.get("precip_inch"))
            lightning = bool(forecast.get("lightning_risk"))
            source = forecast.get("source") or "open_meteo"
            raw = (forecast.get("raw") or "")[:1800]
            thresholds = resolve_thresholds(booking, policy)
            status = evaluate_status(wind, precip, lightning, thresholds)
        except Exception:
            status = "unknown"
            source = "error"
    else:
        status = "unknown"
        source = "no_geo"

    if frappe.db.table_exists("EE Weather Snapshot"):
        snap = frappe.get_doc(
            {
                "doctype": "EE Weather Snapshot",
                "booking": booking_name,
                "fetched_at": now_datetime(),
                "status": status,
                "wind_mph": wind,
                "precip_inch": precip,
                "lightning_risk": 1 if lightning else 0,
                "source": source,
                "raw_json": raw,
            }
        )
        snap.insert(ignore_permissions=True)

    prev = booking.weather_status or ""
    booking.db_set("weather_status", status, update_modified=False)

    if status != prev and status in ("watch", "warning", "block", "unknown"):
        _alert_staff_and_client(booking, status)

    return {
        "booking": booking_name,
        "status": status,
        "wind_mph": wind,
        "precip_inch": precip,
        "lightning_risk": lightning,
        "source": source,
    }


def _alert_staff_and_client(booking, status: str) -> None:
    key = {
        "watch": "weather_watch",
        "warning": "weather_warning",
        "block": "weather_block",
        "unknown": "weather_unknown",
    }.get(status, "weather_watch")
    ctx = {
        "event_name": booking.event_name or booking.name,
        "event_date": str(booking.event_date or ""),
        "weather_status": status,
        "booking": booking.name,
        "company_name": frappe.defaults.get_global_default("company") or "Entertainment Express",
    }
    for user in frappe.get_all(
        "Has Role",
        filters={"role": ["in", ["EE Tenant Admin", "EE Dispatcher"]], "parenttype": "User"},
        fields=["parent"],
        limit_page_length=20,
    ):
        email = frappe.db.get_value("User", user.parent, "email")
        if email:
            _notify(key, email, ctx)
    email = frappe.db.get_value("Customer", booking.customer, "email_id")
    if not email and getattr(booking, "contact", None):
        email = frappe.db.get_value("Contact", booking.contact, "email_id")
    if email and status != "unknown":
        _notify(key, email, ctx)


def _open_rain_offer(booking_name: str):
    if not frappe.db.table_exists("EE Rain Date Offer"):
        return None
    return frappe.db.get_value(
        "EE Rain Date Offer",
        {"booking": booking_name, "status": "open"},
        "name",
    )


@frappe.whitelist()
def refresh_booking(booking: str) -> dict:
    _require_staff()
    return refresh_one_booking(booking)


@frappe.whitelist()
def booking_weather(booking: str) -> dict:
    """Owner/client weather strip payload."""
    roles = set(frappe.get_roles() or [])
    is_staff = bool(roles.intersection(STAFF))
    is_payer = PAYER_ROLE in roles
    if GUEST_ROLE in roles and not is_payer and not is_staff:
        frappe.throw("Not allowed.", frappe.PermissionError)
    if not is_staff and not is_payer:
        frappe.throw("Not allowed.", frappe.PermissionError)

    doc = frappe.get_doc("Event Booking", booking)
    if not is_staff:
        customer = frappe.db.get_value("Customer", {"email_id": frappe.session.user}, "name")
        if not customer:
            contact = frappe.db.get_value("Contact", {"email_id": frappe.session.user}, "name")
            if contact:
                customer = frappe.db.get_value(
                    "Dynamic Link",
                    {"parent": contact, "parenttype": "Contact", "link_doctype": "Customer"},
                    "link_name",
                )
        if customer and doc.customer != customer and not roles.intersection(OWNER_ROLES):
            contact_email = frappe.db.get_value("Contact", doc.contact, "email_id") if doc.contact else None
            if contact_email != frappe.session.user and frappe.session.user != "Administrator":
                frappe.throw("Not allowed.", frappe.PermissionError)

    snap = None
    if frappe.db.table_exists("EE Weather Snapshot"):
        rows = frappe.get_all(
            "EE Weather Snapshot",
            filters={"booking": booking},
            fields=["status", "wind_mph", "precip_inch", "lightning_risk", "fetched_at", "source"],
            order_by="fetched_at desc",
            limit_page_length=1,
        )
        snap = rows[0] if rows else None

    offer = None
    policy = _policy_payload()
    if frappe.db.table_exists("EE Rain Date Offer"):
        rows = frappe.get_all(
            "EE Rain Date Offer",
            filters={"booking": booking, "status": "open"},
            fields=["name", "candidate_start", "candidate_end", "expires_at"],
            limit_page_length=1,
        )
        row = rows[0] if rows else None
        if row:
            offer = {
                "id": row.name,
                "candidate_start": str(row.candidate_start or ""),
                "candidate_end": str(row.candidate_end or ""),
                "expires_at": str(row.expires_at or ""),
                "can_accept": bool(policy.get("client_can_accept_rain_date")) and is_payer,
            }

    return {
        "booking": booking,
        "weather_sensitive": cint(doc.weather_sensitive) or booking_is_weather_sensitive(doc),
        "weather_status": doc.weather_status or (snap.status if snap else ""),
        "wind_mph": flt(snap.wind_mph) if snap else None,
        "precip_inch": flt(snap.precip_inch) if snap else None,
        "lightning_risk": bool(snap.lightning_risk) if snap else False,
        "fetched_at": str(snap.fetched_at) if snap else "",
        "source": snap.source if snap else "",
        "rain_date_offer": offer,
        "client_can_accept_rain_date": bool(policy.get("client_can_accept_rain_date")),
    }


@frappe.whitelist()
def offer_rain_date(
    booking: str,
    candidate_start: str,
    candidate_end: str | None = None,
    ttl_hours: int = 72,
) -> dict:
    """Staff: create hold + rain-date offer. Conflicts reject."""
    _require_staff()
    booking_doc = frappe.get_doc("Event Booking", booking)
    if booking_doc.status in ("completed", "canceled"):
        frappe.throw(f"Cannot offer rain date for a {booking_doc.status} booking.")

    start = get_datetime(candidate_start)
    if candidate_end:
        end = get_datetime(candidate_end)
    else:
        orig_start, orig_end = _event_window(booking_doc)
        duration = orig_end - orig_start
        end = start + duration

    asset_names = [r.asset for r in (booking_doc.assigned_assets or []) if r.asset]
    hold_name = None
    if asset_names:
        from entertainment_express.booking.availability import check

        for asset_name in asset_names:
            result = check(asset_name, start, end)
            if not result.get("available"):
                conflicts = [c for c in result.get("conflicts", []) if c != booking]
                if conflicts or result.get("reason"):
                    frappe.throw(
                        f"Asset '{asset_name}' is not available for the rain date.",
                        frappe.ValidationError,
                    )

        from entertainment_express.api.booking import create_hold

        hold = create_hold(
            asset_names=asset_names,
            event_start=str(start),
            event_end=str(end),
            customer_name=booking_doc.customer or "",
            ttl_minutes=max(int(ttl_hours) * 60, 60),
        )
        hold_name = hold.get("hold")

    if frappe.db.table_exists("EE Rain Date Offer"):
        for old in frappe.get_all(
            "EE Rain Date Offer",
            filters={"booking": booking, "status": "open"},
            pluck="name",
        ):
            frappe.db.set_value("EE Rain Date Offer", old, "status", "cancelled")

    offer = frappe.get_doc(
        {
            "doctype": "EE Rain Date Offer",
            "booking": booking,
            "status": "open",
            "candidate_start": start,
            "candidate_end": end,
            "hold": hold_name,
            "expires_at": now_datetime() + timedelta(hours=int(ttl_hours) or 72),
            "offered_by": frappe.session.user,
        }
    )
    offer.insert(ignore_permissions=True)

    email = frappe.db.get_value("Customer", booking_doc.customer, "email_id")
    if not email and booking_doc.contact:
        email = frappe.db.get_value("Contact", booking_doc.contact, "email_id")
    _notify(
        "weather_rain_date_offer",
        email or "",
        {
            "event_name": booking_doc.event_name or booking,
            "event_date": str(booking_doc.event_date or ""),
            "candidate_start": str(start),
            "candidate_end": str(end),
            "accept_link": absolute_url("/client/events"),
            "company_name": frappe.defaults.get_global_default("company") or "Entertainment Express",
        },
    )
    frappe.db.commit()
    return {"offer": offer.name, "hold": hold_name, "status": "open"}


@frappe.whitelist()
def accept_rain_date(offer: str | None = None, booking: str | None = None) -> dict:
    """Client (payer) accepts an open rain-date offer; moves booking window."""
    _require_payer()
    policy = _policy_payload()
    if not policy.get("client_can_accept_rain_date"):
        frappe.throw("Rain-date accept is disabled for this company.", frappe.PermissionError)

    if offer:
        offer_doc = frappe.get_doc("EE Rain Date Offer", offer)
    elif booking:
        name = _open_rain_offer(booking)
        if not name:
            frappe.throw("No open rain-date offer.")
        offer_doc = frappe.get_doc("EE Rain Date Offer", name)
    else:
        frappe.throw("offer or booking is required.")

    if offer_doc.status != "open":
        frappe.throw("This rain-date offer is no longer open.")
    if offer_doc.expires_at and get_datetime(offer_doc.expires_at) < now_datetime():
        offer_doc.db_set("status", "expired")
        frappe.throw("This rain-date offer has expired.")

    booking_doc = frappe.get_doc("Event Booking", offer_doc.booking)
    start = get_datetime(offer_doc.candidate_start)
    end = get_datetime(offer_doc.candidate_end)

    from entertainment_express.booking.availability import check

    for row in booking_doc.assigned_assets or []:
        result = check(row.asset, start, end)
        if not result.get("available"):
            conflicts = [c for c in result.get("conflicts", []) if c != booking_doc.name]
            if conflicts:
                frappe.throw(
                    f"Asset '{row.asset}' is no longer available for the rain date.",
                    frappe.ValidationError,
                )

    booking_doc.event_date = start.date()
    booking_doc.start_time = start.time()
    booking_doc.end_time = end.time()
    booking_doc.weather_status = "clear"
    booking_doc.save(ignore_permissions=True)

    if offer_doc.hold and frappe.db.exists("Event Booking Hold", offer_doc.hold):
        frappe.db.set_value("Event Booking Hold", offer_doc.hold, "converted", 1)

    offer_doc.status = "accepted"
    offer_doc.accepted_at = now_datetime()
    offer_doc.save(ignore_permissions=True)
    frappe.db.commit()
    return {
        "status": "accepted",
        "booking": booking_doc.name,
        "event_date": str(booking_doc.event_date),
        "start_time": str(booking_doc.start_time),
        "end_time": str(booking_doc.end_time),
    }


@frappe.whitelist()
def confirm_allowed(booking: str) -> dict:
    """Gate confirm/dispatch when policy blocks on weather."""
    _require_staff()
    doc = frappe.get_doc("Event Booking", booking)
    if not cint(doc.weather_sensitive) and not booking_is_weather_sensitive(doc):
        return {"allowed": True, "weather_status": doc.weather_status or ""}
    status = doc.weather_status or ""
    if status == "block":
        return {
            "allowed": False,
            "weather_status": status,
            "message": "Weather status is block — resolve before confirm/dispatch.",
        }
    return {"allowed": True, "weather_status": status, "warn": status in ("watch", "warning", "unknown")}
