"""Brand style matcher — suggest white-label kit from public URL and/or logo (phase 39)."""

from __future__ import annotations

import ipaddress
import re
import socket
from collections import Counter
from html.parser import HTMLParser
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen

import frappe

from entertainment_express.api.portal_owner import OWNER_ROLES
from entertainment_express.white_label.kit import (
    CURATED_FONTS,
    nearest_curated_font,
    store_preview_draft,
)

MAX_HTML_BYTES = 512_000
FETCH_TIMEOUT = 8
MATCH_LIMIT_PER_HOUR = 10

_HEX_RE = re.compile(r"#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b")
_RGB_RE = re.compile(
    r"rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*[\d.]+)?\s*\)",
    re.I,
)
_FONT_RE = re.compile(r"font-family\s*:\s*([^;}{]+)", re.I)
_THEME_RE = re.compile(
    r'<meta[^>]+name=["\']theme-color["\'][^>]+content=["\']([^"\']+)["\']',
    re.I,
)
_OG_IMAGE_RE = re.compile(
    r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']',
    re.I,
)
_ICON_RE = re.compile(
    r'<link[^>]+rel=["\'][^"\']*icon[^"\']*["\'][^>]+href=["\']([^"\']+)["\']',
    re.I,
)


def _require_owner() -> None:
    roles = set(frappe.get_roles() or [])
    if not roles.intersection(OWNER_ROLES | {"System Manager", "Administrator"}):
        frappe.throw("Not allowed.", frappe.PermissionError)


def _rate_limit_match() -> None:
    site = getattr(getattr(frappe, "local", None), "site", None) or "site"
    user = frappe.session.user or "Guest"
    key = f"ee:brand_style:{site}:{user}"
    try:
        cache = frappe.cache()
        count = int(cache.get_value(key) or 0) + 1
        cache.set_value(key, count, expires_in_sec=3600)
        if count > MATCH_LIMIT_PER_HOUR:
            frappe.throw("Style match rate limit exceeded. Try again later.", frappe.ValidationError)
    except frappe.ValidationError:
        raise
    except Exception:
        pass


def _is_blocked_host(hostname: str) -> bool:
    host = (hostname or "").strip().lower().rstrip(".")
    if not host or host == "localhost" or host.endswith(".localhost") or host.endswith(".local"):
        return True
    try:
        infos = socket.getaddrinfo(host, None)
    except socket.gaierror:
        return True
    for info in infos:
        ip_str = info[4][0]
        try:
            ip = ipaddress.ip_address(ip_str)
        except ValueError:
            continue
        if (
            ip.is_private
            or ip.is_loopback
            or ip.is_link_local
            or ip.is_reserved
            or ip.is_multicast
            or ip.is_unspecified
        ):
            return True
    return False


def validate_public_https_url(url: str) -> str:
    raw = (url or "").strip()
    if not raw:
        frappe.throw("URL is required.", frappe.ValidationError)
    parsed = urlparse(raw)
    if parsed.scheme != "https":
        frappe.throw("Only https URLs are allowed.", frappe.ValidationError)
    if not parsed.hostname:
        frappe.throw("Invalid URL.", frappe.ValidationError)
    if _is_blocked_host(parsed.hostname):
        frappe.throw("Private or link-local URLs are not allowed.", frappe.ValidationError)
    return raw


def _rgb_to_hex(r: int, g: int, b: int) -> str:
    return f"#{r:02x}{g:02x}{b:02x}"


def _normalize_hex(h: str) -> str:
    h = h.strip().lower()
    if len(h) == 4:
        return "#" + "".join(c * 2 for c in h[1:])
    return h


def _score_colors(hexes: list[str]) -> list[str]:
    counts: Counter[str] = Counter()
    for h in hexes:
        n = _normalize_hex(h)
        # Skip near-white / near-black neutrals for primary suggestion
        if n in ("#ffffff", "#000000", "#fff", "#000"):
            continue
        r, g, b = int(n[1:3], 16), int(n[3:5], 16), int(n[5:7], 16)
        if max(r, g, b) < 24 or min(r, g, b) > 240:
            continue
        counts[n] += 1
    return [c for c, _ in counts.most_common(6)]


class _StyleHintParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.style_blocks: list[str] = []
        self._in_style = False

    def handle_starttag(self, tag, attrs):
        if tag.lower() == "style":
            self._in_style = True

    def handle_endtag(self, tag):
        if tag.lower() == "style":
            self._in_style = False

    def handle_data(self, data):
        if self._in_style and data:
            self.style_blocks.append(data)


def _extract_from_html(html: str, base_url: str) -> dict:
    colors: list[str] = []
    for m in _THEME_RE.finditer(html):
        val = m.group(1).strip()
        if val.startswith("#"):
            colors.append(val)
        else:
            rgb = _RGB_RE.search(val)
            if rgb:
                colors.append(_rgb_to_hex(int(rgb.group(1)), int(rgb.group(2)), int(rgb.group(3))))
    colors.extend(_HEX_RE.findall(html))
    for m in _RGB_RE.finditer(html):
        colors.append(_rgb_to_hex(int(m.group(1)), int(m.group(2)), int(m.group(3))))

    parser = _StyleHintParser()
    try:
        parser.feed(html)
    except Exception:
        pass
    style_text = "\n".join(parser.style_blocks)
    fonts = [_FONT_RE.findall(style_text) or _FONT_RE.findall(html)]
    flat_fonts = [f.strip() for group in fonts for f in group]

    favicon = ""
    for m in _ICON_RE.finditer(html):
        favicon = urljoin(base_url, m.group(1).strip())
        break
    logo_url = ""
    for m in _OG_IMAGE_RE.finditer(html):
        logo_url = urljoin(base_url, m.group(1).strip())
        break

    ranked = _score_colors(colors)
    font_key = nearest_curated_font(flat_fonts[0] if flat_fonts else None)
    return {
        "colors": {
            "primary": ranked[0] if ranked else "",
            "secondary": ranked[1] if len(ranked) > 1 else "",
            "accent": ranked[2] if len(ranked) > 2 else "",
            "candidates": ranked,
        },
        "fonts": {
            "heading": font_key,
            "body": font_key,
            "candidates": list(CURATED_FONTS.keys()),
        },
        "logo_url": logo_url,
        "favicon_url": favicon,
        "confidence": 0.55 if ranked else 0.25,
    }


def _fetch_html(url: str) -> str:
    req = Request(
        url,
        headers={
            "User-Agent": "EntertainmentExpressBrandMatcher/1.0",
            "Accept": "text/html,application/xhtml+xml",
        },
        method="GET",
    )
    with urlopen(req, timeout=FETCH_TIMEOUT) as resp:  # noqa: S310 — URL validated above
        # Re-check redirects landed on public host
        final = resp.geturl() or url
        validate_public_https_url(final)
        data = resp.read(MAX_HTML_BYTES + 1)
        if len(data) > MAX_HTML_BYTES:
            data = data[:MAX_HTML_BYTES]
        charset = "utf-8"
        ctype = resp.headers.get_content_charset() if hasattr(resp.headers, "get_content_charset") else None
        if ctype:
            charset = ctype
        return data.decode(charset, errors="ignore")


def _sample_logo_colors(file_url: str) -> list[str]:
    """Sample dominant hues from an attached logo when PIL is available."""
    path = (file_url or "").strip()
    if not path:
        return []
    try:
        from PIL import Image  # type: ignore
    except Exception:
        return []
    try:
        # Resolve File attach to local path when possible
        local = path
        if path.startswith("/files/") or path.startswith("/private/files/"):
            local = frappe.get_site_path(*path.lstrip("/").split("/"))
        elif path.startswith("http"):
            validate_public_https_url(path)
            req = Request(path, headers={"User-Agent": "EntertainmentExpressBrandMatcher/1.0"})
            with urlopen(req, timeout=FETCH_TIMEOUT) as resp:  # noqa: S310
                from io import BytesIO

                img = Image.open(BytesIO(resp.read(MAX_HTML_BYTES))).convert("RGB")
                return _quantize_colors(img)
        img = Image.open(local).convert("RGB")
        return _quantize_colors(img)
    except Exception:
        return []


def _quantize_colors(img) -> list[str]:
    small = img.resize((48, 48))
    counts: Counter[str] = Counter()
    for px in small.getdata():
        r, g, b = px[0], px[1], px[2]
        if max(r, g, b) < 24 or min(r, g, b) > 240:
            continue
        # Bucket to reduce noise
        r, g, b = (r // 16) * 16, (g // 16) * 16, (b // 16) * 16
        counts[_rgb_to_hex(r, g, b)] += 1
    return [c for c, _ in counts.most_common(5)]


@frappe.whitelist()
def match_style(website_url: str | None = None, logo: str | None = None) -> dict:
    """Suggest a white-label kit from a public https URL and/or logo path. Does not store HTML."""
    _require_owner()
    _rate_limit_match()
    url = (website_url or "").strip()
    logo_path = (logo or "").strip()
    if not url and not logo_path:
        frappe.throw("Provide a website URL and/or logo.", frappe.ValidationError)

    suggestion = {
        "colors": {"primary": "", "secondary": "", "accent": "", "candidates": []},
        "fonts": {"heading": "system", "body": "system", "candidates": list(CURATED_FONTS.keys())},
        "logo_url": logo_path,
        "favicon_url": "",
        "confidence": 0.2,
        "source": [],
    }

    if url:
        safe = validate_public_https_url(url)
        html = _fetch_html(safe)
        # Intentionally do not persist HTML
        extracted = _extract_from_html(html, safe)
        suggestion.update(
            {
                "colors": extracted["colors"],
                "fonts": extracted["fonts"],
                "logo_url": logo_path or extracted.get("logo_url") or "",
                "favicon_url": extracted.get("favicon_url") or "",
                "confidence": extracted.get("confidence") or 0.5,
            }
        )
        suggestion["source"].append("website")

    if logo_path:
        sampled = _sample_logo_colors(logo_path)
        if sampled:
            colors = suggestion["colors"]
            if not colors.get("primary"):
                colors["primary"] = sampled[0]
            if not colors.get("secondary") and len(sampled) > 1:
                colors["secondary"] = sampled[1]
            if not colors.get("accent") and len(sampled) > 2:
                colors["accent"] = sampled[2]
            merged = list(dict.fromkeys((colors.get("candidates") or []) + sampled))
            colors["candidates"] = merged[:8]
            suggestion["confidence"] = max(float(suggestion.get("confidence") or 0), 0.45)
        suggestion["logo_url"] = logo_path
        suggestion["source"].append("logo")

    # Stash as preview draft for ?ee_brand_preview=1
    draft = {
        "brand_color": suggestion["colors"].get("primary") or "",
        "brand_color_secondary": suggestion["colors"].get("secondary") or "",
        "brand_color_accent": suggestion["colors"].get("accent") or "",
        "font_heading": suggestion["fonts"].get("heading") or "system",
        "font_body": suggestion["fonts"].get("body") or "system",
        "brand_logo": suggestion.get("logo_url") or "",
        "brand_favicon": suggestion.get("favicon_url") or "",
    }
    store_preview_draft(draft)
    suggestion["preview_draft"] = draft
    return suggestion


@frappe.whitelist()
def apply_brand_suggestion(suggestion: dict | str | None = None) -> dict:
    """Apply a matcher suggestion (or preview draft) to EE Portal Settings."""
    _require_owner()
    payload = frappe.parse_json(suggestion) if isinstance(suggestion, str) else (suggestion or {})
    if not isinstance(payload, dict):
        frappe.throw("Invalid suggestion.", frappe.ValidationError)

    colors = payload.get("colors") if isinstance(payload.get("colors"), dict) else {}
    fonts = payload.get("fonts") if isinstance(payload.get("fonts"), dict) else {}
    draft = payload.get("preview_draft") if isinstance(payload.get("preview_draft"), dict) else {}

    from entertainment_express.api import portal_owner

    return portal_owner.save_brand(
        brand_color=draft.get("brand_color") or colors.get("primary") or None,
        brand_color_secondary=draft.get("brand_color_secondary") or colors.get("secondary") or None,
        brand_color_accent=draft.get("brand_color_accent") or colors.get("accent") or None,
        font_heading=draft.get("font_heading") or fonts.get("heading") or None,
        font_body=draft.get("font_body") or fonts.get("body") or None,
        brand_logo=draft.get("brand_logo") or payload.get("logo_url") or None,
        brand_favicon=draft.get("brand_favicon") or payload.get("favicon_url") or None,
        white_label_mode=payload.get("white_label_mode") or "full",
    )
