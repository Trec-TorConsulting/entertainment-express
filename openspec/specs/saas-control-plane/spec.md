# Capability: SaaS Control Plane

## Purpose
The SaaS Operator's cockpit (runs on the `admin.{base_domain}` site). Owns **tenant onboarding/signup,
plans & pricing, entitlements, usage metering, subscription billing, and fleet health**. It orchestrates
`platform-multitenancy` provisioning but does not touch tenant business data directly.

### Data Model (control-plane site)
- **Plan**: name, code, price_monthly, price_annual, currency, trial_days, entitlements (child: feature_key,
  limit_value), status (`active|retired`).
- **Subscription**: tenant (link), plan (link), status (`trialing|active|past_due|canceled|suspended`),
  provider (`stripe`), provider_subscription_id, current_period_start/end, seats, mrr.
- **Usage Record**: tenant (link), metric (`active_users|bookings|sms_sent|ai_calls|storage_gb`), period,
  quantity. (Append-only.)
- **Invoice (SaaS)**: tenant (link), subscription (link), amount, status, provider_invoice_id, issued/paid.
- **Signup Application**: company_name, requested_slug, contact, plan, status (`new|approved|rejected|provisioned`).

## Requirements

### Requirement: Self-Service Tenant Signup
The system SHALL let a prospective customer sign up, choose a plan, and be provisioned automatically
(optionally with a trial), with the SaaS Operator able to require approval.

#### Scenario: Signup triggers provisioning
- **WHEN** a prospect completes signup with a valid slug and selected plan
- **THEN** a Signup Application is created and, on approval (or auto-approval), a provisioning job is enqueued
  and the tenant is created

#### Scenario: Trial subscription
- **WHEN** a plan defines a trial period and a tenant signs up
- **THEN** a Subscription is created in `trialing` status ending at `now + trial_days`, with full plan
  entitlements until trial end

### Requirement: Plans & Entitlements
The system SHALL define plans with prices and per-feature entitlements/limits that gate tenant features.

#### Scenario: Entitlement drives feature access
- **WHEN** a tenant's plan sets `ai_assistant = false` or `bookings_limit = 500`
- **THEN** the tenant site enforces those entitlements server-side (feature off, or limit blocked with an
  upgrade prompt)

#### Scenario: Plan change re-applies entitlements
- **WHEN** a tenant upgrades or downgrades plans
- **THEN** the new entitlements take effect for that tenant without redeploying, and are logged

### Requirement: Subscription Billing (Stripe)
The system SHALL bill tenants for their subscriptions via Stripe, handling checkout, renewals, dunning, and
cancellation, and reconciling status via webhooks.

#### Scenario: Successful subscription payment
- **WHEN** Stripe reports a successful subscription invoice payment for a tenant
- **THEN** the Subscription is set/kept `active`, the current period is advanced, and a SaaS Invoice is
  recorded

#### Scenario: Failed payment dunning
- **WHEN** a subscription payment fails
- **THEN** the Subscription enters `past_due`, dunning notifications are sent, and after the grace period the
  tenant is suspended via the control plane

#### Scenario: Cancellation
- **WHEN** a tenant cancels
- **THEN** access continues until period end, then the tenant is suspended and eligible for deprovisioning
  per policy

### Requirement: Usage Metering
The system SHALL meter per-tenant usage of billable metrics and aggregate it on the control plane for
reporting and usage-based billing.

#### Scenario: Metric aggregation
- **WHEN** the metering job runs for a period
- **THEN** each tenant's usage (active users, bookings, SMS, AI calls, storage) is recorded as append-only
  Usage Records without querying tenant business data outside the sanctioned metering interface

#### Scenario: Overage billing
- **WHEN** a tenant exceeds a metered allowance and their plan permits overages
- **THEN** the overage quantity is passed to Stripe as usage/metered billing for the period

### Requirement: Fleet Health & Operator Dashboard
The system SHALL give the SaaS Operator a dashboard of tenants, their status, subscription state, usage, and
provisioning job health.

#### Scenario: Operator sees fleet status
- **WHEN** the SaaS Operator opens the control-plane dashboard
- **THEN** all tenants are listed with status, plan, MRR, last activity, and any failed provisioning/billing
  jobs surfaced for action
