# Tasks: Phase 14 — Hardening & Enterprise Readiness

## 1. Schema
- [x] 1.1 DocTypes EE Audit Log (append-only) and Tenant Domain (control plane). Event Booking indexes on `event_date` and `status`.
- [x] 1.2 Patch `v0_0_3.phase14_hardening`.

## 2. Security
- [x] 2.1 Site-scoped rate-limit keys; login failure lockout on this site.
- [x] 2.2 `ee_require_2fa` + privileged-role check; Administrator exempt.
- [x] 2.3 `audit.write` with secret scrub; wire owner role APIs, booking date/status, contract signed, invoice submit.
- [x] 2.4 Custom domain request/verify on this site only; operator Tenant Domain record does not `frappe.connect`.

## 3. Ops & health
- [x] 3.1 `health.ready`; Prometheus annotations; backup CronJob last-run file; `/ops` shows backup + ready.
- [x] 3.2 Optional OIDC save that never echoes secrets.

## 4. Owner UI
- [x] 4.1 `/owner/security` — two-step toggle, domains, audit list, SSO off/on without secrets. Rebuild owner SPA.

## 5. Tests
- [x] 5.1 Guest 403 on hardening APIs; no tenant/site switch args; rate-limit key includes site.
- [x] 5.2 Lockout after threshold; audit append-only; domain verify without cross-site connect.
- [x] 5.3 2FA skip when flag off; list payloads omit secrets.

## Definition of Done
Privileged users can be required to use two-step codes on this site, brute-force logins lock out, audit and backup status are visible without secrets or opening another site's database, and a verified custom hostname is stored for this site only.
