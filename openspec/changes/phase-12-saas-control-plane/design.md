# Design: Phase 12 — SaaS Control Plane (Full)

## A. Data model (control plane)

| DocType | Key fields |
|---|---|
| Subscription | tenant, plan, status (`trialing`/`active`/`past_due`/`canceled`/`suspended`), provider, provider_subscription_id, provider_customer_id, current_period_start/end, seats, mrr, cancel_at_period_end, grace_until |
| Usage Record | tenant, metric, period_start, period_end, quantity (append-only, no amend) |
| SaaS Invoice | tenant, subscription, amount, currency, status, provider_invoice_id, issued_on, paid_on |

Plan gains `price_annual`, `stripe_price_monthly`, `stripe_price_annual`, `grace_days`.

## B. Billing

`create_subscription_checkout(tenant)` → Stripe Checkout `mode=subscription`. Webhook:
- `checkout.session.completed` / `customer.subscription.updated` → Subscription row
- `invoice.paid` → SaaS Invoice paid, status active
- `invoice.payment_failed` → past_due + dunning email; if now > grace_until → suspend tenant
- `customer.subscription.deleted` → canceled; suspend at period end

## C. Entitlements & lifecycle

`entitlements.has_entitlement` remains; `require_entitlement(feature)` throws with upgrade copy.
`lifecycle.suspend_tenant` sets Tenant.status=suspended and site_config `ee_suspended=1`.
`before_request` on tenant sites returns 403 JSON for API (except ping/login) when suspended.

## D. Metering

Daily job on control plane calls each tenant site via `frappe.get_site_config` sanctioned counts only
(`active_users`, `bookings_this_period`, `sms_sent`, `ai_calls`, `storage_gb`) through
`entertainment_express.control_plane.metering.collect_local_metrics` executed on the tenant site.
Overage: if plan entitlement is numeric and usage exceeds, report Stripe metered item when configured.

## E. Fleet

`api.control_plane.fleet_dashboard()` — tenants with plan, status, MRR, last activity, failed jobs.
