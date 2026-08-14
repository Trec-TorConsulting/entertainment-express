# Design: Phase 6 — Notifications

## A. Data model

Notification Template adds: `channels` (Small Text: comma list `email,sms,whatsapp,push`), `fallback_channel`, `priority` (`transactional`/`promotional`).

| DocType | Key fields |
|---|---|
| Notification Log | recipient, channel, template_key, status, provider, provider_message_id, error, related_doctype, related_name, scheduled_for |
| Notification Preference | party_type, party, email_opt_in, sms_opt_in, whatsapp_opt_in, push_opt_in, quiet_hours_start, quiet_hours_end, timezone, locale |

## B. Send pipeline

`send(key, recipient, context, channels=None, party=None)` enqueues `_deliver`.
For each channel: honor preferences (transactional email always allowed; SMS/WhatsApp require opt-in unless transactional-and-legally-required flag on template); defer if quiet hours and priority!=transactional; adapter send; write Log.

Adapters:
- email: existing `frappe.sendmail`
- sms/whatsapp: Twilio REST if `EE_TWILIO_ACCOUNT_SID/AUTH_TOKEN/FROM`
- push: FCM HTTP v1 if `EE_FCM_SERVICE_ACCOUNT` JSON path/env

Unconfigured adapter → log `failed` reason=`not_configured` and try fallback.

## C. Webhooks

`notifications_webhook_twilio`, `notifications_webhook_fcm` — guest, signature/token verified, update Log by provider_message_id.

## D. Retries

Hourly: Logs in `failed` with transient error, attempts < 5, enqueue with exponential backoff.
