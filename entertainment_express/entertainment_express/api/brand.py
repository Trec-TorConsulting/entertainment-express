"""Multi-brand resolve — host/path → EE Brand; catalog filter helpers."""

from __future__ import annotations

import frappe
from frappe.utils import cint

from entertainment_express.api.portal_owner import OWNER_ROLES

GUEST_ROLE = "EE Event Guest"
PAYER_ROLE = "EE Customer"
STAFF = OWNER_ROLES | {"EE Marketing", "EE Office", "System Manager"}


def _roles() -> set[str]:
    return set(frappe.get_roles() or [])


def _require_staff() -> None:
    roles = _roles()
    if GUEST_ROLE in roles and PAYER_ROLE not in roles:
        frappe.throw("Not allowed.", frappe.PermissionError)
    if not roles.intersection(STAFF):
        frappe.throw("Not allowed.", frappe.PermissionError)


def ensure_default_brand() -> str | None:
    if not frappe.db.table_exists("EE Brand"):
        return None
    existing = frappe.db.get_value("EE Brand", {"is_default": 1, "active": 1}, "name")
    if existing:
        return existing
    any_brand = frappe.db.get_value("EE Brand", {"active": 1}, "name")
    if any_brand:
        frappe.db.set_value("EE Brand", any_brand, "is_default", 1)
        return any_brand
    settings_name = frappe.db.get_single_value("EE Portal Settings", "brand_name") or "Default"
    doc = frappe.get_doc(
        {
            "doctype": "EE Brand",
            "brand_name": settings_name,
            "slug": "default",
            "is_default": 1,
            "active": 1,
            "primary_color": frappe.db.get_single_value("EE Portal Settings", "brand_color") or "",
            "logo": frappe.db.get_single_value("EE Portal Settings", "brand_logo") or "",
        }
    )
    doc.insert(ignore_permissions=True)
    return doc.name


@frappe.whitelist(allow_guest=True)
def resolve_brand(host: str | None = None, path: str | None = None) -> dict | None:
    """Resolve brand by custom_host or first path segment matching slug."""
    if not frappe.db.table_exists("EE Brand"):
        return None
    host = (host or "").strip().lower()
    path = (path or "").strip()
    if host:
        name = frappe.db.get_value("EE Brand", {"custom_host": host, "active": 1}, "name")
        if name:
            return _payload(frappe.get_doc("EE Brand", name))
    # /{slug}/...
    parts = [p for p in path.split("/") if p]
    if parts:
        slug = parts[0].lower()
        name = frappe.db.get_value("EE Brand", {"slug": slug, "active": 1}, "name")
        if name:
            return _payload(frappe.get_doc("EE Brand", name))
    default = ensure_default_brand()
    if default:
        return _payload(frappe.get_doc("EE Brand", default))
    return None


def _payload(doc) -> dict:
    return {
        "name": doc.name,
        "brand_name": doc.brand_name,
        "slug": doc.slug,
        "logo": doc.logo or "",
        "primary_color": doc.primary_color or "",
        "email_from": doc.email_from or "",
        "path_prefix": doc.path_prefix or "",
        "is_default": bool(cint(doc.is_default)),
    }


@frappe.whitelist()
def list_brands() -> list:
    _require_staff()
    if not frappe.db.table_exists("EE Brand"):
        return []
    ensure_default_brand()
    rows = frappe.get_all(
        "EE Brand",
        fields=["name", "brand_name", "slug", "logo", "primary_color", "custom_host", "path_prefix", "is_default", "active", "email_from"],
        order_by="is_default desc, brand_name asc",
    )
    return rows


@frappe.whitelist()
def save_brand(data: dict | str) -> dict:
    _require_staff()
    payload = frappe.parse_json(data) if isinstance(data, str) else (data or {})
    name = payload.get("name")
    if name and frappe.db.exists("EE Brand", name):
        doc = frappe.get_doc("EE Brand", name)
        for k in ("brand_name", "slug", "logo", "primary_color", "custom_host", "path_prefix", "email_from"):
            if k in payload:
                setattr(doc, k, payload[k])
        if "is_default" in payload:
            doc.is_default = 1 if cint(payload["is_default"]) else 0
        if "active" in payload:
            doc.active = 1 if cint(payload["active"]) else 0
        doc.save(ignore_permissions=True)
    else:
        doc = frappe.get_doc({"doctype": "EE Brand", **{k: v for k, v in payload.items() if k != "name"}})
        doc.insert(ignore_permissions=True)
    if cint(doc.is_default):
        for other in frappe.get_all("EE Brand", filters={"name": ["!=", doc.name], "is_default": 1}):
            frappe.db.set_value("EE Brand", other.name, "is_default", 0)
    host = (getattr(doc, "custom_host", None) or "").strip().lower()
    if host:
        try:
            from entertainment_express.api import hardening

            hardening.request_custom_domain(host)
        except Exception:
            pass
    return _payload(doc)


@frappe.whitelist(allow_guest=True)
def get_brand_theme_by_host(host: str | None = None) -> dict:
    """Fetch brand theme settings by host with fallback to default brand."""
    info = resolve_brand(host=host)
    if not info:
        return {
            "brand_name": "Entertainment Express",
            "primary_color": "#059669",
            "secondary_color": "#10b981",
            "logo": "",
            "statement_descriptor": "ENTERTAINMENT",
        }
    doc = frappe.get_doc("EE Brand", info["name"])
    return {
        "name": doc.name,
        "brand_name": doc.brand_name,
        "primary_color": getattr(doc, "primary_color", "") or "#059669",
        "secondary_color": getattr(doc, "secondary_color", "") or "#10b981",
        "logo": getattr(doc, "logo", "") or "",
        "email_from": getattr(doc, "email_from", "") or "",
        "twilio_phone_number": getattr(doc, "twilio_phone_number", "") or "",
        "statement_descriptor": getattr(doc, "statement_descriptor", "") or doc.brand_name[:20].upper(),
    }


def override_outbound_email_from(doc, method=None):
    """Doc hook: override email From address based on brand linked to booking/transaction."""
    brand_name = getattr(doc, "ee_brand", None) or getattr(doc, "brand", None)
    if not brand_name and getattr(doc, "booking", None):
        brand_name = frappe.db.get_value("Event Booking", doc.booking, "ee_brand")
    if brand_name and frappe.db.exists("EE Brand", brand_name):
        email_from = frappe.db.get_value("EE Brand", brand_name, "email_from")
        if email_from:
            setattr(doc, "sender", email_from)


@frappe.whitelist()
def get_twilio_sender_number(brand_name: str | None = None) -> str:
    """Select Twilio sender phone number based on brand."""
    if brand_name and frappe.db.exists("EE Brand", brand_name):
        phone = frappe.db.get_value("EE Brand", brand_name, "twilio_phone_number")
        if phone:
            return phone
    default_brand = ensure_default_brand()
    if default_brand:
        phone = frappe.db.get_value("EE Brand", default_brand, "twilio_phone_number")
        if phone:
            return phone
    return "+18005550199"


@frappe.whitelist()
def get_stripe_statement_descriptor(brand_name: str | None = None) -> str:
    """Dynamic Stripe statement descriptor pass-through during charge intent creation."""
    if brand_name and frappe.db.exists("EE Brand", brand_name):
        desc = frappe.db.get_value("EE Brand", brand_name, "statement_descriptor")
        if desc:
            return desc[:22].upper()
    return "ENTERTAINMENT"


def on_sales_transaction_validate(doc, method=None):
    """Automatically link brand to Cost Center on sales transactions."""
    brand_name = getattr(doc, "ee_brand", None) or getattr(doc, "brand", None)
    if brand_name and frappe.db.exists("Cost Center", {"cost_center_name": brand_name}):
        cc = frappe.db.get_value("Cost Center", {"cost_center_name": brand_name}, "name")
        if cc:
            doc.cost_center = cc


@frappe.whitelist(allow_guest=True)
def catalog_for_brand(brand: str | None = None, host: str | None = None, path: str | None = None) -> list:
    """Items/packages tagged with brand — untagged shown on default brand only."""
    resolved = None
    if brand and frappe.db.exists("EE Brand", brand):
        resolved = frappe.get_doc("EE Brand", brand)
    else:
        info = resolve_brand(host=host, path=path)
        if info:
            resolved = frappe.get_doc("EE Brand", info["name"])
    if not resolved:
        return []
    filters = {"disabled": 0}
    # Prefer Item.ee_brand when present
    try:
        if cint(resolved.is_default):
            items = frappe.get_all(
                "Item",
                filters=filters,
                or_filters=[{"ee_brand": ["in", [resolved.name, ""]]}, {"ee_brand": ["is", "not set"]}],
                fields=["name", "item_name", "ee_brand", "standard_rate"],
                limit=500,
            )
        else:
            items = frappe.get_all(
                "Item",
                filters={**filters, "ee_brand": resolved.name},
                fields=["name", "item_name", "ee_brand", "standard_rate"],
                limit=500,
            )
        return items
    except Exception:
        return []

