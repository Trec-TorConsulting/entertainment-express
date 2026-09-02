# Tasks: Phase 6 — Notifications

> Pipeline already exists. This pass is portals, preference lookup, and isolation tests.

## 1. Prefs + portal API
- [x] 1.1 Preference lookup by customer/user email; deferred rows stay deferred while still in quiet hours.
- [x] 1.2 `api/portal_notifications.py`: my prefs, templates, recent delivery. Guests 403. Crew cannot edit templates.

## 2. UI
- [x] 2.1 AccountPanel: channel opt-in and quiet hours on owner, employee, and client.
- [x] 2.2 `/owner/automations`: templates and delivery log. Connections: Twilio and FCM. Rebuild SPAs.

## 3. Tests + ship
- [x] 3.1 `tests/test_phase6_surfaces.py`.
- [x] 3.2 Patch `phase6_notifications`; image `0.0.78-ee` → `0.0.79-ee`; ROADMAP linked.

## Definition of Done
A client can opt out of SMS from `/client`. Owner can edit message copy and see deliveries on Reminders. Unconfigured Twilio never reports delivered. Guests 403.
