"""Shared white-label brand kit helpers (phase 39)."""

from __future__ import annotations

from html import escape
from typing import Any

CURATED_FONTS: dict[str, str] = {
    "system": 'ui-sans-serif, "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif',
    "georgia": 'Georgia, "Times New Roman", Times, serif',
    "playfair": '"Playfair Display", Georgia, "Times New Roman", serif',
    "montserrat": '"Montserrat", ui-sans-serif, system-ui, sans-serif',
    "lato": '"Lato", ui-sans-serif, system-ui, sans-serif',
    "open-sans": '"Open Sans", ui-sans-serif, system-ui, sans-serif',
    "roboto": '"Roboto", ui-sans-serif, system-ui, sans-serif',
    "source-sans": '"Source Sans 3", ui-sans-serif, system-ui, sans-serif',
    "merriweather": 'Merriweather, Georgia, serif',
}

DEFAULT_PRIMARY = "#0f766e"
DEFAULT_BG = "#f3f4f6"
DEFAULT_TEXT = "#0f172a"

KIT_FIELDS = (
    "brand_name",
    "brand_logo",
    "logo_dark",
    "brand_color",
    "brand_color_secondary",
    "brand_color_accent",
    "brand_color_bg",
    "brand_color_text",
    "font_heading",
    "font_body",
    "brand_favicon",
    "og_image",
    "footer_text",
    "white_label_mode",
    "hide_product_chrome",
    "email_from_name",
    "primary_custom_domain",
)


def resolve_font(key_or_css: str | None) -> str:
    raw = (key_or_css or "").strip() or "system"
    if raw in CURATED_FONTS:
        return CURATED_FONTS[raw]
    # Allow raw CSS font-family from owner override
    if "," in raw or " " in raw or raw.startswith('"') or raw.startswith("'"):
        return raw
    return CURATED_FONTS.get(raw.lower(), CURATED_FONTS["system"])


def nearest_curated_font(css_family: str | None) -> str:
    """Map a scraped font-family string to a curated key."""
    text = (css_family or "").lower()
    for key in CURATED_FONTS:
        if key.replace("-", " ") in text or key in text:
            return key
    known = {
        "helvetica": "system",
        "arial": "system",
        "segoe": "system",
        "times": "georgia",
        "serif": "georgia",
        "sans": "system",
    }
    for needle, key in known.items():
        if needle in text:
            return key
    return "system"


def skip_tenant_kit() -> bool:
    """Control-plane / EE marketing www must not load tenant white-label kit."""
    try:
        import frappe
        from entertainment_express.control_plane.entitlements import is_control_plane

        if is_control_plane():
            return True
        site = getattr(getattr(frappe, "local", None), "site", "") or ""
        if site.startswith("www.") or site.startswith("admin."):
            return True
    except Exception:
        pass
    return False


def _attr(settings: Any, name: str, default: Any = None) -> Any:
    return getattr(settings, name, default) if settings is not None else default


def mode_from_settings(settings: Any) -> str:
    mode = (_attr(settings, "white_label_mode") or "").strip().lower()
    if mode in ("off", "portals", "full"):
        return mode
    # Back-compat before migrate
    if bool(int(_attr(settings, "hide_product_chrome", 0) or 0)):
        return "full"
    return "portals"


def hide_product_marks(settings: Any) -> bool:
    mode = mode_from_settings(settings)
    if mode == "full":
        return True
    if mode == "off":
        return False
    return bool(int(_attr(settings, "hide_product_chrome", 0) or 0))


def full_site_mode(settings: Any) -> bool:
    return mode_from_settings(settings) == "full"


def load_settings():
    if skip_tenant_kit():
        return None
    try:
        import frappe

        return frappe.get_cached_doc("EE Portal Settings", "EE Portal Settings")
    except Exception:
        return None


def kit_dict(settings: Any = None, *, overrides: dict | None = None) -> dict:
    settings = settings if settings is not None else load_settings()
    out = {k: "" for k in KIT_FIELDS}
    out["brand_color"] = DEFAULT_PRIMARY
    out["brand_color_bg"] = DEFAULT_BG
    out["brand_color_text"] = DEFAULT_TEXT
    out["font_heading"] = "system"
    out["font_body"] = "system"
    out["white_label_mode"] = "portals"
    out["hide_product_chrome"] = 0
    if settings is not None:
        for k in KIT_FIELDS:
            val = _attr(settings, k)
            if val is not None and val != "":
                out[k] = val
        out["hide_product_chrome"] = int(_attr(settings, "hide_product_chrome", 0) or 0)
        out["white_label_mode"] = mode_from_settings(settings)
    if overrides:
        for k, v in overrides.items():
            if k in out and v is not None and v != "":
                out[k] = v
    return out


def apply_brand_host_overrides(kit: dict) -> dict:
    """On brand custom hosts, EE Brand tokens override company kit for storefront chrome."""
    try:
        import frappe
        from entertainment_express.api.brand import resolve_brand
        from entertainment_express.white_label.urls import default_site_host

        host = ""
        try:
            req = getattr(frappe.local, "request", None)
            host = (getattr(req, "host", None) or "").split(":")[0].strip().lower()
        except Exception:
            host = ""
        if not host:
            return kit

        primary = (kit.get("primary_custom_domain") or "").strip().lower()
        site_host = (default_site_host() or "").strip().lower()
        # Primary domain / default site host keep the company kit
        if host and host in {primary, site_host}:
            return kit

        info = resolve_brand(host=host, path=None)
        if not info or not info.get("name"):
            return kit
        custom = (frappe.db.get_value("EE Brand", info["name"], "custom_host") or "").strip().lower()
        if custom != host:
            return kit
        if info.get("brand_name"):
            kit["brand_name"] = info["brand_name"]
        if info.get("logo"):
            kit["brand_logo"] = info["logo"]
        if info.get("primary_color"):
            kit["brand_color"] = info["primary_color"]
        if info.get("email_from"):
            kit["email_from_name"] = info["email_from"]
    except Exception:
        pass
    return kit


def preview_overrides() -> dict | None:
    """Owner-only draft kit from ?ee_brand_preview=1 + cache."""
    try:
        import frappe

        req = getattr(frappe.local, "request", None)
        args = getattr(req, "args", None) or {}
        flag = args.get("ee_brand_preview") if hasattr(args, "get") else None
        if not flag:
            form = getattr(frappe.local, "form_dict", None) or {}
            flag = form.get("ee_brand_preview")
        if str(flag or "") not in ("1", "true", "True"):
            return None
        roles = set(frappe.get_roles() or [])
        if not roles.intersection({"EE Tenant Admin", "System Manager", "Administrator"}):
            return None
        user = frappe.session.user
        site = getattr(frappe.local, "site", "") or "site"
        cached = frappe.cache().get_value(f"ee:brand_preview:{site}:{user}")
        if isinstance(cached, dict):
            return cached
    except Exception:
        return None
    return None


def store_preview_draft(payload: dict) -> None:
    try:
        import frappe

        user = frappe.session.user
        site = getattr(frappe.local, "site", "") or "site"
        frappe.cache().set_value(f"ee:brand_preview:{site}:{user}", payload, expires_in_sec=3600)
    except Exception:
        pass


def effective_kit() -> dict:
    kit = kit_dict()
    draft = preview_overrides()
    if draft:
        kit = kit_dict(overrides={**kit, **draft})
    return apply_brand_host_overrides(kit)


def css_variables(kit: dict) -> str:
    primary = kit.get("brand_color") or DEFAULT_PRIMARY
    secondary = kit.get("brand_color_secondary") or primary
    accent = kit.get("brand_color_accent") or secondary
    bg = kit.get("brand_color_bg") or DEFAULT_BG
    text = kit.get("brand_color_text") or DEFAULT_TEXT
    font_body = resolve_font(kit.get("font_body"))
    font_display = resolve_font(kit.get("font_heading"))
    return (
        ":root{"
        f"--ee-brand:{escape(str(primary), quote=True)};"
        f"--ee-brand-2:{escape(str(secondary), quote=True)};"
        f"--ee-accent:{escape(str(accent), quote=True)};"
        f"--ee-bg:{escape(str(bg), quote=True)};"
        f"--ee-text:{escape(str(text), quote=True)};"
        f"--ee-font:{escape(font_body, quote=True)};"
        f"--ee-font-display:{escape(font_display, quote=True)};"
        "}"
    )


def bootstrap_branding(kit: dict | None = None) -> dict:
    kit = kit or effective_kit()
    settings_mode = kit.get("white_label_mode") or "portals"
    hide = settings_mode == "full" or bool(int(kit.get("hide_product_chrome") or 0))
    if settings_mode == "off":
        hide = False
    name = kit.get("brand_name") or ""
    return {
        "name": name or None,
        "logo": kit.get("brand_logo") or None,
        "logo_dark": kit.get("logo_dark") or None,
        "color": kit.get("brand_color") or DEFAULT_PRIMARY,
        "color_secondary": kit.get("brand_color_secondary") or "",
        "color_accent": kit.get("brand_color_accent") or "",
        "color_bg": kit.get("brand_color_bg") or DEFAULT_BG,
        "color_text": kit.get("brand_color_text") or DEFAULT_TEXT,
        "font_heading": kit.get("font_heading") or "system",
        "font_body": kit.get("font_body") or "system",
        "favicon": kit.get("brand_favicon") or None,
        "og_image": kit.get("og_image") or None,
        "footer_text": kit.get("footer_text") or "",
        "white_label_mode": settings_mode,
        "hide_product_chrome": 1 if hide else 0,
        "email_from_name": kit.get("email_from_name") or "",
    }


def wrap_email_html(body: str, kit: dict | None = None) -> str:
    """Wrap client-facing email body with logo + footer from kit."""
    kit = kit or kit_dict()
    mode = kit.get("white_label_mode") or "portals"
    if mode == "off":
        return body
    name = escape(kit.get("brand_name") or kit.get("email_from_name") or "")
    logo = (kit.get("brand_logo") or "").strip()
    footer = (kit.get("footer_text") or "").strip()
    if not footer and name:
        footer = name
    footer = escape(footer)
    primary = escape(kit.get("brand_color") or DEFAULT_PRIMARY)
    header = ""
    if logo:
        header = (
            f'<div style="padding:16px 0 12px;border-bottom:2px solid {primary};">'
            f'<img src="{escape(logo, quote=True)}" alt="{name}" '
            f'style="max-height:48px;max-width:220px;"></div>'
        )
    elif name:
        header = (
            f'<div style="padding:16px 0 12px;border-bottom:2px solid {primary};'
            f'font-family:sans-serif;font-size:18px;font-weight:600;color:{primary};">{name}</div>'
        )
    foot = ""
    if footer:
        foot = (
            f'<div style="margin-top:24px;padding-top:12px;border-top:1px solid #e5e7eb;'
            f'font-family:sans-serif;font-size:12px;color:#64748b;">{footer}</div>'
        )
    if not header and not foot:
        return body
    return f'<div style="max-width:640px;margin:0 auto;">{header}{body}{foot}</div>'
