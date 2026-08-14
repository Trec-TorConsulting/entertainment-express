"""Shared bootstrap for owner / employee / client SPA hosts."""

from __future__ import annotations

import frappe


def portal_bootstrap() -> dict:
    user = frappe.session.user or "Guest"
    branding = {"name": None, "logo": None, "color": None}
    try:
        settings = frappe.get_cached_doc("EE Portal Settings", "EE Portal Settings")
        branding = {
            "name": getattr(settings, "brand_name", None),
            "logo": getattr(settings, "brand_logo", None),
            "color": getattr(settings, "brand_color", None),
        }
    except Exception:
        pass

    csrf = ""
    try:
        csrf = frappe.sessions.get_csrf_token() or ""
    except Exception:
        session = getattr(frappe.local, "session", None)
        data = getattr(session, "data", None) or {}
        csrf = data.get("csrf_token") or ""

    return {
        "user": user,
        "roles": frappe.get_roles(user) if user != "Guest" else [],
        "csrf_token": csrf,
        "branding": branding,
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
    context.spa_css = f"/assets/entertainment_express/{portal}/assets/main.css"
    context.spa_js = f"/assets/entertainment_express/{portal}/main.js"
    context.portal_bootstrap = portal_bootstrap()
