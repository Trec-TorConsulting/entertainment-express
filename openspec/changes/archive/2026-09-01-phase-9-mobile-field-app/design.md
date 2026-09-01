## Context

Phase 4 shipped `frontend/crew-app` (Expo) and `api/mobile_api_v2.py`. Phase 20 shipped `/employee/field` as a thin accept / check-in / check-out list. Baseline `mobile-field-app` and `project.md` require a **PWA on the tenant host**. This change completes that PWA. Native Expo stays; it can keep calling v2.

## Goals / Non-Goals

**Goals**

- Crew see only their assignments with time, address, role, run sheet, maps link.
- Check-in/out with timestamp and optional geolocation; dispatch cache + booking `ee_dispatch_status` update.
- Stages and checklist items propagate to the run sheet / assignment.
- Photos as unpublished `EE Deliverable`; signature + issue DocTypes with audit who/when.
- localStorage queue for field POSTs when `navigator.onLine` is false or the request fails as network/5xx.
- Push: `EE Push Device` token + existing `_fcm`; email `shift_offered` still always attempted.

**Non-Goals**

- Google/Apple Maps SDK, turn-by-turn in-app (open system maps).
- Firebase JS in the employee bundle.
- Calendar two-way sync, music/planning editors (crew read-only via existing run sheet extras).
- Object storage migration (still Long Text base64, 5 MB, same as photos).

## Decisions

1. **Surface = `/employee/field`.** Same session as Staff. Manifest `start_url` `/employee/field`, `display` standalone. Service worker at `/employee/sw.js` (www scope) caches the SPA shell only — mutations stay in the JS queue so CSRF cookies are not replayed blindly.
2. **One field API.** `entertainment_express.api.field` wraps dispatch + deliverables. Portal copy uses job/shift language. `_require_field()` denies Guest and `EE Event Guest`.
3. **Geo is optional.** Browser `geolocation` may be denied; check-in still records time. When lat/lng present, persist on the assignment and call `publish_crew_location_update`.
4. **Maps URL.** `https://www.google.com/maps/dir/?api=1&destination=` + encoded `venue_geo` or `venue_address`. No API key.
5. **Run sheet.** Assigned crew may `_ensure_run_sheet` (create defaults if missing) and toggle checklist `done`. Marking all setup items done does not auto-checkout.
6. **Media.** Crew assigned to the job may `save_deliverable` unpublished. They cannot publish (owner still does). Signature is `EE Field Signature` (png/typed name, `content_b64`, `signed_at`, `signed_by`).
7. **Issues.** `EE Field Issue` kinds `damage|no_show|access|other`. Insert notifies dispatchers via `_notify_dispatcher("field_issue")`. Open issues appear on owner Today as informational rows (ack closes).
8. **Offline queue.** Key `ee.field.queue`. Replay on `online` and FieldBoard mount. Idempotent enough: check-in from `accepted` only; duplicate check-in surfaces a friendly already-on-site message.
9. **Push tokens.** `register_push_token` stores per-user token. `_fcm` loads tokens for the recipient user/email. No token / no server key → `not_configured`, never reported delivered.
10. **Image.** `0.0.65-ee` → `0.0.66-ee`.

## Schema

**Crew Assignment** (existing): `check_in_lat`, `check_in_lng` (Float), `stage` Select `en-route|on-site|setup-complete|complete`.

**EE Field Issue:** `booking`, `assignment`, `kind`, `detail`, `photo_b64` (Long Text, optional), `status` `open|acked`, `reported_by`.

**EE Field Signature:** `booking`, `assignment`, `signer_name`, `content_b64`, `signed_at`, `signed_by`.

**EE Push Device:** `user`, `token`, `platform` `web|android|ios`.

## API (`api/field.py`)

| Method | Notes |
|---|---|
| `my_jobs` | Same payload as `portal_dispatch.my_shifts` plus `job_id`, `maps_url`, `geo`, `stage`, `checklist`, `can_stage_*` |
| `check_in` / `check_out` | Optional `latitude`, `longitude` |
| `set_stage` | Own assignment only |
| `toggle_checklist` | `booking` + item idx or child name |
| `upload_photo` | Wraps deliverables; unpublished |
| `capture_signature` | Typed name required; canvas optional |
| `report_issue` | Creates issue + notify |
| `register_push_token` | Upsert device |

No `tenant` or `site` parameters.

## UI

- Expand `FieldBoard` (portal-kit): per-job Navigate, Check in, stages, checklist, camera file input (`capture="environment"`), signature pad, issue form, queued-count banner.
- Employee `index.html`: manifest, theme-color, apple-mobile-web-app-capable.
- `www/employee/sw.js`: cache GET for `/employee` and `/assets/entertainment_express/employee/*`.

## Risks

- Geolocation on HTTP is blocked; tenants are HTTPS.
- SW scope must be `/employee/` (file lives under `www/employee/`).
- Base64 photos can bloat MariaDB — same 5 MB cap as phase 7.
