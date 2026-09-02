"""DJ software metadata exports — Serato CSV, Rekordbox XML, M3U. No audio files."""

from __future__ import annotations

import csv
import html
import io
import re

import frappe

from entertainment_express.api.portal_collaboration import is_booking_member
from entertainment_express.api.portal_owner import OWNER_ROLES

GUEST_ROLE = "EE Event Guest"
PAYER_ROLE = "EE Customer"
STAFF = OWNER_ROLES | {"EE Sales", "EE Dispatcher", "System Manager"}
CREW = {"EE Crew", "EE Entertainer"}
FORMATS = ("serato_csv", "rekordbox_xml", "m3u")


def _roles() -> set[str]:
    return set(frappe.get_roles() or [])


def _require_export(booking: str) -> None:
    roles = _roles()
    if GUEST_ROLE in roles and PAYER_ROLE not in roles:
        frappe.throw("Not allowed.", frappe.PermissionError)
    if roles.intersection(STAFF):
        return
    if roles.intersection(CREW):
        emp = frappe.db.get_value("Employee", {"user_id": frappe.session.user}, "name")
        if emp and frappe.db.exists("Crew Assignment", {"booking": booking, "crew_member": emp}):
            return
    if is_booking_member(booking) and PAYER_ROLE in roles:
        # payers can download their own playlist metadata
        return
    frappe.throw("Not allowed.", frappe.PermissionError)


def _rows(booking: str) -> list[dict]:
    if not frappe.db.exists("DocType", "Music Selection"):
        return []
    return frappe.get_all(
        "Music Selection",
        filters={"booking": booking},
        fields=["name", "category", "moment", "song", "free_text", "status", "notes"],
        order_by="creation asc",
        limit=2000,
    )


def _parse_song(raw: str) -> tuple[str, str]:
    text = (raw or "").strip()
    if " - " in text:
        artist, title = text.split(" - ", 1)
        return artist.strip(), title.strip()
    if " by " in text.lower():
        idx = text.lower().rfind(" by ")
        return text[idx + 4 :].strip(), text[:idx].strip()
    return "", text


def export_serato_csv(rows: list[dict]) -> str:
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["name", "artist", "album", "genre", "comment"])
    for r in rows:
        artist, title = _parse_song(r.get("song") or r.get("free_text") or "")
        comment = " | ".join(
            x for x in [(r.get("category") or ""), (r.get("moment") or ""), (r.get("notes") or "")] if x
        )
        w.writerow([title or "Untitled", artist, "", r.get("category") or "", comment])
    return buf.getvalue()


def export_rekordbox_xml(rows: list[dict]) -> str:
    tracks = []
    for i, r in enumerate(rows, start=1):
        artist, title = _parse_song(r.get("song") or r.get("free_text") or "")
        tracks.append(
            f'  <TRACK TrackID="{i}" Name="{html.escape(title or "Untitled")}" '
            f'Artist="{html.escape(artist)}" Kind="DJ_PLAYLIST" Comments="{html.escape(r.get("notes") or "")}" />'
        )
    body = "\n".join(tracks)
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        "<DJ_PLAYLISTS Version=\"1.0.0\">\n"
        " <COLLECTION Entries=\"%d\">\n%s\n </COLLECTION>\n"
        "</DJ_PLAYLISTS>\n"
    ) % (len(rows), body)


def export_m3u(rows: list[dict]) -> str:
    lines = ["#EXTM3U"]
    for r in rows:
        artist, title = _parse_song(r.get("song") or r.get("free_text") or "")
        label = f"{artist} - {title}" if artist else (title or "Untitled")
        lines.append(f"#EXTINF:-1,{label}")
        # Metadata-only placeholder path — never an audio URL
        safe = re.sub(r"[^\w.\-]+", "_", label)[:80]
        lines.append(f"#EE-META/{safe}")
    return "\n".join(lines) + "\n"


@frappe.whitelist()
def export_playlist(booking: str, fmt: str = "serato_csv") -> dict:
    _require_export(booking)
    key = (fmt or "serato_csv").strip().lower()
    if key not in FORMATS:
        frappe.throw("Unknown format.")
    rows = _rows(booking)
    if key == "serato_csv":
        content, mime, ext = export_serato_csv(rows), "text/csv", "csv"
    elif key == "rekordbox_xml":
        content, mime, ext = export_rekordbox_xml(rows), "application/xml", "xml"
    else:
        content, mime, ext = export_m3u(rows), "audio/x-mpegurl", "m3u"
    # Audit
    try:
        frappe.get_doc(
            {
                "doctype": "Comment",
                "comment_type": "Info",
                "reference_doctype": "Event Booking",
                "reference_name": booking,
                "content": f"DJ export {key} by {frappe.session.user} ({len(rows)} tracks)",
            }
        ).insert(ignore_permissions=True)
    except Exception:
        pass
    return {
        "format": key,
        "filename": f"{booking}-{key}.{ext}",
        "content_type": mime,
        "content": content,
        "track_count": len(rows),
    }
