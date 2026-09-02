# Design: Phase 6 — Notifications (portals)

## Context

`send()` already fans out email/SMS/WhatsApp/push, honors opt-out, defers promo in quiet hours, and logs. `/owner/automations` only toggles workflow reminders. Preference lookup requires party_type+party, so a client saving “no SMS” never matches a send to their email.

## Decisions

1. **Reuse `notifications.py`.** `portal_notifications.py` wraps prefs, templates, and recent log.
2. **Prefs by email.** `_prefs` also finds Preference by Customer email, User email, or Employee user_id.
3. **UI.** AccountPanel: how we reach you. Owner Reminders: templates + last deliveries + channel ready flags. Connections: Twilio, FCM.
4. **Webhooks.** Twilio optional `EE_TWILIO_WEBHOOK_TOKEN`. FCM already token-gated. Guests may hit webhooks; they cannot hit portal APIs.
5. **Image** `0.0.78-ee` → `0.0.79-ee`.

## Risks

- [Twilio down] → log `not_configured`, email fallback, request does not raise.
- [Quiet hours wrap midnight] → existing `_in_quiet_hours` range logic; deferred daily job skips if still quiet.
