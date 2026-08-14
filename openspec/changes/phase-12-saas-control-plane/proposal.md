# Change: Phase 12 — SaaS Control Plane (Full)

## Why
Tenants can be provisioned but EE does not bill, meter, dun, or suspend them. That is not a SaaS product.

## What Changes
Control-plane **Subscription**, **Usage Record**, and **SaaS Invoice**; Stripe subscription checkout, renewals,
dunning, cancellation; trial handling; plan change that re-applies entitlements; append-only metering;
operator fleet dashboard; suspend/resume/deprovision hooks that lock a tenant site.

## Impact
- New control-plane DocTypes and APIs on `admin.{base_domain}` only.
- Tenant sites enforce entitlements server-side and refuse work when suspended.
- Stripe webhooks for `customer.subscription.*` and `invoice.*` (signature-verified, idempotent).
- Depends on: phase-1 Tenant/Plan/Signup/provisioning, cluster Stripe keys.

## Non-Goals
- Tenant charging their customers (phase-5).
- Marketing campaigns (phase-8).

## Requirements delivered
- `saas-control-plane`: Self-Service Tenant Signup (trial subscription), Plans & Entitlements (enforcement),
  Subscription Billing (Stripe), Usage Metering, Fleet Health & Operator Dashboard.
- `platform-multitenancy`: Tenant Lifecycle Management (suspend/resume/deprovision).
