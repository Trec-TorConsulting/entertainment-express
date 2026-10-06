## Context

Entertainment Express operates a site-per-tenant architecture. Currently, site bootstrap initializes a default outgoing `Email Account` named `Notifications` configured with system credentials (`info@entx.app`). When notification triggers (proposals, invoices, booking confirmations) call `frappe.sendmail`, Frappe routes them through `Notifications` by default if no other outgoing account is active.

This presents a serious reputation risk: if a tenant owner sends client proposals or invoice reminders to invalid addresses or spam traps, the main platform domain (`entx.app`) and SMTP IP can be blacklisted.

## Goals / Non-Goals

**Goals:**
- Differentiate outgoing communications into **System Emails** vs **Client Operational Emails**.
- Guarantee that System Emails (password resets, staff invites, platform security alerts) route through the platform SMTP (`Notifications` / `info@entx.app`).
- Guarantee that Client Operational Emails (proposals, quotes, invoices, booking confirmations, customer/event host notices) route exclusively through the tenant owner's custom SMTP.
- Prevent fallback to platform SMTP when custom tenant SMTP is missing, logging `tenant_smtp_not_configured` instead of risking platform reputation.
- Provide clear visual indicators in the Owner Desk and EE Portal Settings when tenant SMTP configuration is required.

**Non-Goals:**
- Provisioning individual domain DNS records (DKIM/SPF) automatically; domain DNS guidance is provided, but credentials/SMTP settings are entered by the tenant owner.

## Decisions

### Decision 1: Email Category Classification in `notifications.py`

Every notification template or trigger will be assigned an explicit category:
- `system`: `password_reset`, `user_invite`, `saas_dunning`, `system_alert`.
- `client_operational`: `proposal_sent`, `invoice_due`, `booking_confirmation`, `contract_ready`, `subcontractor_job`, `marketing_outreach`, `custom_client_message`.

### Decision 2: Routing and Zero-Fallback Guardrail

In `_deliver_channel` (`entertainment_express/notifications.py`):
1. If category is `system`: Route via `Notifications` system account (`email_id: info@entx.app`).
2. If category is `client_operational`:
   - Inspect active tenant `Email Account` records where `email_account_name != "Notifications"` and `enable_outgoing = 1`.
   - If a custom tenant account exists, deliver using that account.
   - If NO custom tenant account exists, **DO NOT** fall back to `Notifications`. Mark the log entry with `status="failed"` and `error="tenant_smtp_not_configured"`.

### Decision 3: Owner Desk & Portal Status Indicators

- Add an `ee_smtp_status` helper function exposed via API.
- Render a non-intrusive warning card in `EE Portal Settings` and Owner Flight Deck whenever `client_operational` emails are queued but tenant SMTP is missing.

## Risks / Trade-offs

- **[Risk]** New tenant owners may expect client emails to send out-of-the-box before setting up SMTP.
  - **Mitigation**: Display a setup checklist prompt during tenant onboarding and a notification banner in `EE Portal Settings` explaining why custom SMTP setup is required.
