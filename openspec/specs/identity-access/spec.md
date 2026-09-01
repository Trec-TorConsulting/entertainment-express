# Capability: Identity & Access

## Purpose
Authentication, authorization, roles, and session/API security for all EE user types within a tenant site
and on the control plane. Built on Frappe's user/role/permission system, extended with EE roles and
entitlement checks tied to the tenant's plan.

### Roles (EE-prefixed, seeded at tenant bootstrap)
- **EE Tenant Admin** — full control of the tenant.
- **EE Sales** — CRM, quotes, bookings.
- **EE Dispatcher** — scheduling, crew assignment, run sheets.
- **EE Accounting** — invoices, payments, financials.
- **EE Marketing** — campaigns, reviews, referrals.
- **EE Crew** — mobile app only: assigned events, run sheets, check-in/out, media upload.
- **EE Customer** — customer portal only (end clients of the tenant).
- **EE Event Guest** — invited to a single booking for planning/chat; never a payer.
- **SaaS Operator** — control-plane only (not present on tenant sites).

## Requirements

### Requirement: User Authentication
The system SHALL authenticate users with email/password sessions and support optional TOTP two-factor
authentication, password reset, and account lockout on repeated failures.

#### Scenario: Successful login
- **WHEN** a user submits valid credentials for their tenant site
- **THEN** a session is established scoped to that tenant, with role-based access applied

#### Scenario: Two-factor challenge
- **WHEN** a user with 2FA enabled logs in with a correct password
- **THEN** a TOTP code is required before the session is granted

#### Scenario: Lockout on brute force
- **WHEN** a user exceeds the configured failed-login threshold
- **THEN** further attempts are blocked for the lockout window and the event is logged

### Requirement: Role-Based Authorization
The system SHALL enforce least-privilege access via EE roles, checked server-side on every desk view,
portal page, and API endpoint.

#### Scenario: Crew cannot access accounting
- **WHEN** an EE Crew user requests an invoice or financial API
- **THEN** access is denied (403) regardless of UI state

#### Scenario: Customer sees only their own records
- **WHEN** an EE Customer queries bookings/invoices via the portal
- **THEN** only records belonging to that customer are returned, enforced by permission query conditions

### Requirement: API Tokens & Mobile Auth
The system SHALL issue API keys/tokens for the mobile app and integrations, revocable per user/device.

#### Scenario: Mobile token issuance
- **WHEN** a crew member logs into the mobile app
- **THEN** a scoped, revocable token is issued and used for subsequent API calls

#### Scenario: Token revocation
- **WHEN** an admin revokes a device token
- **THEN** subsequent API calls with that token are rejected (401)

### Requirement: Plan-Based Entitlement Checks
The system SHALL gate premium features behind the tenant's current plan entitlements, enforced server-side.

#### Scenario: Feature gated by plan
- **WHEN** a tenant on a plan without "AI Assistant" calls an AI endpoint
- **THEN** the request is rejected with an upgrade-required response, and no AI work is performed

### Requirement: Audit of Access & Permission Changes
The system SHALL log authentication events and role/permission changes with actor, timestamp, and detail.

#### Scenario: Role change logged
- **WHEN** an admin grants or revokes a role
- **THEN** an audit entry records who changed what, when, and the before/after roles

### Requirement: Event Guest Identity
The system SHALL seed an `EE Event Guest` role on tenant sites. Event invites SHALL assign only that role (plus Website User). Owners and staff SHALL NOT grant `System Manager` or `SaaS Operator`. Guests SHALL be authorized only for APIs in `event-collaboration` and read of that booking’s published planning/media.

#### Scenario: Invite does not create a payer
- **WHEN** a customer invites a guest
- **THEN** the new or linked user has `EE Event Guest` and does not have `EE Customer`

#### Scenario: Guest blocked from staff APIs
- **WHEN** an `EE Event Guest` calls owner or employee portal methods
- **THEN** access is denied

### Requirement: Proposal Money Is Payer-Only
The system SHALL allow Proposal accept, contract sign, and deposit pay only for the booking’s `EE Customer` (or a valid signing token bound to that contract). `EE Event Guest` SHALL NOT gain `EE Customer` via proposal links.

#### Scenario: Guest token cannot pay
- **WHEN** a guest uses an invite link and calls sign-and-pay
- **THEN** the request is denied and the Quotation is unchanged

### Requirement: Public Book Is Site-Scoped
The system SHALL allow guest POST to book an appointment only on the current tenant site, with rate limits. Guests SHALL NOT receive `EE Customer` from booking a consult.

#### Scenario: Consult book does not mint a payer
- **WHEN** a guest books a consult
- **THEN** a Lead is created and the user is not granted `EE Customer` or `System Manager`

### Requirement: Guest Is Not The Risk Payer
The system SHALL deny `EE Event Guest` (without `EE Customer`) on waiver sign, damage hold, and vendor commission APIs.

#### Scenario: Guest denied waiver
- **WHEN** a guest signs a waiver
- **THEN** the request is denied (403) and the waiver is unchanged

### Requirement: Import Is Owner And Site Scoped
The system SHALL deny guests and non-owners on import/export APIs. Import SHALL NOT accept a site or tenant argument.

#### Scenario: Guest denied import
- **WHEN** an `EE Event Guest` starts an import
- **THEN** the request is denied (403) and no job is created

### Requirement: Guest Cannot Change The Job
The system SHALL deny `EE Event Guest` (without `EE Customer`) on booking change-request APIs. Import-style `tenant`/`site` arguments SHALL NOT exist.

#### Scenario: Guest denied change request
- **WHEN** an `EE Event Guest` requests a reschedule
- **THEN** the request is denied (403) and no change record is created
