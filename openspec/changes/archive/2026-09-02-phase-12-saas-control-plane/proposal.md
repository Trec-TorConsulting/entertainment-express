## Why

Tenants can be provisioned but EE does not start a trial, bill, meter, dun, or suspend them with a backup. Plan limits are not enforced on tenant sites because those sites have no `Tenant` rows. That is not a SaaS product.

## What Changes

Control-plane **Subscription**, **Usage Record**, and **SaaS Invoice** (already present) become the live billing loop: trial on provision, Stripe subscription checkout, renewals, dunning, cancel-at-period-end; plan change that re-applies entitlements onto tenant `site_config`; append-only daily metering; operator fleet table on `/ops`; suspend/resume; deprovision with a site backup first.

Tenant sites enforce entitlements and suspension from **their own** `site_config` only. Owner **Plan** at `/owner/plan` (pay / cancel) never queries the admin database.

## Impact

- Control-plane APIs on `admin.{base_domain}`: webhook, fleet, plan change, dunning.
- Tenant sites: `has_entitlement` / booking and staff limits / marketing flag / `ee_suspended`.
- Stripe webhooks for `customer.subscription.*` and `invoice.*` (signature-verified, idempotent).
- Owner SPA rebuild; bench `0.0.68-ee` → `0.0.69-ee`.
- Tests: `tests/test_phase12.py`.
- Depends on: phase-1 Tenant/Plan/Signup/provisioning, phase-10 `/ops`, cluster Stripe keys (optional for trial).

## Non-Goals

- Tenant charging their customers (phase-5).
- Marketing campaigns (phase-8).
- Custom domains (phase-14).

## Requirements delivered

- `saas-control-plane`: Self-Service Tenant Signup (trial subscription), Plans & Entitlements (enforcement), Subscription Billing (Stripe), Usage Metering, Fleet Health & Operator Dashboard.
- `platform-multitenancy`: Tenant Lifecycle Management (suspend/resume/deprovision with backup).
- `owner-portal`: Plan workspace (status + pay + cancel).
- `identity-access`: guests cannot call billing APIs.
