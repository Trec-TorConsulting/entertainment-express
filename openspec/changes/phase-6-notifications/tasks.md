# Tasks: Phase 6 — Notifications

## 1. Data
- [x] 1.1 Template channels + fallback; Notification Log; Notification Preference.

## 2. Pipeline
- [x] 2.1 Multi-channel `send()` with enqueue, preferences, quiet-hour deferral, fallback.
- [x] 2.2 Twilio SMS/WhatsApp and FCM adapters (configured-or-log-failed, never fake delivered).
- [x] 2.3 Provider webhooks update Log; hourly retry backoff.

## 3. Tests
- [x] 3.1 Opt-out blocks SMS; transactional email still sends.
- [x] 3.2 Quiet hours defer promotional; transactional sends.
- [x] 3.3 Unconfigured SMS logs failed + email fallback.
- [x] 3.4 Async: `send()` does not call provider inline.

## Definition of Done
One `send()` call can fan out to opted-in channels, honor quiet hours, and leave an auditable log.
