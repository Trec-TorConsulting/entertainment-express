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
