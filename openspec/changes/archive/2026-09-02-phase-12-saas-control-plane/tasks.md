# Tasks: Phase 12 — SaaS Control Plane (Full)

## 1. Schema (already on disk)
- [x] 1.1 Subscription, Usage Record (append-only), SaaS Invoice.
- [x] 1.2 Plan fields: price_annual, stripe prices, grace_days.
- [x] 1.3 Plan `allow_overages` + `stripe_usage_price`; Tenant `backup_ref`.

## 2. Entitlements & trial
- [x] 2.1 `has_entitlement` reads `site_config` only; ignore `site_name`; `push_plan_to_site`.
- [x] 2.2 Provisioner starts trial/active Subscription and pushes flags.
- [x] 2.3 Plan change re-applies entitlements; enforce max bookings / staff / marketing.

## 3. Billing & lifecycle
- [x] 3.1 Stripe checkout (operator + owner slug metadata) + webhook on admin only.
- [x] 3.2 Paid advances period; fail → past_due → suspend after grace; cancel at period end.
- [x] 3.3 Suspend/resume via `ee_suspended`; deprovision backups then drop-site.

## 4. Metering & fleet
- [x] 4.1 Daily `collect_all_tenants` via `bench --site`; Usage Record; overage hook.
- [x] 4.2 `/ops` tenant table from `fleet_dashboard` (plan, status, MRR, failed jobs, last activity).

## 5. Owner Plan
- [x] 5.1 `/owner/plan` — status, formatted price, Pay, Cancel. Guests/crew 403.

## 6. Tests
- [x] 6.1 Subscription paid / failed / cancel (no live Stripe).
- [x] 6.2 Suspended site blocked; entitlement deny from site_config; no site switch via `site_name`.
- [x] 6.3 Usage records append-only; `collect_local_metrics` has no tenant arg.

## Definition of Done
A tenant can start a trial, convert via Stripe, be dunned and suspended, be deprovisioned only after a backup ref is stored, and the operator can see fleet MRR and health on `/ops`.
