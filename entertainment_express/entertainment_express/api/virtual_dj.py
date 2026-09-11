"""VirtualDJ Integration & AI Virtual DJ Curation Engine.

Provides:
1. VirtualDJ Live Request Feed ("Ask The DJ" HTTP API) with secure per-booking tokens.
2. Set History Log Parsing (history.txt & XML) and fuzzy reconciliation against Music Selection.
3. AI Virtual DJ set curation engine with energy curve pacing, must-play inclusion,
   do-not-play exclusion, and graceful offline fallback.
4. Multi-tenant isolation for tokens, feeds, logs, and AI generations.
"""

from __future__ import annotations

import hashlib
import hmac
import html
import json
import re
from typing import Any

import frappe
from entertainment_express.ai.llm import UNAVAILABLE, complete
from entertainment_express.api.music_export import _parse_song
from entertainment_express.api.portal_collaboration import is_booking_member
from entertainment_express.api.portal_owner import OWNER_ROLES

GUEST_ROLE = "EE Event Guest"
PAYER_ROLE = "EE Customer"
STAFF_ROLES = OWNER_ROLES | {"EE Sales", "EE Dispatcher", "EE Office", "System Manager"}
CREW_ROLES = {"EE Crew", "EE Entertainer"}


# ---------------------------------------------------------------------------
# Permissions & Tenant Helpers
# ---------------------------------------------------------------------------

def _roles() -> set[str]:
    return set(frappe.get_roles() or [])


def _user() -> str:
    return getattr(getattr(frappe, "session", None), "user", "") or ""


def _require_booking_access(booking: str) -> None:
    """Ensure caller is authorized staff or crew assigned to this booking."""
    roles = _roles()
    user = _user()
    if user in ("Guest", "guest") or not user:
        frappe.throw("Not allowed.", frappe.PermissionError)
    if GUEST_ROLE in roles and not roles.intersection(STAFF_ROLES | CREW_ROLES):
        frappe.throw("Not allowed.", frappe.PermissionError)
    if roles.intersection(STAFF_ROLES):
        return
    if roles.intersection(CREW_ROLES):
        emp = frappe.db.get_value("Employee", {"user_id": user}, "name")
        if emp and frappe.db.exists("Crew Assignment", {"booking": booking, "crew_member": emp}):
            return
    if is_booking_member(booking) and PAYER_ROLE in roles:
        return
    frappe.throw("Not allowed.", frappe.PermissionError)


def _site_secret() -> str:
    """Derive a per-site secret ensuring multi-tenant isolation."""
    site = getattr(getattr(frappe, "local", None), "site", "") or "default"
    conf = getattr(frappe, "conf", None) or {}
    secret = (
        conf.get("secret_key")
        if isinstance(conf, dict)
        else getattr(conf, "get", lambda *_: None)("secret_key")
    ) or "vdj-secret-salt"
    return f"{site}:{secret}"


# ---------------------------------------------------------------------------
# 1. VirtualDJ Live Request Feed ("Ask The DJ")
# ---------------------------------------------------------------------------

def generate_live_token(booking: str) -> str:
    """Generate a secure HMAC-SHA256 live feed token scoped to this site and booking."""
    salt = _site_secret()
    sig = hmac.new(salt.encode("utf-8"), booking.encode("utf-8"), hashlib.sha256).hexdigest()[:24]
    return f"vdj_{booking}_{sig}"


def verify_live_token(token: str) -> str:
    """Verify live token authenticity and return booking ID. Throws 401/PermissionError if invalid."""
    if not token or not token.startswith("vdj_"):
        frappe.throw("Invalid or expired live token.", frappe.PermissionError)
    parts = token.split("_", 2)
    if len(parts) != 3:
        frappe.throw("Invalid live token format.", frappe.PermissionError)
    _, booking, sig = parts
    salt = _site_secret()
    expected_sig = hmac.new(salt.encode("utf-8"), booking.encode("utf-8"), hashlib.sha256).hexdigest()[:24]
    if not hmac.compare_digest(sig, expected_sig):
        frappe.throw("Invalid or expired live token.", frappe.PermissionError)
    if getattr(frappe.db, "table_exists", lambda *_: True)("Event Booking"):
        if not frappe.db.exists("Event Booking", booking):
            frappe.throw("Booking not found on this site.", frappe.PermissionError)
    return booking


@frappe.whitelist()
def get_or_create_live_token(booking: str) -> dict:
    """Return the secure VirtualDJ live request token and feed URL for a booking."""
    _require_booking_access(booking)
    token = generate_live_token(booking)
    base_url = (
        getattr(frappe.utils, "get_url", lambda: "")()
        if hasattr(getattr(frappe, "utils", None), "get_url")
        else ""
    )
    feed_url = f"{base_url}/api/method/entertainment_express.api.virtual_dj.get_live_requests?token={token}"
    return {
        "booking": booking,
        "token": token,
        "feed_url": feed_url,
    }


@frappe.whitelist(allow_guest=True)
def get_live_requests(token: str) -> dict:
    """
    Publicly accessible to VirtualDJ software or DJ sideview with a valid live token.
    Returns unplayed approved song requests for the event.
    """
    booking = verify_live_token(token)

    event_name = booking
    if getattr(frappe.db, "table_exists", lambda *_: True)("Event Booking"):
        event_name = (
            frappe.db.get_value("Event Booking", booking, "event_name")
            or frappe.db.get_value("Event Booking", booking, "title")
            or booking
        )

    rows = []
    if getattr(frappe.db, "table_exists", lambda *_: True)("Music Selection"):
        rows = frappe.get_all(
            "Music Selection",
            filters={
                "booking": booking,
                "status": ["in", ["approved", "requested"]],
            },
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
            ],
            order_by="creation asc",
            limit=500,
        ) or []

    requests = []
    for r in rows:
        artist, title = _parse_song(r.get("song") or r.get("free_text") or "")
        requests.append(
            {
                "id": r.get("name"),
                "title": title or "Untitled",
                "artist": artist,
                "category": r.get("category") or "general_request",
                "moment": r.get("moment") or "",
                "requested_by": r.get("requested_by") or "guest",
                "requester_name": r.get("requester_name") or "",
                "notes": r.get("notes") or "",
                "status": r.get("status") or "requested",
            }
        )

    return {
        "booking": booking,
        "event_name": event_name,
        "total_requests": len(requests),
        "requests": requests,
    }


@frappe.whitelist(allow_guest=True)
def acknowledge_request(token: str, request_id: str) -> dict:
    """
    Allows the DJ directly from VirtualDJ console or sidepanel to mark a song request as played.
    """
    booking = verify_live_token(token)
    if not request_id:
        frappe.throw("Missing request_id.")

    if not getattr(frappe.db, "table_exists", lambda *_: True)("Music Selection"):
        return {"ok": True, "request_id": request_id, "status": "played"}

    # Verify request belongs to this booking
    sel_booking = frappe.db.get_value("Music Selection", request_id, "booking")
    if sel_booking != booking:
        frappe.throw("Song request not found for this event.", frappe.PermissionError)

    try:
        doc = frappe.get_doc("Music Selection", request_id)
        doc.status = "played"
        doc.save(ignore_permissions=True)
    except Exception:
        if hasattr(frappe.db, "set_value"):
            frappe.db.set_value("Music Selection", request_id, "status", "played")

    return {
        "ok": True,
        "request_id": request_id,
        "status": "played",
    }


# ---------------------------------------------------------------------------
# 2. Set History Log Parser & Fuzzy Reconciliation
# ---------------------------------------------------------------------------

def parse_history_log(history_text: str) -> list[dict]:
    """
    Parse VirtualDJ history.txt or VirtualDJ Database XML export.
    Returns ordered list of dicts:
    [{ 'timestamp': str, 'artist': str, 'title': str, 'raw': str }]
    """
    if not history_text or not history_text.strip():
        return []

    text = history_text.strip()

    # XML Format Check
    if text.startswith("<") or "<Song" in text or "<TRACK" in text:
        try:
            import xml.etree.ElementTree as ET

            xml_str = text if text.startswith("<?xml") or (text.startswith("<") and text.endswith(">")) else f"<root>{text}</root>"
            try:
                root = ET.fromstring(xml_str)
            except Exception:
                root = ET.fromstring(f"<root>{text}</root>")

            tracks = []
            for el in root.iter():
                tag_lower = el.tag.lower()
                if tag_lower in ("song", "track"):
                    artist = el.attrib.get("Artist") or el.attrib.get("artist") or ""
                    title = (
                        el.attrib.get("Title")
                        or el.attrib.get("title")
                        or el.attrib.get("Name")
                        or el.attrib.get("name")
                        or ""
                    )
                    if not artist and not title:
                        fp = el.attrib.get("FilePath") or el.attrib.get("filepath") or ""
                        if fp:
                            artist, title = _parse_song(fp.split("/")[-1].replace("_", " "))
                    ts = el.attrib.get("PlayTime") or el.attrib.get("Date") or el.attrib.get("timestamp") or ""
                    if title or artist:
                        tracks.append(
                            {
                                "timestamp": ts,
                                "artist": artist.strip(),
                                "title": title.strip(),
                                "raw": f"{artist} - {title}" if artist else title,
                            }
                        )
            if tracks:
                return tracks
        except Exception:
            pass

    # Line-based history.txt format
    tracks = []
    for line in text.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue

        # Tab-separated check: Timestamp\tArtist\tTitle or Artist\tTitle
        if "\t" in line:
            parts = line.split("\t")
            if len(parts) >= 3:
                ts, artist, title = parts[0].strip(), parts[1].strip(), parts[2].strip()
            elif len(parts) == 2:
                ts, (artist, title) = "", (parts[0].strip(), parts[1].strip())
            else:
                ts, (artist, title) = "", _parse_song(line)
            tracks.append(
                {
                    "timestamp": ts,
                    "artist": artist,
                    "title": title,
                    "raw": line,
                }
            )
            continue

        # VirtualDJ standard line: YYYY/MM/DD HH:MM : Artist - Title
        # or HH:MM : Artist - Title
        match = re.match(
            r"^((?:\d{4}[/-]\d{2}[/-]\d{2}\s+)?\d{1,2}:\d{2}(?::\d{2})?)\s*[:\-]\s*(.*)$", line
        )
        if match:
            ts = match.group(1).strip()
            rest = match.group(2).strip()
            artist, title = _parse_song(rest)
            tracks.append(
                {
                    "timestamp": ts,
                    "artist": artist,
                    "title": title,
                    "raw": line,
                }
            )
        else:
            artist, title = _parse_song(line)
            tracks.append(
                {
                    "timestamp": "",
                    "artist": artist,
                    "title": title,
                    "raw": line,
                }
            )

    return tracks


def _normalize_string(s: str) -> str:
    """Normalize string for fuzzy music matching."""
    s = (s or "").lower()
    # Remove parenthetical / bracket info like (Club Mix), (feat. X), [Radio Edit]
    s = re.sub(r"[\(\[\{].*?[\)\]\}]", "", s)
    # Remove feat./ft. expressions
    s = re.sub(r"\b(feat\.?|ft\.?|featuring)\b.*$", "", s)
    # Strip punctuation
    s = re.sub(r"[^\w\s]", "", s)
    return " ".join(s.split())


def _similarity(a: str, b: str) -> float:
    from difflib import SequenceMatcher

    na, nb = _normalize_string(a), _normalize_string(b)
    if not na or not nb:
        return 0.0
    if na == nb:
        return 1.0
    if na in nb or nb in na:
        return 0.92
    return SequenceMatcher(None, na, nb).ratio()


def match_track_to_selection(track: dict, selections: list[dict], threshold: float = 0.70) -> dict | None:
    """Fuzzy match a played track against a list of Music Selection records."""
    t_art = track.get("artist", "")
    t_title = track.get("title", "")
    best_match = None
    best_score = 0.0

    for sel in selections:
        s_art, s_title = _parse_song(sel.get("song") or sel.get("free_text") or "")
        title_sim = _similarity(t_title, s_title)
        if t_art and s_art:
            art_sim = _similarity(t_art, s_art)
            score = (title_sim * 0.65) + (art_sim * 0.35)
        else:
            score = title_sim

        if score > best_score and score >= threshold:
            best_score = score
            best_match = sel

    return best_match if best_score >= threshold else None


@frappe.whitelist()
def reconcile_history(booking: str, history_text: str) -> dict:
    """
    Ingest VirtualDJ history.txt or XML log, fuzzy match against Music Selection records,
    and update matched selections to status='played'.
    """
    _require_booking_access(booking)
    parsed = parse_history_log(history_text)
    if not parsed:
        return {
            "booking": booking,
            "total_played": 0,
            "matched_count": 0,
            "matched": [],
            "unmatched": [],
        }

    selections = []
    if getattr(frappe.db, "table_exists", lambda *_: True)("Music Selection"):
        selections = frappe.get_all(
            "Music Selection",
            filters={"booking": booking},
            fields=["name", "category", "moment", "song", "free_text", "status", "notes"],
            limit=2000,
        ) or []

    unplayed_selections = [s for s in selections if s.get("status") != "played"]
    matched = []
    unmatched_history = []
    now_ts = (
        getattr(getattr(frappe, "utils", None), "now_datetime", lambda: "2026-09-11 12:00:00")()
    )

    for track in parsed:
        match = match_track_to_selection(track, unplayed_selections)
        if match:
            # Mark played
            try:
                doc = frappe.get_doc("Music Selection", match["name"])
                doc.status = "played"
                doc.save(ignore_permissions=True)
            except Exception:
                if hasattr(frappe.db, "set_value"):
                    frappe.db.set_value("Music Selection", match["name"], "status", "played")

            matched.append(
                {
                    "selection_id": match["name"],
                    "song": match.get("song") or match.get("free_text"),
                    "played_track": track.get("raw") or f"{track.get('artist')} - {track.get('title')}",
                    "timestamp": track.get("timestamp") or str(now_ts),
                }
            )
            unplayed_selections.remove(match)
        else:
            unmatched_history.append(track)

    user = _user()
    try:
        frappe.get_doc(
            {
                "doctype": "Comment",
                "comment_type": "Info",
                "reference_doctype": "Event Booking",
                "reference_name": booking,
                "content": f"VirtualDJ history reconciled by {user}: {len(matched)} of {len(parsed)} tracks matched.",
            }
        ).insert(ignore_permissions=True)
    except Exception:
        pass

    return {
        "booking": booking,
        "total_played": len(parsed),
        "matched_count": len(matched),
        "matched": matched,
        "unmatched": unmatched_history,
    }


# ---------------------------------------------------------------------------
# 3. AI Virtual DJ Set Curation Engine
# ---------------------------------------------------------------------------

def _get_booking_moments(booking: str, event_type: str) -> list[str]:
    """Retrieve event timeline moments or compute event type defaults."""
    moments = []
    if getattr(frappe.db, "table_exists", lambda *_: True)("Event Timeline Item"):
        # Check if booking has timeline items
        items = frappe.get_all(
            "Event Timeline Item",
            filters={"parent": booking},
            fields=["title", "moment", "activity"],
            order_by="start_time asc",
            limit=50,
        ) or []
        for it in items:
            m = it.get("moment") or it.get("title") or it.get("activity")
            if m and m not in moments:
                moments.append(m)

    if not moments:
        kind = (event_type or "").lower()
        if "wedding" in kind:
            moments = ["Cocktail Hour", "Dinner", "First Dance", "Peak Dancing", "Last Dance"]
        elif "corporate" in kind:
            moments = ["Guest Arrival & Mingling", "Dinner & Presentations", "Networking Party"]
        elif "school" in kind or "prom" in kind:
            moments = ["Arrival & Warmup", "Open Dance Floor", "Peak Energy", "Slow Song Finale"]
        else:
            moments = ["Warmup", "Open Floor", "Peak Energy", "Wind Down"]

    return moments


def _fetch_fallback_tracks(
    vibe: str,
    must_plays: list[dict],
    do_not_plays: list[dict],
    moments: list[str],
) -> list[dict]:
    """Construct rule-based fallback playlist from curated lists and must-plays."""
    tracks = []
    dnp_names = {_normalize_string(d.get("song") or d.get("free_text") or "") for d in do_not_plays}

    # 1. Add all must plays
    for mp in must_plays:
        artist, title = _parse_song(mp.get("song") or mp.get("free_text") or "")
        norm = _normalize_string(f"{artist} {title}")
        if any(d in norm for d in dnp_names if d):
            continue
        tracks.append(
            {
                "title": title or "Untitled",
                "artist": artist,
                "moment": mp.get("moment") or (moments[len(moments) // 2] if moments else "Open Floor"),
                "bpm": 120,
                "energy": 4,
                "reason": "Client Must-Play Selection",
            }
        )

    # 2. Add from Curated Playlist if available
    if getattr(frappe.db, "table_exists", lambda *_: True)("Curated Playlist Song"):
        curated_songs = frappe.get_all(
            "Curated Playlist Song",
            fields=["song"],
            limit=30,
        ) or []
        for cs in curated_songs:
            song_id = cs.get("song")
            if song_id and getattr(frappe.db, "table_exists", lambda *_: True)("Song"):
                s_doc = frappe.get_doc("Song", song_id)
                s_title = getattr(s_doc, "title", "")
                s_artist = getattr(s_doc, "artist", "")
                norm = _normalize_string(f"{s_artist} {s_title}")
                if any(d in norm for d in dnp_names if d):
                    continue
                tracks.append(
                    {
                        "title": s_title,
                        "artist": s_artist,
                        "moment": moments[len(tracks) % len(moments)] if moments else "General",
                        "bpm": 118,
                        "energy": 3,
                        "reason": f"Curated catalog selection for {vibe}",
                    }
                )

    return tracks


@frappe.whitelist()
def generate_ai_set(
    booking: str,
    vibe: str = "open-format party",
    target_bpm: int | str = 120,
    duration_minutes: int | str = 120,
) -> dict:
    """
    Generate an AI Virtual DJ set with energy curve pacing, timeline moments,
    mandatory must-plays, and strict do-not-play exclusion.
    Gracefully degrades to tenant curated library when AI is unavailable.
    """
    _require_booking_access(booking)

    try:
        bpm_val = int(target_bpm or 120)
    except (ValueError, TypeError):
        bpm_val = 120

    try:
        duration_val = int(duration_minutes or 120)
    except (ValueError, TypeError):
        duration_val = 120

    # Fetch booking info
    event_name = booking
    event_type = "Event"
    if getattr(frappe.db, "table_exists", lambda *_: True)("Event Booking"):
        b_doc = frappe.db.get_value(
            "Event Booking", booking, ["event_name", "event_type"], as_dict=True
        )
        if b_doc:
            event_name = b_doc.get("event_name") or booking
            event_type = b_doc.get("event_type") or "Event"

    # Fetch music selections
    selections = []
    if getattr(frappe.db, "table_exists", lambda *_: True)("Music Selection"):
        selections = frappe.get_all(
            "Music Selection",
            filters={"booking": booking},
            fields=["name", "category", "moment", "song", "free_text", "notes"],
            limit=500,
        ) or []

    must_plays = [s for s in selections if s.get("category") == "must_play"]
    do_not_plays = [s for s in selections if s.get("category") == "do_not_play"]
    moments = _get_booking_moments(booking, event_type)

    # Prepare structured prompt
    must_play_desc = "\n".join(
        f"- {s.get('song') or s.get('free_text')} (Moment: {s.get('moment') or 'Any'})"
        for s in must_plays
    ) or "(None specified)"

    do_not_play_desc = "\n".join(
        f"- {s.get('song') or s.get('free_text')}" for s in do_not_plays
    ) or "(None specified)"

    moments_desc = ", ".join(moments)

    prompt = (
        f"You are an expert mobile DJ performance curator.\n"
        f"Event: {event_name} ({event_type})\n"
        f"Vibe Style: {vibe}\n"
        f"Target Center BPM: {bpm_val}\n"
        f"Duration: {duration_val} minutes\n"
        f"Timeline Moments: {moments_desc}\n\n"
        f"MANDATORY MUST-PLAY SONGS (ALL OF THESE MUST BE INCLUDED):\n{must_play_desc}\n\n"
        f"PROHIBITED DO-NOT-PLAY SONGS (DO NOT INCLUDE ANY OF THESE UNDER ANY CIRCUMSTANCES):\n{do_not_play_desc}\n\n"
        f"Model a cohesive set energy curve across the timeline moments (e.g. cocktails/dinner energy 1-2 BPM 80-105, "
        f"building to open floor energy 3-4 BPM 115-125, peak party energy 5 BPM 125-130, closing slow/anthem). "
        f"Respond ONLY with a JSON array of track objects, no markdown fences, no chit-chat:\n"
        f'[{{"title": "Track Title", "artist": "Artist", "moment": "{moments[0]}", "bpm": 120, "energy": 4, "reason": "Reason"}}]'
    )

    ai_response = complete(prompt, timeout=18)
    available = bool(ai_response and ai_response != UNAVAILABLE)

    tracks = []
    if available and ai_response:
        # Strip potential markdown code fences
        clean_json = ai_response.strip()
        if clean_json.startswith("```"):
            clean_json = re.sub(r"^```(?:json)?", "", clean_json, flags=re.IGNORECASE)
            clean_json = re.sub(r"```$", "", clean_json).strip()

        try:
            parsed_json = json.loads(clean_json)
            if isinstance(parsed_json, list):
                # Strict do-not-play filtering
                dnp_normalized = [
                    _normalize_string(d.get("song") or d.get("free_text") or "")
                    for d in do_not_plays
                ]
                for item in parsed_json:
                    if not isinstance(item, dict):
                        continue
                    t_title = item.get("title") or ""
                    t_artist = item.get("artist") or ""
                    norm_item = _normalize_string(f"{t_artist} {t_title}")

                    # Check if it violates any do-not-play rule
                    is_prohibited = False
                    for dnp in dnp_normalized:
                        if dnp and (dnp in norm_item or _similarity(norm_item, dnp) > 0.8):
                            is_prohibited = True
                            break

                    if not is_prohibited and (t_title or t_artist):
                        tracks.append(
                            {
                                "title": t_title,
                                "artist": t_artist,
                                "moment": item.get("moment") or moments[0],
                                "bpm": int(item.get("bpm") or bpm_val),
                                "energy": int(item.get("energy") or 3),
                                "reason": item.get("reason") or "AI Energy Curve Match",
                            }
                        )

                # Ensure all must-plays are present
                track_titles_norm = {_normalize_string(t.get("title", "")) for t in tracks}
                for mp in must_plays:
                    mp_art, mp_title = _parse_song(mp.get("song") or mp.get("free_text") or "")
                    if _normalize_string(mp_title) not in track_titles_norm:
                        tracks.insert(
                            0,
                            {
                                "title": mp_title or "Must Play",
                                "artist": mp_art,
                                "moment": mp.get("moment") or (moments[-1] if moments else "Party"),
                                "bpm": bpm_val,
                                "energy": 4,
                                "reason": "Client Must-Play (Mandatory)",
                            },
                        )
        except Exception:
            available = False
            tracks = []

    # Fallback if AI unavailable or failed
    if not available or not tracks:
        fallback_tracks = _fetch_fallback_tracks(vibe, must_plays, do_not_plays, moments)
        return {
            "available": False,
            "message": UNAVAILABLE,
            "booking": booking,
            "vibe": vibe,
            "target_bpm": bpm_val,
            "duration_minutes": duration_val,
            "timeline_moments": moments,
            "tracks": fallback_tracks,
            "must_plays_included": len(must_plays),
            "do_not_plays_excluded": len(do_not_plays),
        }

    return {
        "available": True,
        "message": "AI Virtual DJ set curated successfully.",
        "booking": booking,
        "vibe": vibe,
        "target_bpm": bpm_val,
        "duration_minutes": duration_val,
        "timeline_moments": moments,
        "tracks": tracks,
        "must_plays_included": len(must_plays),
        "do_not_plays_excluded": len(do_not_plays),
    }
