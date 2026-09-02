"""Public tenant storefront: published packages and quote-request wishlist."""

from __future__ import annotations

import frappe
from frappe.utils import flt, fmt_money


def _money(amount) -> str:
    return fmt_money(flt(amount), currency=frappe.db.get_default("currency") or "USD")


def _client_ip() -> str:
    try:
        return frappe.local.request_ip or (frappe.request.headers.get("X-Forwarded-For") or "").split(",")[0].strip()
    except Exception:
        return "unknown"


@frappe.whitelist(allow_guest=True)
def list_packages() -> list[dict]:
    """Published packages for this tenant host only (site DB isolation)."""
    if not frappe.db.table_exists("Service Package"):
        return []
    filters = {}
    meta = frappe.get_meta("Service Package")
    if meta.has_field("published"):
        filters["published"] = 1
    elif meta.has_field("active"):
        filters["active"] = 1
    fields = ["name", "package_name", "package_price", "description"]
    if meta.has_field("image"):
        fields.append("image")
    rows = []
    for pkg in frappe.get_all("Service Package", filters=filters, fields=fields, limit_page_length=100):
        rows.append(
            {
                "id": pkg.name,
                "name": pkg.package_name or pkg.name,
                "rate": _money(pkg.package_price),
                "description": pkg.description or "",
                "image": (pkg.get("image") if hasattr(pkg, "get") else getattr(pkg, "image", None)) or "",
            }
        )
    return rows


@frappe.whitelist(allow_guest=True)
def request_quote(full_name: str, email: str, packages: list | str | None = None, phone: str = "", message: str = "") -> dict:
    """Guest quote request → Lead + note of selected packages. Rate-limited."""
    from entertainment_express.api.marketing import _check_rate_limit

    _check_rate_limit(f"ee:storefront:quote:{_client_ip()}", limit_count=8, window_seconds=3600)
    email = (email or "").strip()
    full_name = (full_name or "").strip()
    if not email or "@" not in email or not full_name:
        frappe.throw("Name and email are required.")
    if isinstance(packages, str):
        packages = frappe.parse_json(packages) or []
    lead = frappe.get_doc(
        {
            "doctype": "Lead",
            "lead_name": full_name[:140],
            "email_id": email[:240],
            "mobile_no": (phone or "")[:30],
            "status": "Open",
        }
    )
    if frappe.get_meta("Lead").has_field("ee_lead_type"):
        lead.ee_lead_type = "quote"
    lead.insert(ignore_permissions=True)
    names = []
    for item in packages or []:
        if isinstance(item, dict):
            names.append(str(item.get("name") or item.get("id") or ""))
        else:
            names.append(str(item))
    note = "Quote request packages: " + ", ".join([n for n in names if n])
    if message:
        note += "\n" + message[:1500]
    try:
        lead.add_comment("Comment", note[:3000])
    except Exception:
        pass
    return {"ok": True, "inquiry": lead.name}
