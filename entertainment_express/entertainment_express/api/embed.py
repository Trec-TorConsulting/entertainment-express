"""Public embed APIs for tenant website widgets. Site-scoped + rate-limited."""

from __future__ import annotations

import secrets

import frappe
from frappe.utils import cint, getdate

from entertainment_express.api.portal_owner import OWNER_ROLES

STAFF = OWNER_ROLES | {"EE Office", "EE Marketing", "System Manager"}
GUEST_ROLE = "EE Event Guest"
PAYER_ROLE = "EE Customer"
EMBED_LIMIT = 60


def _require_staff() -> None:
    roles = set(frappe.get_roles() or [])
    if GUEST_ROLE in roles and PAYER_ROLE not in roles:
        frappe.throw("Not allowed.", frappe.PermissionError)
    if not roles.intersection(STAFF):
        frappe.throw("Not allowed.", frappe.PermissionError)


def _cors() -> None:
    try:
        frappe.local.response["Access-Control-Allow-Origin"] = "*"
        frappe.local.response["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        frappe.local.response["Access-Control-Allow-Headers"] = "Content-Type, X-EE-Embed-Key"
    except Exception:
        pass


def _site_embed_key() -> str:
    try:
        return (frappe.get_cached_value("EE Portal Settings", "EE Portal Settings", "public_embed_key") or "").strip()
    except Exception:
        try:
            return (frappe.db.get_single_value("EE Portal Settings", "public_embed_key") or "").strip()
        except Exception:
            return ""


def _assert_embed_key(key: str | None) -> str:
    expected = _site_embed_key()
    provided = (key or "").strip()
    if not expected:
        frappe.throw("Embeds are not configured for this site.", frappe.PermissionError)
    if not provided or provided != expected:
        frappe.throw("Invalid embed key.", frappe.PermissionError)
    return provided


def _rate_limit(key: str) -> None:
    from entertainment_express.api.rate_limit import check_rate_limit

    check_rate_limit(identity=f"embed:{key}", limit=EMBED_LIMIT)


def _brand() -> dict:
    try:
        doc = frappe.get_single("EE Portal Settings")
        return {
            "name": getattr(doc, "brand_name", None) or "",
            "color": getattr(doc, "brand_color", None) or "",
            "logo": getattr(doc, "brand_logo", None) or "",
            "review_url": getattr(doc, "review_url", None) or "",
        }
    except Exception:
        return {"name": "", "color": "", "logo": "", "review_url": ""}


@frappe.whitelist()
def get_embed_settings() -> dict:
    _require_staff()
    key = _site_embed_key()
    base = frappe.utils.get_url()
    snippet = (
        f'<script src="{base}/assets/entertainment_express/embed.js" async></script>\n'
        f'<div data-ee-widget="catalog" data-ee-key="{key or "YOUR_KEY"}"></div>'
    )
    return {
        "public_embed_key": key,
        "snippet": snippet,
        "script_url": f"{base}/assets/entertainment_express/embed.js",
        "widgets": ["availability", "catalog", "wishlist", "book", "reviews"],
    }


@frappe.whitelist()
def rotate_embed_key() -> dict:
    _require_staff()
    key = secrets.token_urlsafe(24)
    doc = frappe.get_single("EE Portal Settings")
    doc.public_embed_key = key
    doc.save(ignore_permissions=True)
    return get_embed_settings()


@frappe.whitelist()
def list_pages() -> list[dict]:
    _require_staff()
    if not frappe.db.table_exists("EE Website Page"):
        return []
    rows = []
    for row in frappe.get_all(
        "EE Website Page",
        fields=["name", "route", "title", "published", "seo_title", "modified"],
        order_by="route asc",
        limit_page_length=100,
    ):
        rows.append(
            {
                "id": row.name,
                "route": row.route,
                "title": row.title,
                "published": cint(row.published),
                "seo_title": row.seo_title or "",
                "url": f"/p/{row.route}",
                "modified": str(row.modified or ""),
            }
        )
    return rows


@frappe.whitelist()
def get_page(name: str) -> dict:
    _require_staff()
    doc = frappe.get_doc("EE Website Page", name)
    return {
        "id": doc.name,
        "route": doc.route,
        "title": doc.title,
        "body": doc.body or "",
        "published": cint(doc.published),
        "seo_title": doc.seo_title or "",
        "seo_description": doc.seo_description or "",
    }


@frappe.whitelist()
def save_page(values: dict | str | None = None, name: str | None = None) -> dict:
    _require_staff()
    if isinstance(values, str):
        values = frappe.parse_json(values) or {}
    values = values or {}
    from entertainment_express.website_sanitize import sanitize_html

    payload = {
        "route": (values.get("route") or "").strip(),
        "title": (values.get("title") or "").strip(),
        "body": sanitize_html(values.get("body") or ""),
        "published": 1 if cint(values.get("published")) else 0,
        "seo_title": values.get("seo_title") or "",
        "seo_description": values.get("seo_description") or "",
    }
    if not payload["title"]:
        frappe.throw("Title is required.")
    if not payload["route"]:
        frappe.throw("Route is required.")
    if name:
        doc = frappe.get_doc("EE Website Page", name)
        doc.update(payload)
        doc.save()
    else:
        doc = frappe.get_doc({"doctype": "EE Website Page", **payload})
        doc.insert()
    return get_page(doc.name)


@frappe.whitelist()
def delete_page(name: str) -> dict:
    _require_staff()
    frappe.delete_doc("EE Website Page", name, ignore_permissions=True)
    return {"ok": True}


# ── Public embed endpoints ───────────────────────────────────────────────────


@frappe.whitelist(allow_guest=True)
def bootstrap(key: str | None = None) -> dict:
    _cors()
    embed_key = _assert_embed_key(key)
    _rate_limit(embed_key)
    brand = _brand()
    return {
        "ok": True,
        "brand": brand,
        "book_url": f"{frappe.utils.get_url()}/book",
        "widgets": ["availability", "catalog", "wishlist", "book", "reviews"],
    }


@frappe.whitelist(allow_guest=True)
def catalog(key: str | None = None) -> dict:
    _cors()
    embed_key = _assert_embed_key(key)
    _rate_limit(embed_key)
    from entertainment_express.api.catalog import public_catalog

    data = public_catalog()
    return {"brand": _brand(), **data}


@frappe.whitelist(allow_guest=True)
def availability(key: str | None = None, date: str | None = None, item: str | None = None) -> dict:
    """High-level availability for a date: whether the tenant has open capacity."""
    _cors()
    embed_key = _assert_embed_key(key)
    _rate_limit(embed_key)
    day = getdate(date) if date else getdate()
    # Count confirmed bookings that day as a simple signal; full asset check needs item+window
    count = 0
    if frappe.db.table_exists("Event Booking"):
        count = frappe.db.count(
            "Event Booking",
            {"event_date": day, "status": ["in", ["confirmed", "tentative", "in_progress"]], "is_template": 0},
        )
    busy = count >= 8
    return {
        "date": str(day),
        "available": not busy,
        "busy_jobs": count,
        "message": "Limited availability" if busy else "Open for booking",
        "book_url": f"{frappe.utils.get_url()}/book",
        "item": item or "",
    }


@frappe.whitelist(allow_guest=True)
def wishlist(key: str | None = None) -> dict:
    """Guest wishlist is client-side; return catalog ids for local storage sync."""
    _cors()
    embed_key = _assert_embed_key(key)
    _rate_limit(embed_key)
    from entertainment_express.api.storefront import list_packages

    return {"packages": list_packages(), "book_url": f"{frappe.utils.get_url()}/book"}


@frappe.whitelist(allow_guest=True)
def book_link(key: str | None = None, package: str | None = None) -> dict:
    _cors()
    embed_key = _assert_embed_key(key)
    _rate_limit(embed_key)
    url = f"{frappe.utils.get_url()}/book"
    if package:
        from urllib.parse import quote

        url = f"{url}?package={quote(str(package))}"
    return {"url": url, "brand": _brand()}


@frappe.whitelist(allow_guest=True)
def reviews(key: str | None = None) -> dict:
    _cors()
    embed_key = _assert_embed_key(key)
    _rate_limit(embed_key)
    brand = _brand()
    return {
        "review_url": brand.get("review_url") or "",
        "label": "See our reviews",
        "brand": brand,
    }
