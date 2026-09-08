## Context

Mobile DJs and entertainment companies using Atomix VirtualDJ require a comprehensive two-way integration with Entertainment Express. EE currently stores client and guest `Music Selection` records (must-play, do-not-play, special moments, guest requests) and exports Serato CSV and Rekordbox XML.

This design introduces a full Virtual DJ suite:
1. Native VirtualDJ crate export (`.vdjfolder` XML and metadata-tagged M3U).
2. Live "Ask The DJ" request polling feed via tokenized HTTP API.
3. Post-gig history log parsing (`history.txt` and XML) to auto-reconcile played songs.
4. AI "Virtual DJ" automated playlist curation engine to build timeline-aligned, energy-curved sets.

## Goals / Non-Goals

**Goals:**
- **Native VirtualDJ Folder Export**: Generate valid `.vdjfolder` XML containing `<VirtualFolder>` and `<Song>` elements with track title, artist, moment, and comment tags.
- **VirtualDJ Live Request Feed**: Provide a secure token-authenticated REST endpoint for VirtualDJ software or web sideviews to poll approved live requests without leaving the performance screen.
- **History Reconciliation**: Upload and parse VirtualDJ `history.txt` logs, fuzzy-matching played tracks against `Music Selection` rows and updating their status to `played` with timestamps.
- **AI Virtual DJ Curation**: Automated set curation leveraging EE's AI assistant (Ollama) to draft structured playlists with BPM curves across event timeline phases, respecting must-play and do-not-play rules.
- **Multi-Tenant Isolation**: Enforce site-per-tenant isolation for all tokens, exports, history logs, and AI generations.

**Non-Goals:**
- Distributing or storing copyrighted audio binaries (MP3/WAV/FLAC). All integrations operate strictly on track metadata.
- Proprietary C++ DLL plugin development for VirtualDJ. Integration utilizes VirtualDJ's native folder formats, standard HTTP web request polling, and session history logs.
- Direct hardware/MIDI deck control or real-time audio analysis.

## Decisions

### D1 — Native VirtualDJ Format (`.vdjfolder`)
VirtualDJ organizes crates and playlists as XML `.vdjfolder` files. We generate a valid XML structure:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<VirtualFolder Version="8.5">
  <Song FilePath="EE-META/Artist - Title" Title="Title" Artist="Artist" Comment="Category | Moment | Notes" />
</VirtualFolder>
```
Integrated into `entertainment_express.api.music_export.export_playlist` with format key `virtualdj_folder` (`.vdjfolder`) and `virtualdj_m3u` (`.m3u`).

### D2 — Secure Tokenized Live Request Feed
VirtualDJ allows browser sidepanels or custom web requests to fetch data from HTTP URLs.
- Each `Event Booking` has a token generated on demand (`virtual_dj_token`).
- Endpoint: `entertainment_express.api.virtual_dj.get_live_requests(token)`.
- Returns lightweight JSON containing unplayed approved requests:
  ```json
  {
    "booking": "EVT-2026-0001",
    "event_name": "Smith Wedding",
    "requests": [
      {
        "id": "MS-00012",
        "title": "September",
        "artist": "Earth, Wind & Fire",
        "category": "must_play",
        "moment": "dancing",
        "requested_by": "client",
        "notes": "Play before 10pm"
      }
    ]
  }
  ```
- Endpoint: `mark_request_played(token, request_id)` allows the DJ to acknowledge and mark items as played directly from the feed interface.

### D3 — History Ingestion & Fuzzy Reconciliation
VirtualDJ logs sessions into `history.txt` with timestamped lines:
`YYYY/MM/DD HH:MM : Artist - Title`
- Endpoint `entertainment_express.api.virtual_dj.reconcile_history(booking, history_text)`.
- Normalizes track strings (strip punctuation, lower-case, remove feat./remix suffixes) and performs fuzzy matching against `Music Selection` entries for the booking.
- Matched entries are transitioned: `status = "played"`, `played_at = <timestamp>`.
- Returns reconciliation summary: `{ "total_played": N, "matched_selections": M, "unmatched": [...] }`.

### D4 — AI Virtual DJ Set Curation & Energy Curve Pacing
The AI curation engine in `entertainment_express.api.virtual_dj.generate_ai_set` uses the local Ollama LLM:
- Inputs: Event Type, Event Sub-type, Timeline Moments (e.g. Cocktail Hour, Dinner, Dancing, Last Dance), Vibe Preferences, Must-Plays, Do-Not-Plays, Target Duration.
- Prompt instructs the LLM to output a JSON tracklist mapped to moments with estimated BPM and energy levels (1–5).
- Output is validated: any do-not-play song is filtered out, must-play tracks are guaranteed in the set.
- Graceful degradation: if Ollama is unreachable, falls back to rule-based selection from tenant's `Curated List` library with `available: false` and message `"AI suggestion unavailable"`.

### D5 — File Locations & Modular Layout
- `entertainment_express/api/music_export.py`: Extend export options with `virtualdj_folder` and `virtualdj_m3u`.
- `entertainment_express/api/virtual_dj.py`: Live feed token management, request polling, history reconciliation, and AI set generation endpoints.
- `entertainment_express/tests/test_virtual_dj_integration.py`: Comprehensive test suite verifying export generation, token security, history log parsing, AI curation fallback, and multi-tenant isolation.

## Risks / Trade-offs

- **[Fuzzy Matching Discrepancies]** → Songs in VirtualDJ history might have slightly different titles or metadata compared to client submissions (e.g. "feat. Artist" or "Radio Edit").
  *Mitigation*: Implement robust fuzzy token matching and return an unmatched review list for the DJ to verify before finalizing.
- **[Live Feed Polling Load]** → Frequent polling from VirtualDJ could put load on the server during high-volume events.
  *Mitigation*: Cache live request responses in Redis with short TTL (5-10s) and enforce rate-limiting per live token.
- **[Ollama GPU Latency on Node05]** → AI generation of 30+ track sets could take several seconds.
  *Mitigation*: Run async if requested or stream/timeout within 10s with immediate fallback to curated catalog presets.

## Migration Plan

- Deploy custom field fixtures for `virtual_dj_token` on `Event Booking` if needed, or compute deterministically from booking secret HMAC.
- Whitelist new APIs in `entertainment_express/api/virtual_dj.py`.
- Run `bench migrate` across tenant sites.
- Automated tests run via `bench run-tests --app entertainment_express`.
