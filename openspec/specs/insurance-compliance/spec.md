# Capability: Insurance & Compliance

## Purpose
Manage event-related **risk, insurance, and liability**: certificates of insurance (COI) required by
venues, liability waivers / damage waivers signed by clients, security/damage deposits and card
pre-authorization holds, and per-event insurance (mirroring Goodshuffle's insure.events). Reduces disputes
and protects the tenant. Currently missing from our spec.

### Data Model
- **Insurance Policy**: tenant (link), provider, policy_number, coverage, effective/expiry, file.
- **Certificate of Insurance (COI)**: booking/venue (link), status (`requested|issued|delivered`),
  additional_insured, file, issued_on.
- **Liability Waiver**: booking (link), template, signer, signature + audit (ip/timestamp/hash), status.
- **Damage/Security Deposit**: booking (link), amount, method (`preauth_hold|charge|separate`),
  processor_ref, status (`held|captured|released|forfeited`), release/capture reason.

## Requirements

### Requirement: Certificates of Insurance (COI)
The system SHALL request, track, and deliver certificates of insurance where venues require them, and flag
bookings missing a required COI.

#### Scenario: COI required by venue
- **WHEN** a booking is at a venue flagged `coi_required`
- **THEN** the booking is flagged until a COI (with the correct additional-insured) is attached, and staff
  are reminded before the event

### Requirement: Liability & Damage Waivers
The system SHALL present waivers for client e-signature (e.g., inflatable/game-truck liability) and store
the executed waiver with an audit trail.

#### Scenario: Sign a liability waiver
- **WHEN** a client signs the required liability waiver for a bounce-house rental
- **THEN** the signed waiver is stored with signer identity, IP, timestamp, and hash, and the booking is
  cleared to proceed

### Requirement: Security / Damage Deposits & Pre-Authorization
The system SHALL support refundable security/damage deposits via card pre-authorization holds or charges,
with capture/release, integrated with `billing-payments`.

#### Scenario: Pre-auth hold and release
- **WHEN** a damage deposit is placed as a card pre-authorization hold and the equipment returns undamaged
- **THEN** the hold is released without charging the customer, and the status is `released`

#### Scenario: Capture on damage
- **WHEN** damage is reported and a deposit was held
- **THEN** the appropriate amount can be captured/charged, recorded against the booking, and the remainder
  released

### Requirement: Per-Event Insurance Option
The system SHALL record an optional per-event insurance opt-in and amount on the booking. External insurance-carrier checkout SHALL remain later integrations work. Amounts SHALL be backend-formatted strings.

#### Scenario: Add event insurance
- **WHEN** a client or owner opts into per-event insurance on a job
- **THEN** the flag and amount are stored on that booking and no external carrier API is called

### Requirement: Policy & Expiry Tracking
The system SHALL track the tenant's own insurance policies and alert on upcoming expiry.

#### Scenario: Policy expiry alert
- **WHEN** the tenant's liability policy nears expiry
- **THEN** an alert is raised so coverage is renewed before it lapses

### Requirement: Certificates Of Insurance
The system SHALL request, attach, and track a COI per job (`requested|issued|delivered`) when the venue requires one. Missing SMS SHALL NOT crash the reminder.

#### Scenario: COI required by venue
- **WHEN** a job is at a COI-required venue with no delivered certificate
- **THEN** the job is flagged and staff can attach a file to mark it delivered

### Requirement: Liability Waivers
The system SHALL present a waiver for the paying customer to e-sign and store signer, timestamp, IP, and hash. Event guests SHALL NOT sign as the payer.

#### Scenario: Sign a liability waiver
- **WHEN** a customer signs the required waiver for their job
- **THEN** the waiver is signed with audit fields and the job is cleared for that requirement

#### Scenario: Guest cannot sign waiver
- **WHEN** an `EE Event Guest` calls the waiver-sign API
- **THEN** the request is denied (403)

### Requirement: Damage Hold Status
The system SHALL expose existing Stripe preauth hold/capture/release on the job as status `none|held|captured|released|forfeited`. Amounts SHALL use `flt` and backend-formatted strings. The SPA SHALL NOT compute money.

#### Scenario: Pre-auth hold and release
- **WHEN** staff place a damage hold and later release it because gear returned undamaged
- **THEN** the processor hold is released and the job status is `released`

#### Scenario: Capture on damage
- **WHEN** damage is reported on a held deposit
- **THEN** staff can capture an amount through existing billing and the remainder follows the processor

### Requirement: Policy Expiry
The system SHALL store the tenant’s policies and remind owners before expiry on existing notification channels.

#### Scenario: Policy expiry reminder
- **WHEN** a policy expires within the reminder window
- **THEN** an alert is queued for this tenant and other tenants are not notified
