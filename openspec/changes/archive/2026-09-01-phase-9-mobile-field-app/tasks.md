# Tasks: Phase 9 — Mobile Field App (PWA)

> Native Expo already exists. This phase completes the tenant-host Field PWA.

## 1. Schema

- [x] 1.1 Crew Assignment `check_in_lat`, `check_in_lng`, `stage`.
      **Accept:** migrate; stage options `en-route|on-site|setup-complete|complete`.
- [x] 1.2 DocTypes `EE Field Issue`, `EE Field Signature`, `EE Push Device`.
      **Accept:** issue photo optional Long Text; signature has signed_at; device token unique per user+token.

## 2. API

- [x] 2.1 `api/field.py`: jobs, geo check-in/out, stage, checklist, photo, signature, issue, push token.
      **Accept:** guest 403; no `tenant`/`site` args; crew cannot act on another person's shift.
- [x] 2.2 `dispatch.crew_check_in` accepts optional lat/lng and publishes location; `_fcm` fans out to `EE Push Device`; `field_issue` template.
      **Accept:** missing FCM logs failed; check-in without GPS still records time.

## 3. PWA

- [x] 3.1 `FieldBoard` + offline queue: navigate, stages, checklist, camera, signature, issue, replay on `online`.
      **Accept:** no DocType names; no `/app`; EmptyState only when the crew has zero shifts.
- [x] 3.2 Manifest + `/employee/sw.js`; employee shell links; rebuild `public/employee/`.
      **Accept:** start_url `/employee/field`; SW does not intercept POSTs.

## 4. Ship

- [x] 4.1 `tests/test_phase9_field_app.py`: guest 403, isolation, own-shift only, `_fcm` uses devices.
      **Accept:** `py_compile` + pytest pattern of phase 8.
- [x] 4.2 Patch `v0_0_3/phase9_field_app.py`; bump `0.0.65-ee` → `0.0.66-ee`; ROADMAP ✅.
      **Accept:** migrate after image roll.
