## Why

SMS, WhatsApp, push, opt-out, and quiet hours already run through `notifications.send`. Owners cannot edit message copy or see delivery without Desk. Clients and crew cannot opt in or set quiet hours from `/client` or `/employee`. Unconfigured Twilio still must fail closed.

## What Changes

- Keep `notifications.send`, Log, Preference, Twilio/FCM adapters. Add `api/portal_notifications.py` for `/owner`, `/employee`, and `/client` (message language, never DocType names).
- `/owner/automations`: message templates, recent delivery, Twilio/FCM connection status. Connections lists Twilio and FCM.
- Profile on every portal: channel opt-in and quiet hours. Guests 403. Crew cannot edit company templates.
- Lookup preferences by customer/user email, not only an explicit party link. Deferred quiet-hour rows stay deferred until quiet hours end.
- No `frappe.connect` / `frappe.init`. Image `0.0.78-ee` → `0.0.79-ee`.

## Impact

- Frontends: owner, employee, customer (AccountPanel in portal-kit).
- Tests: `tests/test_phase6_surfaces.py`; live `test_phase6.py` stays unit-level.
- Patch `v0_0_3.phase6_notifications`.
- Depends on: phase-1 email `send()`.

## Non-Goals

- Phase-8 marketing campaigns.
- In-app chat.

## Requirements delivered

- `notifications`: Multi-Channel, Templates, Preferences/Opt-Out/Quiet Hours, Delivery Tracking, Async.
- `owner-portal` / `employee-portal` / `customer-portal`: messages without Desk.
