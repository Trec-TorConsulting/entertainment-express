"""Music library matching — never invents availability."""

from __future__ import annotations

import frappe


def _norm(value: str) -> str:
    return " ".join((value or "").lower().split())


def find_library_song(title: str, artist: str = "") -> str | None:
    title_n = _norm(title)
    artist_n = _norm(artist)
    if not title_n:
        return None
    rows = frappe.get_all(
        "Song",
        filters={"in_library": 1},
        fields=["name", "title", "artist"],
        limit_page_length=500,
    )
    for row in rows:
        if _norm(row.title) == title_n and (not artist_n or _norm(row.artist) == artist_n):
            return row.name
    return None


def apply_library_flag(selection) -> None:
    title = ""
    artist = ""
    if selection.song:
        title = frappe.db.get_value("Song", selection.song, "title") or ""
        artist = frappe.db.get_value("Song", selection.song, "artist") or ""
        in_lib = frappe.db.get_value("Song", selection.song, "in_library")
        selection.in_library = 1 if in_lib else 0
        return
    free = selection.free_text or ""
    if " — " in free:
        title, artist = free.split(" — ", 1)
    else:
        title = free
    selection.in_library = 1 if find_library_song(title, artist) else 0


def is_do_not_play(booking: str, title: str, artist: str = "") -> bool:
    blocked = frappe.get_all(
        "Music Selection",
        filters={"booking": booking, "category": "do_not_play", "status": ["!=", "rejected"]},
        fields=["free_text", "song"],
    )
    needle = _norm(f"{title} {artist}")
    for row in blocked:
        if row.song:
            t = frappe.db.get_value("Song", row.song, "title") or ""
            a = frappe.db.get_value("Song", row.song, "artist") or ""
            if _norm(f"{t} {a}") == needle or _norm(t) == _norm(title):
                return True
        if row.free_text and _norm(row.free_text) in (needle, _norm(title)):
            return True
    return False
