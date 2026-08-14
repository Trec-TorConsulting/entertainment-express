"""Music planning APIs — client lists, guest requests, DJ play view, import."""

from __future__ import annotations

import hashlib
import json
import os
import secrets
from urllib.parse import urlencode
from urllib.request import Request, urlopen

import frappe
from frappe.utils import getdate

from entertainment_express.event_planning.music_lib import is_do_not_play
from entertainment_express.security.access import assert_booking_access, require_roles


STAFF = ["EE Tenant Admin", "EE Sales", "EE Dispatcher", "EE Crew", "System Manager"]


def _hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


@frappe.whitelist()
def list_selections(booking_name: str, category: str | None = None) -> list:
    assert_booking_access(booking_name)
    filters = {"booking": booking_name}
    if category:
        filters["category"] = category
    return frappe.get_all(
        "Music Selection",
        filters=filters,
        fields=[
            "name",
            "category",
            "moment",
            "song",
            "free_text",
            "requested_by",
            "requester_name",
            "status",
            "notes",
            "in_library",
        ],
        order_by="category, creation",
    )


@frappe.whitelist()
def add_selection(
    booking_name: str,
    category: str,
    free_text: str = "",
    song: str = "",
    moment: str = "",
    notes: str = "",
) -> dict:
    assert_booking_access(booking_name)
    if category not in ("must_play", "do_not_play", "special_moment", "general_request"):
        frappe.throw("Unknown music list.")
    if category != "do_not_play" and is_do_not_play(booking_name, free_text):
        frappe.throw("That song is on the do-not-play list for this event.")
    doc = frappe.get_doc(
        {
            "doctype": "Music Selection",
            "booking": booking_name,
            "category": category,
            "free_text": free_text,
            "song": song or None,
            "moment": moment,
            "notes": notes,
            "requested_by": "staff" if frappe.session.user != "Guest" else "client",
            "status": "approved" if category != "general_request" else "requested",
        }
    )
    if not require_staff_silent():
        doc.requested_by = "client"
    doc.insert(ignore_permissions=True)
    frappe.db.commit()
    return {"name": doc.name, "in_library": doc.in_library}


def require_staff_silent() -> bool:
    from entertainment_express.security.access import is_staff

    return is_staff()


@frappe.whitelist()
def remove_selection(name: str) -> dict:
    doc = frappe.get_doc("Music Selection", name)
    assert_booking_access(doc.booking)
    if doc.status == "played":
        frappe.throw("Played songs stay on the record for the event archive.")
    frappe.delete_doc("Music Selection", name, ignore_permissions=True)
    frappe.db.commit()
    return {"status": "removed"}


@frappe.whitelist()
def mark_played(name: str) -> dict:
    require_roles(*STAFF)
    frappe.db.set_value("Music Selection", name, "status", "played")
    return {"status": "played"}


@frappe.whitelist()
def play_view(booking_name: str) -> dict:
    require_roles(*STAFF)
    assert_booking_access(booking_name)
    rows = list_selections(booking_name)
    grouped = {"must_play": [], "do_not_play": [], "special_moment": [], "general_request": []}
    for row in rows:
        grouped.setdefault(row["category"], []).append(row)
    return {"booking": booking_name, "lists": grouped}


@frappe.whitelist()
def curated_lists(moment: str = "") -> list:
    filters = {"active": 1}
    if moment:
        filters["moment"] = moment
    lists = frappe.get_all("Curated Playlist", filters=filters, fields=["name", "list_name", "moment", "genre"])
    out = []
    for lst in lists:
        songs = frappe.get_all(
            "Curated Playlist Song",
            filters={"parent": lst.name},
            fields=["song", "sort_order"],
            order_by="sort_order",
        )
        detail = []
        for s in songs:
            detail.append(
                {
                    "song": s.song,
                    "title": frappe.db.get_value("Song", s.song, "title"),
                    "artist": frappe.db.get_value("Song", s.song, "artist"),
                    "preview_url": frappe.db.get_value("Song", s.song, "preview_url"),
                }
            )
        out.append({**lst, "songs": detail})
    return out


@frappe.whitelist()
def choose_curated(booking_name: str, song: str, moment: str) -> dict:
    assert_booking_access(booking_name)
    return add_selection(booking_name, "special_moment", song=song, moment=moment)


@frappe.whitelist()
def create_guest_link(booking_name: str, expires_on: str | None = None) -> dict:
    require_roles("EE Tenant Admin", "EE Sales", "EE Dispatcher", "System Manager")
    token = secrets.token_urlsafe(32)
    doc = frappe.get_doc(
        {
            "doctype": "Guest Request Link",
            "booking": booking_name,
            "token_hash": _hash(token),
            "active": 1,
            "expires_on": expires_on or frappe.db.get_value("Event Booking", booking_name, "event_date"),
        }
    )
    doc.insert()
    frappe.db.commit()
    return {
        "name": doc.name,
        "url": f"/guest-requests?token={token}",
        "token": token,
    }


@frappe.whitelist(allow_guest=True)
def guest_context(token: str) -> dict:
    link = _resolve_link(token)
    booking = frappe.get_doc("Event Booking", link.booking)
    return {
        "event_name": booking.event_name,
        "event_date": str(booking.event_date),
        "company": frappe.defaults.get_user_default("Company")
        or frappe.db.get_single_value("Global Defaults", "default_company"),
    }


@frappe.whitelist(allow_guest=True)
def submit_guest_request(token: str, title: str, artist: str = "", requester_name: str = "") -> dict:
    link = _resolve_link(token)
    title = (title or "").strip()
    if not title or len(title) > 140:
        frappe.throw("Please enter a song title.")
    if is_do_not_play(link.booking, title, artist):
        frappe.throw("That song cannot be requested for this event.")
    free = f"{title} — {artist}".strip(" —")
    doc = frappe.get_doc(
        {
            "doctype": "Music Selection",
            "booking": link.booking,
            "category": "general_request",
            "free_text": free,
            "requested_by": "guest",
            "requester_name": (requester_name or "Guest")[:140],
            "status": "requested",
        }
    )
    doc.insert(ignore_permissions=True)
    frappe.db.commit()
    return {"status": "queued", "in_library": doc.in_library}


def _resolve_link(token: str):
    if not token:
        frappe.throw("This request link is missing.")
    name = frappe.db.get_value("Guest Request Link", {"token_hash": _hash(token), "active": 1}, "name")
    if not name:
        frappe.throw("This request link is invalid or has been turned off.")
    link = frappe.get_doc("Guest Request Link", name)
    if link.expires_on and getdate(link.expires_on) < getdate():
        frappe.throw("This request link has expired.")
    return link


@frappe.whitelist()
def import_playlist(booking_name: str, playlist_url: str, category: str = "must_play") -> dict:
    assert_booking_access(booking_name)
    tracks = fetch_playlist_tracks(playlist_url)
    created = []
    skipped = []
    for track in tracks:
        free = f"{track['title']} — {track['artist']}"
        if is_do_not_play(booking_name, track["title"], track["artist"]):
            skipped.append(free)
            continue
        song_name = _ensure_song(track)
        result = add_selection(booking_name, category, free_text=free, song=song_name)
        created.append(result["name"])
    return {"imported": len(created), "skipped_do_not_play": skipped}


def fetch_playlist_tracks(playlist_url: str) -> list[dict]:
    url = (playlist_url or "").strip()
    if "open.spotify.com/playlist/" in url:
        return _spotify_tracks(url)
    frappe.throw(
        "Paste a Spotify playlist link. Apple Music and YouTube import need provider keys — "
        "ask your operator to configure them, or add songs individually."
    )


def _spotify_tracks(playlist_url: str) -> list[dict]:
    client_id = os.environ.get("EE_SPOTIFY_CLIENT_ID", "")
    client_secret = os.environ.get("EE_SPOTIFY_CLIENT_SECRET", "")
    if not client_id or not client_secret:
        frappe.throw(
            "Spotify import is not configured on this site. Add songs one at a time, "
            "or ask your operator to set Spotify API credentials."
        )
    playlist_id = playlist_url.rstrip("/").split("/")[-1].split("?")[0]
    token_req = Request(
        "https://accounts.spotify.com/api/token",
        data=urlencode({"grant_type": "client_credentials"}).encode(),
        headers={
            "Authorization": "Basic "
            + __import__("base64").b64encode(f"{client_id}:{client_secret}".encode()).decode(),
            "Content-Type": "application/x-www-form-urlencoded",
        },
        method="POST",
    )
    with urlopen(token_req, timeout=20) as resp:
        access = json.loads(resp.read().decode())["access_token"]
    tracks = []
    api = f"https://api.spotify.com/v1/playlists/{playlist_id}/tracks?limit=100"
    while api:
        req = Request(api, headers={"Authorization": f"Bearer {access}"})
        with urlopen(req, timeout=20) as resp:
            payload = json.loads(resp.read().decode())
        for item in payload.get("items") or []:
            track = (item or {}).get("track") or {}
            artists = ", ".join(a.get("name", "") for a in track.get("artists") or [])
            if track.get("name"):
                tracks.append(
                    {
                        "title": track["name"],
                        "artist": artists,
                        "spotify_id": track.get("id"),
                        "preview_url": track.get("preview_url"),
                    }
                )
        api = payload.get("next")
    if not tracks:
        frappe.throw("That Spotify playlist had no playable tracks.")
    return tracks


def _ensure_song(track: dict) -> str:
    existing = frappe.db.get_value(
        "Song",
        {"title": track["title"], "artist": track["artist"]},
        "name",
    )
    if existing:
        return existing
    doc = frappe.get_doc(
        {
            "doctype": "Song",
            "title": track["title"],
            "artist": track["artist"],
            "spotify_id": track.get("spotify_id"),
            "preview_url": track.get("preview_url"),
            "in_library": 0,
        }
    )
    doc.insert(ignore_permissions=True)
    return doc.name
