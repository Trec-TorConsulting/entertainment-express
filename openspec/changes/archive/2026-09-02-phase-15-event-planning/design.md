# Design: Phase 15 — Event Planning Suite

> Prereq: Phase 1 bookings + notifications, Phase 2 run sheets.

## A. Data model (module: Event Planning)

| DocType | Kind | Key fields |
|---|---|---|
| Planning Form Template | parent | template_name, event_type, purpose (`planning`/`evaluation`), active, reminder_cadence_days, fields (child) |
| Planning Form Field | child | field_key, label, field_type, options, required, conditional_on_field, conditional_on_value, help_text, idx |
| Field Library Item | parent | field_key, label, field_type, options, help_text |
| Planning Form Instance | parent | booking, template, status (`not_started`/`in_progress`/`complete`), completion_percent, last_reminder_sent, answers (child) |
| Planning Form Answer | child | field_key, value, file |
| Timeline Template | parent | template_name, event_type, items (child) |
| Timeline Template Item | child | offset_minutes, duration_minutes, title, description, moment_key |
| Event Timeline | parent | booking, status (`draft`/`shared`/`finalized`), timezone, share_with_client, items (child) |
| Event Timeline Item | child | start_time, end_time, title, description, responsible, song, location, notes, visible_to_client |
| Timeline Change Request | parent | timeline, item_idx, requested_by, payload_json, status (`pending`/`approved`/`rejected`), staff_note |
| Song | parent | title, artist, album, year, genre, spotify_id, apple_id, youtube_id, preview_url, in_library |
| Music Selection | parent | booking, category, moment, song, free_text, requested_by, status, notes |
| Curated Playlist | parent | list_name, moment, genre, active, songs (child) |
| Curated Playlist Song | child | song, sort_order |
| Guest Request Link | parent | booking, token (unique), active, expires_on |

Event Booking gains `event_type` (Data).

## B. Flows

1. **Auto-attach:** on confirmed booking insert/save, match `Planning Form Template.event_type` (and purpose=planning) → create Instance if missing.
2. **Conditionals:** API returns fields with `visible` computed from answers; save rejects required hidden fields.
3. **Reminders:** daily scheduler; skip if complete or event_date < today.
4. **Evaluation:** when booking → `completed`, create evaluation instance if a matching template exists; staff can also send.
5. **Timeline:** apply template using event start as t0; client suggestions create Change Request; finalize locks client edits and stamps run sheet.
6. **Music:** client CRUD; guest POST via token; do-not-play screen (case-insensitive title+artist); library check on Song.in_library; DJ view filters + `played`.
7. **Playlist import:** Spotify client-credentials if `EE_SPOTIFY_CLIENT_ID/SECRET`; else ValidationError with setup copy.

## C. APIs

- `entertainment_express.api.planning.*`
- `entertainment_express.api.timeline.*`
- `entertainment_express.api.music.*`
- Guest: `submit_guest_request` allow_guest, token-gated.
- `get_run_sheet` returns `planning`, `timeline`, `music`.

## D. Portal

`/client/planning`, `/client/timeline`, `/client/music` (replace stub), `/guest-requests` (token query).

## E. Security

Staff roles for template CRUD. Customers may only read/write instances for bookings where Customer.email_id or Contact email matches session user. Guest token is 32+ bytes urlsafe, hashed at rest (`token_hash`).
