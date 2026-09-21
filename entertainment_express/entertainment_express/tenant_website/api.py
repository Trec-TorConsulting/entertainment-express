"""
Tenant Website & Embed Widgets Server APIs.
"""

from urllib.parse import urlparse
import json
import frappe
from frappe import _


def validate_embed_origin(api_key: str):
    """
    Validates API key and checks HTTP Origin / Referer headers against EE Embed Key whitelisted_domains.
    Raises PermissionError if origin is rejected.
    """
    if not api_key:
        frappe.throw(_("API key is required."), frappe.PermissionError)

    key_doc = frappe.db.get_value(
        "EE Embed Key",
        {"api_key": api_key, "is_active": 1},
        ["name", "key_name", "whitelisted_domains", "enabled_widgets"],
        as_dict=True,
    )
    if not key_doc:
        frappe.throw(_("Invalid or inactive embed key."), frappe.PermissionError)

    whitelisted = (key_doc.whitelisted_domains or "").strip().splitlines()
    whitelisted_clean = [w.strip().lower() for w in whitelisted if w.strip()]

    if not whitelisted_clean:
        return key_doc

    origin = None
    if getattr(frappe, "request", None) and hasattr(frappe.request, "headers"):
        origin = frappe.request.headers.get("Origin") or frappe.request.headers.get("Referer")

    if not origin:
        return key_doc

    parsed = urlparse(origin)
    host = (parsed.hostname or "").lower()

    allowed = False
    for domain in whitelisted_clean:
        if domain == "*" or host == domain or (domain.startswith("*.") and host.endswith(domain[1:])):
            allowed = True
            break

    if not allowed:
        frappe.throw(_("ORIGIN_NOT_WHITELISTED: Domain '{0}' is not authorized to use this embed key.").format(host), frappe.PermissionError)

    return key_doc


@frappe.whitelist(allow_guest=True)
def get_public_page(slug="home"):
    """
    Returns public tenant page JSON. Cached in Redis cache per site.
    """
    cache_key = f"ee_public_page:{slug}"
    cached = frappe.cache().get_value(cache_key)
    if cached:
        return json.loads(cached) if isinstance(cached, str) else cached

    page = frappe.db.get_value(
        "EE Tenant Page",
        {"slug": slug, "is_published": 1},
        ["name", "title", "slug", "seo_title", "seo_description", "seo_image", "blocks", "custom_head_html"],
        as_dict=True,
    )

    if not page:
        frappe.throw(_("Page not found."), frappe.DoesNotExistError)

    result = {
        "title": page.title,
        "slug": page.slug,
        "seo_title": page.seo_title or page.title,
        "seo_description": page.seo_description or "",
        "seo_image": page.seo_image or "",
        "blocks": json.loads(page.blocks) if page.blocks else [],
        "custom_head_html": page.custom_head_html or "",
    }

    frappe.cache().set_value(cache_key, json.dumps(result), expires_in_sec=300)
    return result


@frappe.whitelist()
def save_page_blocks(slug, title, blocks_json, seo_meta=None):
    """
    Saves or updates EE Tenant Page blocks from Owner Portal. Role guarded to EE Tenant Admin/Staff.
    """
    _check_role(["EE Tenant Admin", "EE Staff", "System Manager"])

    if frappe.db.exists("EE Tenant Page", {"slug": slug}):
        doc = frappe.get_doc("EE Tenant Page", {"slug": slug})
    else:
        doc = frappe.get_doc({
            "doctype": "EE Tenant Page",
            "slug": slug,
            "title": title or slug.title(),
            "is_published": 1,
        })

    doc.title = title or doc.title
    doc.blocks = json.dumps(blocks_json) if isinstance(blocks_json, (dict, list)) else blocks_json

    if seo_meta and isinstance(seo_meta, dict):
        doc.seo_title = seo_meta.get("seo_title", doc.seo_title)
        doc.seo_description = seo_meta.get("seo_description", doc.seo_description)

    doc.save(ignore_permissions=True)
    frappe.db.commit()

    frappe.cache().delete_value(f"ee_public_page:{slug}")
    return {"status": "saved", "slug": slug, "name": doc.name}


@frappe.whitelist(allow_guest=True)
def widget_availability_query(api_key, date, category=None):
    """
    Public API for embeddable availability widget.
    Validates origin against embed key whitelist.
    """
    key_doc = validate_embed_origin(api_key)

    from entertainment_express.equipment_fleet.api import check_temporal_availability
    start_dt = f"{date} 08:00:00"
    end_dt = f"{date} 20:00:00"

    items = frappe.get_all("Item", filters={"item_group": category} if category else {}, fields=["name as item_code", "item_name"])
    check_items = [{"item_code": i["item_code"], "qty": 1} for i in items[:10]]

    avail_res = check_temporal_availability(check_items, start_dt, end_dt)

    return {
        "status": "success",
        "date": date,
        "category": category,
        "availability": avail_res,
        "embed_key_name": key_doc["key_name"],
    }


@frappe.whitelist(allow_guest=True)
def widget_submit_inquiry(api_key, payload_json):
    """
    Submits a lead/opportunity from an embedded widget into CRM.
    """
    key_doc = validate_embed_origin(api_key)

    if isinstance(payload_json, str):
        payload = json.loads(payload_json)
    else:
        payload = payload_json or {}

    lead_doc = frappe.get_doc({
        "doctype": "Lead",
        "lead_name": payload.get("name") or "Widget Visitor",
        "email_id": payload.get("email"),
        "phone": payload.get("phone"),
        "source": f"Widget Embed ({key_doc['key_name']})",
        "notes": payload.get("notes") or f"Wishlist items: {payload.get('items')}",
    })
    lead_doc.insert(ignore_permissions=True)
    frappe.db.commit()

    return {"status": "submitted", "lead": lead_doc.name}


def _check_role(allowed_roles: list[str]) -> None:
    if frappe.session.user == "Guest":
        frappe.throw(_("Authentication required."), frappe.PermissionError)
    if not any(r in frappe.get_roles(frappe.session.user) for r in allowed_roles):
        frappe.throw(_("Insufficient permissions."), frappe.PermissionError)
