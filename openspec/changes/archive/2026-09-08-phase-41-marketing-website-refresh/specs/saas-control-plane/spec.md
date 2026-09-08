## ADDED Requirements

### Requirement: Free Starter Plan
The system SHALL define a Starter plan with `price_monthly=0`, `price_annual=0`, `trial_days=0`,
`status=active`, and entitlements: `max_staff=1`, `active_bookings_limit=3`, `storage_gb=0.5`,
`white_label=0`, `custom_domain=0`, `weather_risk=0`, `sms_enabled=0`, `playlist_export=0`,
`ai_assistant=0`, `overflow_exchange=0`, `show_ee_badge=1`, `concierge_migration=0`. The Starter plan
SHALL be seeded alongside Pro and Scale plans during provisioning setup.

#### Scenario: Starter plan exists after setup
- **WHEN** the control-plane setup fixture runs
- **THEN** a Plan named "Starter" exists with `price_monthly=0` and all entitlements at their defined limits

#### Scenario: Starter trial signup
- **WHEN** a prospect starts a trial selecting the Starter plan
- **THEN** a Subscription is created in `active` status (not `trialing`) with Starter entitlements immediately

### Requirement: Reverse Trial Auto-Downgrade
The system SHALL downgrade a tenant's Subscription from a paid plan to the Starter plan (instead of
suspending) when the trial period expires without a payment method attached. The tenant SHALL retain
read-only access to existing data but SHALL be blocked from creating new records beyond Starter entitlements
(e.g., no new bookings beyond the 3-active limit, no new staff beyond 1).

#### Scenario: Trial expires without payment
- **WHEN** a Pro trial Subscription reaches `current_period_end` with no payment method on file
- **THEN** the Subscription plan changes to Starter, status changes to `active`, and entitlements update to
  Starter limits — the tenant is NOT suspended

#### Scenario: Existing bookings beyond limit remain visible
- **WHEN** a tenant downgrades from Pro to Starter and has 8 active bookings
- **THEN** all 8 bookings remain visible and manageable but the tenant cannot create booking #9 until they
  are at or below 3 active bookings or they upgrade

### Requirement: Active Booking Limit Enforcement
The system SHALL enforce the `active_bookings_limit` entitlement on tenant sites. When a tenant attempts to
create a new booking (EE Booking or equivalent) that would exceed their plan's limit, the system SHALL block
creation with a clear upgrade prompt message — enforced server-side, not just UI.

#### Scenario: Starter hits booking limit
- **WHEN** a Starter tenant with 3 active future bookings attempts to create a 4th
- **THEN** creation is blocked server-side with a message: "Your plan allows up to 3 active bookings.
  Upgrade to Pro for unlimited bookings."

#### Scenario: Pro tenant unlimited
- **WHEN** a Pro tenant creates their 100th booking
- **THEN** creation succeeds without limit checks (limit = 9999)

### Requirement: Staff Limit Enforcement
The system SHALL enforce the `max_staff` entitlement on tenant sites. When a tenant attempts to add staff
beyond their plan's limit, the system SHALL block the action server-side with an upgrade prompt.

#### Scenario: Starter hits staff limit
- **WHEN** a Starter tenant with 1 staff member attempts to add a 2nd
- **THEN** the action is blocked with a message: "Your plan allows 1 staff member. Upgrade to Pro for up
  to 5 staff."

### Requirement: EE Badge Enforcement
The system SHALL display an "Powered by Entertainment Express" badge in the `/client` portal footer when
the tenant's plan has `show_ee_badge=1`. The badge SHALL link to `https://www.{base_domain}`. Plans with
`show_ee_badge=0` SHALL NOT show the badge.

#### Scenario: Starter shows badge
- **WHEN** a customer opens `/client` on a Starter-plan tenant
- **THEN** the portal footer shows "Powered by Entertainment Express" with a link to the EE marketing site

#### Scenario: Pro hides badge
- **WHEN** a customer opens `/client` on a Pro-plan tenant
- **THEN** no EE badge appears in the portal footer

### Requirement: Updated Plan Entitlements
The system SHALL define Pro and Scale plans with the following entitlements in addition to existing fields:

| `feature_key` | Pro | Scale |
|---------------|-----|-------|
| `max_staff` | 5 | 9999 |
| `active_bookings_limit` | 9999 | 9999 |
| `storage_gb` | 15 | 100 |
| `white_label` | 1 | 1 |
| `custom_domain` | 1 | 1 |
| `weather_risk` | 1 | 1 |
| `sms_enabled` | 1 | 1 |
| `playlist_export` | 1 | 1 |
| `ai_assistant` | 0 | 1 |
| `overflow_exchange` | 0 | 1 |
| `show_ee_badge` | 0 | 0 |
| `concierge_migration` | 0 | 1 |

Pro SHALL have `price_monthly=99`, `price_annual=948`, `trial_days=14`.
Scale SHALL have `price_monthly=249`, `price_annual=2388`, `trial_days=14`.

#### Scenario: Pro plan pricing and entitlements
- **WHEN** the Plan fixture is loaded
- **THEN** Pro has `price_monthly=99`, `trial_days=14`, `max_staff=5`, `active_bookings_limit=9999`,
  `show_ee_badge=0`

#### Scenario: Scale includes AI and overflow
- **WHEN** the Plan fixture is loaded
- **THEN** Scale has `ai_assistant=1`, `overflow_exchange=1`, `concierge_migration=1`

## MODIFIED Requirements

### Requirement: Self-Service Tenant Signup
The system SHALL let a prospective customer sign up, choose a plan (including the free Starter plan), and be
provisioned automatically (optionally with a trial for paid plans), with the SaaS Operator able to require
approval. Starter signups SHALL create a Subscription in `active` status immediately (no trial period).
Paid plan signups SHALL create a Subscription in `trialing` status for `trial_days`. When a trial expires
without payment, the Subscription SHALL downgrade to the Starter plan instead of being suspended.

#### Scenario: Signup triggers provisioning
- **WHEN** a prospect completes signup with a valid slug and selected plan
- **THEN** a Signup Application is created and, on approval (or auto-approval), a provisioning job is enqueued
  and the tenant is created

#### Scenario: Trial subscription
- **WHEN** a plan defines a trial period and a tenant signs up
- **THEN** a Subscription is created in `trialing` status ending at `now + trial_days`, with full plan
  entitlements until trial end

#### Scenario: Starter signup is immediate
- **WHEN** a prospect selects the Starter plan
- **THEN** a Subscription is created in `active` status with Starter entitlements and no trial period

#### Scenario: Trial expiry downgrades to Starter
- **WHEN** a paid plan trial expires without a payment method
- **THEN** the Subscription plan changes to Starter and status changes to `active` — the tenant is not
  suspended and retains read-only access to existing data
