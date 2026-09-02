## Why

Crew already has shift offers and check-in on `/employee/field`, but the phone workflow still cannot navigate, capture GPS, complete setup checklists, upload on-site photos, collect a host signature, report an issue, or retry those actions after a dead venue. The native Expo app from phase 4 does not replace the tenant-host PWA that `project.md` requires.

## What Changes

- Treat `/employee/field` as the **installable Field PWA** (manifest, standalone display, service worker for the shell). Native Expo remains; this phase does not rebuild it.
- Check-in records optional lat/lng and starts a timesheet-facing timestamp; maps open via a destination URL (no maps OAuth).
- Crew mark stage (`en-route` → `on-site` → `setup-complete` → `complete`) and toggle the run-sheet checklist; dispatch status follows.
- Crew upload unpublished job photos (existing `EE Deliverable`, 5 MB, `flt` unused), collect an on-site signature, and report damage / no-show / access issues (`EE Field Issue`).
- Failed field mutations queue in the browser and replay when the phone is back online.
- Assignment already emails `shift_offered`; this phase registers FCM device tokens and fans `_fcm` to those tokens when `EE_FCM_SERVER_KEY` is set. Missing FCM logs failed, never fake-delivered.
- **Override:** no Google Maps SDK, no Firebase JS SDK in the PWA, no two-way calendar (phase 13), no Desk.
- Guests 403. No `tenant`/`site` API args. No DocType names in Field copy. No `/app`.

## Capabilities

### New Capabilities

- (none) — `mobile-field-app` already exists.

### Modified Capabilities

- `mobile-field-app`: tenant-host PWA at `/employee/field` covers job list, navigate, geo check-in/out, stages, checklist, photos, signature, offline queue, issues, and push token registration.
- `identity-access`: guests cannot run field APIs; crew only act on their own assignments.
- `notifications`: `shift_offered` / issue alerts may include `push` when a device token exists; unconfigured FCM does not crash.

## Impact

- Backend: `api/field.py`; Crew Assignment geo/stage fields; DocTypes `EE Field Issue`, `EE Field Signature`, `EE Push Device`; `dispatch.crew_check_in` lat/lng; `notifications._fcm` looks up device tokens.
- Frontend: `FieldBoard` + offline queue in portal-kit; employee PWA manifest/SW; rebuild `public/employee/`.
- Tests: `tests/test_phase9_field_app.py`.
- Cluster: bump `0.0.65-ee` → `0.0.66-ee`.
- Depends on: phase-2 dispatch, phase-6 notifications, phase-7 deliverables, phase-20 employee portal.
