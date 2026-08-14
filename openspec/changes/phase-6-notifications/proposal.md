# Change: Phase 6 — Notifications (Full Multi-Channel)

## Why
Transactional email exists. Field crews and clients expect SMS, WhatsApp, and push, with opt-out, quiet hours,
delivery tracking, and fallback. A unified `send()` is the contract every other capability already uses.

## What Changes
Extend `notifications.send` to email / SMS (Twilio) / WhatsApp (Twilio) / FCM push; **Notification Log**
(append-only); **Notification Preference** (opt-in/out, quiet hours, locale); channel fallback; provider
webhooks for delivery status; retries with backoff. Missing provider credentials skip that channel with a
logged, user-visible reason and fall back — they never pretend the message was delivered.

## Impact
- Template DocType gains channels; new Log and Preference DocTypes; Twilio/FCM webhooks; scheduler for deferred
  quiet-hour sends.
- Depends on: phase-1 email `send()`.

## Non-Goals
- Marketing campaigns (phase-8).
- In-app chat.

## Requirements delivered
- `notifications`: Multi-Channel Delivery; Templates & Personalization; Preferences/Opt-Out/Quiet Hours;
  Delivery Tracking & Retries; Asynchronous Sending.
