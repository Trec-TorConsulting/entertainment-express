## 1. Classification & Routing Logic

- [x] 1.1 Add email category classification (`system` vs `client_operational`) to `notifications.py` and Notification Templates.
- [x] 1.2 Implement custom tenant SMTP lookup helper (`_get_tenant_outgoing_email_account`) in `notifications.py`.
- [x] 1.3 Add zero-fallback guardrail in `_deliver_channel`: block `client_operational` emails from sending via platform `Notifications` system SMTP if no custom tenant SMTP account is active. Log error `tenant_smtp_not_configured`.

## 2. Portal & Desk Status Alerts

- [x] 2.1 Add `get_smtp_status` API endpoint in `entertainment_express` to report custom SMTP health and configuration status for the active tenant.
- [x] 2.2 Expose SMTP configuration status banner and fields in EE Portal Settings / Owner Dashboard.

## 3. Unit Tests & Smoke Verification

- [x] 3.1 Write unit test in `test_notifications.py` verifying system emails use `Notifications` system account and client operational emails enforce tenant custom SMTP without system fallback.
- [x] 3.2 Run `python3 smoke_test.py` to ensure all tests pass cleanly.
