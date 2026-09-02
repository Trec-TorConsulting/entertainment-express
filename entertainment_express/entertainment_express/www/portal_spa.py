"""Shared bootstrap for owner / employee / client SPA hosts."""

from __future__ import annotations

import os

import frappe


def portal_bootstrap() -> dict:
    user = frappe.session.user or "Guest"
    branding = {
        "name": None,
        "logo": None,
        "color": None,
        "favicon": None,
        "hide_product_chrome": 0,
    }
    try:
        settings = frappe.get_cached_doc("EE Portal Settings", "EE Portal Settings")
        branding = {
            "name": getattr(settings, "brand_name", None),
            "logo": getattr(settings, "brand_logo", None),
            "color": getattr(settings, "brand_color", None),
            "favicon": getattr(settings, "brand_favicon", None),
            "hide_product_chrome": int(getattr(settings, "hide_product_chrome", 0) or 0),
        }
    except Exception:
        pass
    if not branding.get("name"):
        branding["name"] = (
            frappe.db.get_default("company")
            or frappe.db.get_single_value("Global Defaults", "default_company")
            or frappe.db.get_single_value("Website Settings", "app_name")
            or "Your company"
        )

    csrf = ""
    try:
        csrf = frappe.sessions.get_csrf_token() or ""
    except Exception:
        session = getattr(frappe.local, "session", None)
        data = getattr(session, "data", None) or {}
        csrf = data.get("csrf_token") or ""

    person = {"name": user, "full_name": user, "email": user if user != "Guest" else "", "image": None}
    inbox_count = 0
    if user and user != "Guest":
        try:
            row = frappe.db.get_value("User", user, ["full_name", "user_image", "email", "first_name"], as_dict=True) or {}
            person = {
                "name": user,
                "full_name": row.get("full_name") or row.get("first_name") or user,
                "email": row.get("email") or user,
                "image": row.get("user_image"),
            }
        except Exception:
            pass
        try:
            inbox_count = int(frappe.db.count("ToDo", {"allocated_to": user, "status": "Open"}) or 0)
        except Exception:
            inbox_count = 0

    canonical_host = ""
    try:
        from entertainment_express.white_label.urls import get_canonical_host

        canonical_host = get_canonical_host()
    except Exception:
        canonical_host = getattr(frappe.local, "site", "") or ""

    return {
        "user": user,
        "person": person,
        "roles": frappe.get_roles(user) if user != "Guest" else [],
        "csrf_token": csrf,
        "branding": branding,
        "inbox_count": inbox_count,
        "canonical_host": canonical_host,
    }


def apply_spa_context(context, *, title: str, portal: str) -> None:
    context.no_cache = 1
    context.no_breadcrumbs = 1
    context.no_sidebar = 1
    context.no_header = 1
    context.safe_render = False
    context.base_template = None
    context.spa_title = title
    context.spa_portal = portal
    # Frappe SharedDataMiddleware serves /assets with max-age=43200 and these
    # files are not content-hashed. A query string is required so browsers and
    # reverse proxies pick up a new bundle after a deploy.
    ver = _portal_asset_version(portal)
    context.spa_css = f"/assets/entertainment_express/{portal}/assets/main.css?v={ver}"
    context.spa_js = f"/assets/entertainment_express/{portal}/main.js?v={ver}"
    context.portal_bootstrap = portal_bootstrap()
    branding = (context.portal_bootstrap or {}).get("branding") or {}
    if branding.get("name"):
        context.spa_title = f"{branding['name']} · {title}" if not branding.get("hide_product_chrome") else branding["name"]
    context.spa_favicon = branding.get("favicon") or ""


def _portal_asset_version(portal: str) -> str:
    try:
        path = frappe.get_app_path("entertainment_express", "public", portal, "main.js")
        return str(int(os.path.getmtime(path)))
    except Exception:
        return "1"
