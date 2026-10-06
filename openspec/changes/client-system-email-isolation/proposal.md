## Why

Currently, when a tenant company sends client-facing operational emails (e.g., quotes, proposals, invoices, booking confirmations, or customer notifications) without a custom SMTP server configured, the system falls back to sending them via the main platform system SMTP (`info@entx.app`). If tenant clients mark these emails as spam or send to invalid addresses, it risks blacklisting and damaging the IP/domain reputation of the primary `Entertainment Express` platform.

## What Changes

- Classify all outgoing communications into two strict categories: **System Emails** (platform authentication, password resets, staff invitations, system alerts) vs **Client Operational Emails** (quotes, proposals, invoices, payment receipts, customer/host notifications, subcontractor dispatch).
- **System Emails**: Continue to use the main platform system SMTP (`Notifications` / `info@entx.app`).
- **Client Operational Emails**: Require tenant owners to configure their own custom outgoing SMTP `Email Account` in `EE Portal Settings`.
- **Fallback Guardrail**: If a tenant owner has not configured their custom outgoing email server, client operational emails will **NEVER** fall back to the main platform SMTP. Instead, they will be logged as deferred/failed with the reason `tenant_smtp_not_configured`, and a warning prompt will be displayed in the owner portal.

## Capabilities

### Modified Capabilities
- `notifications`: Implement classification, explicit sender selection, and zero-fallback guardrails for tenant client emails vs system emails.

## Impact

- `entertainment_express/notifications.py`: Added email classification logic and guardrail checking before `frappe.sendmail`.
- `EE Portal Settings`: Exposed custom SMTP configuration fields for tenant business domains.
- Control Plane / Provisioning: Main platform SMTP defaults to System-Only mode for tenant sites.
