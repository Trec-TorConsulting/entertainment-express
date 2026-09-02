"""HTML sanitization for tenant website pages (allowlist, no script)."""

from __future__ import annotations

import html
import re
from html.parser import HTMLParser


ALLOWED_TAGS = {
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "a",
    "ul",
    "ol",
    "li",
    "h1",
    "h2",
    "h3",
    "h4",
    "blockquote",
    "img",
    "div",
    "span",
}
ALLOWED_ATTRS = {
    "a": {"href", "title", "rel", "target"},
    "img": {"src", "alt", "title", "width", "height"},
    "div": {"class"},
    "span": {"class"},
    "p": {"class"},
}


class _Sanitizer(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self._out: list[str] = []

    def handle_starttag(self, tag, attrs):
        tag = tag.lower()
        if tag not in ALLOWED_TAGS:
            return
        allowed = ALLOWED_ATTRS.get(tag, set())
        parts = []
        for key, val in attrs:
            key = (key or "").lower()
            if key not in allowed or val is None:
                continue
            if key in ("href", "src") and re.match(r"(?i)^\s*javascript:", val or ""):
                continue
            if key == "href" and not re.match(r"(?i)^(https?:|mailto:|/|#)", val or ""):
                continue
            if key == "src" and not re.match(r"(?i)^(https?:|/)", val or ""):
                continue
            parts.append(f'{key}="{html.escape(val, quote=True)}"')
        attr_s = (" " + " ".join(parts)) if parts else ""
        if tag == "br":
            self._out.append("<br/>")
        else:
            self._out.append(f"<{tag}{attr_s}>")

    def handle_endtag(self, tag):
        tag = tag.lower()
        if tag in ALLOWED_TAGS and tag != "br":
            self._out.append(f"</{tag}>")

    def handle_data(self, data):
        self._out.append(html.escape(data))

    def handle_entityref(self, name):
        self._out.append(f"&{name};")

    def handle_charref(self, name):
        self._out.append(f"&#{name};")

    def result(self) -> str:
        return "".join(self._out)


def sanitize_html(raw: str | None) -> str:
    """Strip disallowed tags/attrs; neutralize javascript: URLs."""
    if not raw:
        return ""
    # Drop script/style blocks entirely
    cleaned = re.sub(r"(?is)<(script|style)[^>]*>.*?</\1>", "", raw)
    parser = _Sanitizer()
    try:
        parser.feed(cleaned)
        parser.close()
        return parser.result()
    except Exception:
        return html.escape(re.sub(r"<[^>]+>", "", cleaned))
