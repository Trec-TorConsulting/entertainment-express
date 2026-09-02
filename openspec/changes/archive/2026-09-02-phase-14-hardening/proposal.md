## Why

The product can quote, sign, pay, and connect calendars, but it is not yet an enterprise-ready SaaS: login is not rate-limited per site, privileged users are not required to use two-step codes, audit trails are Comments rather than an append-only log, custom domains are unspecified, backups do not surface on `/ops`, and Redis rate-limit keys are not site-scoped.

## What Changes

- **EE Audit Log** (append-only) for role changes, money submits, contract sign, and booking date/status changes. Details are scrubbed of secrets.
- **Login lockout** and **site-scoped rate limits**. Failed logins block for a window; Redis keys include this site's name.
- **2FA for privileged roles** when this site requires it (`ee_require_2fa`). Password login remains the default; optional **OIDC** settings skip if disconnected (no live IdP in this change).
- **Custom domains** on this site: CNAME/IP verify against the default hostname; Frappe `domains` updated. Guests cannot request domains. Traefik TLS for a new apex is an operator follow-up on `/ops`.
- **Tenant Domain** on the control plane (operator record). Isolation: tenant APIs never open the admin database.
- **Health** `ready` for probes; Prometheus scrape annotations on python; backup CronJob writes `.ee_last_backup`; `/ops` shows last backup and probe status.
- **Indexes** on Event Booking `event_date` and `status`.
- Owner **Security** at `/owner/security`. Guests/crew 403. No DocType names, no `/app`.

## Impact

- New APIs in `api/hardening.py`; guards in `security/auth_hardening.py`; DocTypes EE Audit Log + Tenant Domain.
- Owner SPA rebuild; `/ops` template; bench `0.0.70-ee` → `0.0.71-ee`.
- Tests: `tests/test_phase14_hardening.py`.
- Depends on: phase-12 `/ops` and site_config flags, phase-20 owner shell.

## Non-Goals

- Implementing a full OIDC/SAML handshake (settings only; password+2FA stay the path).
- Auto-patching Traefik Ingress from tenant code (would need cluster RBAC from a tenant request).
- Destructive `bench restore` from a whitelist (preview/status only).
- Load-test harness in CI.

## Requirements delivered

- `identity-access`: User Authentication (2FA + lockout), Audit of Access & Permission Changes.
- `platform-multitenancy`: Custom domain mapping (verify + this site's Host list).
- `infrastructure-deployment`: Automated Backups (last-run stamp), health probe.
- `owner-portal`: Security workspace.
- `saas-control-plane`: Fleet health shows backup/probe status.
