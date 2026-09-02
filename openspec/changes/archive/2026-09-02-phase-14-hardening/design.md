# Design: Phase 14 — Hardening & Enterprise Readiness

## Context

Phase 12/13 shipped billing and integrations. Remaining enterprise gaps: OWASP login/brute-force, privileged 2FA, a real audit table, custom hostnames, backup observability, and site-scoped Redis keys. Tenant code must never `frappe.connect` another site. Secrets never log.

## Goals / Non-Goals

**Goals:** append-only audit; lockout; 2FA flag; custom domain verify on this site; `/ops` backup+ready; site-scoped rate limits; Event Booking indexes; owner Security page.

**Non-Goals:** live SSO protocol; kubectl from Frappe; executing restore; multi-region; WAF appliance.

## Decisions

1. **EE Audit Log** DocType on this site. `before_save` rejects updates. `security.audit.write(action, related_doctype, related_name, before, after)` scrubs keys matching `password|secret|token|authorization|sk_`. `portal_owner._audit` calls it. Hooks: Event Booking `on_update` (date/status), EE Contract signed, Sales Invoice `on_submit`. List API returns action/actor/when/related — never raw passwords.

2. **Rate limits** `ee:rl:{site}:{identity}:{window}`. Login attempts: `ee:login:{site}:{user-or-ip}` — 8 failures / 15 min then lockout 15 min. Hook `before_request` on `/api/method/login` and `frappe.auth.login`. Guest 429, not 500.

3. **2FA.** `site_config.ee_require_2fa`. When 1, `EE Tenant Admin` / `SaaS Operator` / `System Manager` (except `Administrator` for bench) must have Frappe TOTP (`frappe.twofactor` if present, else User `enabled_2fa`). Exempt: `/login`, `/api/method/login`, two-factor endpoints, `hardening.security_status`. Owner toggle writes site_config only (this site).

4. **SSO.** `hardening.save_sso({issuer, client_id, client_secret})` stores secret in Integration Config `oidc` if that provider exists, else site_config Password-like JSON via Integration Config insert of provider `oidc`. List/status never returns the secret. If disconnected, password login is unchanged.

5. **Custom domains.** Owner `request_custom_domain(hostname)` / `verify_custom_domain(hostname)` / `list_custom_domains`. Hostname DNS-safe, not `admin`/`www`/`api`. Verify: `getaddrinfo` for hostname shares at least one IP with this site's default host (`frappe.local.site` or `host_name`). On verify, append to `site_config.domains`. No `tenant`/`site` switch args. Control-plane **Tenant Domain** is operator-only (`record_tenant_domain`) for `/ops` listing — does not query tenant DBs.

6. **Health.** `api.health.ready` allow_guest: `SELECT 1` against this site's DB; `{ok: true}`. No other site name. Prometheus annotations on `frappe-python` only: `prometheus.io/scrape=true`, path `/api/method/entertainment_express.api.health.ping`.

7. **Backups.** CronJob writes `/home/frappe/frappe-bench/sites/.ee_last_backup` (ISO timestamp) after `bench --site all backup`. `/ops` and `hardening.backup_status` (ops roles) read that file. Restore is not a whitelist; copy on `/ops`: restore is `bench --site <this-site> restore` from MinIO `ee-backups/` by the operator.

8. **Indexes.** Event Booking `event_date` and `status` `search_index: 1`.

9. **UI.** `/owner/security` — two-step, domain, audit table, SSO off copy. `/ops` — last backup, ready ok. Image `0.0.70-ee` → `0.0.71-ee`.

## Risks

- [Frappe TOTP API differs by version] → treat missing twofactor as "not enabled" and show setup copy; do not lock `Administrator`.
- [Custom domain TLS] → verified Host works only after Traefik has the host; `/ops` lists hostnames for the operator.
- [Shared Redis] → all new keys include `frappe.local.site`.

## Migration

Patch `v0_0_3.phase14_hardening`: no-op besides DocTypes from JSON. Rollback: previous bench tag; `ee_require_2fa` off.
