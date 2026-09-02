# Design: Phase 12 — SaaS Control Plane (Full)

## Context

Phase 1 provisioned tenants and seeded Plans. Phase 10 showed fleet MRR on `/ops` from control-plane DocTypes. Phase 11 added `ai_assistant` on site_config. Subscription / Usage Record / SaaS Invoice DocTypes and a Stripe webhook stub already exist, but trial does not start on provision, tenant sites do not enforce plan limits (they look up `Tenant` which only has rows on admin), metering never runs, deprovision drops the site with `--no-backup`, and cancel-at-period-end is not applied.

Tenant feature code still MUST NOT `frappe.connect` / `frappe.init` another site. Control-plane jobs may touch tenant sites the same way the provisioner already does: `bench --site` and writing that site’s `site_config.json`.

## Goals / Non-Goals

**Goals:** trial on provision; Stripe checkout / renew / dunning / cancel; entitlements pushed to tenant `site_config` and enforced there; daily usage records; overage to Stripe when the plan allows; operator fleet list; suspend / resume / deprovision-with-backup; owner **Plan** page that only reads this site’s flags.

**Non-Goals:** tenant charging their customers (phase 5); custom domains (phase 14); marketing website signup UX (phase 19 already has start-trial); Metabase; querying tenant MariaDB from `/ops` request handlers.

## Decisions

1. **Entitlements live on the tenant site.** `has_entitlement` reads `frappe.conf.ee_entitlements` (and `ee_ai_assistant` for that flag). Missing key = allow (existing sites). The optional `site_name` argument is ignored so callers cannot switch databases. Control plane `push_plan_to_site(tenant)` writes flags via `site_config.json` (same file-write the suspend flag already uses). Never `SELECT` from the admin `Plan` table on a tenant request.

2. **Trial is a control-plane Subscription.** After provision marks Tenant `active`, `_ensure_subscription` inserts `trialing` when `Plan.trial_days > 0`, else `active`, and pushes period/status/price display strings to the tenant site. Money strings are `fmt_money` from the control plane.

3. **Stripe webhook only on the control-plane site.** `saas_stripe_webhook` no-ops unless `ee_control_plane` or the site hostname starts with `admin.`. Signature verified; `Stripe Processed Event` dedupes. `invoice.paid` records SaaS Invoice, sets Subscription `active`, advances period. `invoice.payment_failed` → `past_due` + `saas_dunning` + `grace_until`. Hourly `apply_dunning` suspends after grace. `customer.subscription.deleted` sets `canceled`. Checkout Session metadata carries `tenant` and/or `tenant_slug`.

4. **Tenant pay / cancel without opening admin DB.** Owner `create_subscription_checkout` (no tenant arg) uses Stripe with `tenant_slug` from `ee_tenant_slug`. Owner `request_cancel` sets `ee_cancel_requested=1` on this site. Control-plane hourly `apply_cancellations` reads each tenant’s `site_config.json` from disk; sets `cancel_at_period_end`; at `current_period_end` calls `suspend_tenant`. Access continues until then.

5. **Suspend.** `lifecycle.suspend_tenant` sets Tenant `suspended`, Subscription `suspended`, `ee_suspended=1`. `before_request` returns the billed suspension copy except ping/login/assets. `notifications.send` is a no-op on suspended tenant sites (dunning is sent from the control plane). Resume clears the flag. Provisioner suspend/resume also toggle `ee_suspended` (not only Frappe maintenance mode).

6. **Deprovision with backup.** `deprovision_tenant` enqueues Provisioning Job `action=deprovision`. Job runs `bench --site X backup --with-files` into `sites/archived/{site}/{timestamp}/`, stores that path on `Tenant.backup_ref`, then `drop-site --force --no-backup`. Tenant row stays `deleted`.

7. **Metering.** Daily on control plane only: for each Tenant with a site, `bench --site {site} execute collect_local_metrics`. That function counts this site only (`active_users`, bookings this month, SMS, `EE AI Call`, File sizes → `storage_gb`). Stdout marker `EE_METRICS:{json}`. Control plane inserts append-only Usage Records. Overage: if Plan `allow_overages` and a numeric entitlement is exceeded and `stripe_usage_price` is set, report the delta to Stripe; otherwise skip.

8. **Fleet.** `fleet_dashboard` lists every Tenant with plan, status, MRR (`flt`), period end, failed jobs, last activity (`modified`). `/ops` shows the Phase 10 KPI cards plus that table. Request handlers still never `frappe.init` another site.

9. **Owner UI.** `/owner/plan` — status, period end, formatted price, Pay (checkout URL) / Cancel. Copy never names DocTypes or `/app`. Guests 403. Crew 403.

10. **Image** `0.0.68-ee` → `0.0.69-ee`.

## Risks / Trade-offs

- [Stripe keys missing] → checkout throws a clear error; trial still works.
- [Webhook hits a tenant hostname] → ignored; Stripe should point at `admin.{base_domain}`.
- [site_config JSON write races] → last writer wins; flags are idempotent.
- [Backup disk] → archived copies live on the bench PVC; MinIO nightly job still covers live sites.

## Migration Plan

Patch `v0_0_3.phase12_saas_control_plane`: `create_all()` (custom fields only) is a no-op for new DocTypes (JSON migrate). Seed `allow_overages` / annual prices if missing. Rollback: previous bench tag; leave Subscription rows.

## Open Questions

None blocking. Stripe Price IDs stay operator-filled on Plan.
