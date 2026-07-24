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
The system SHALL optionally offer per-event insurance to clients at booking (where a provider is configured).

#### Scenario: Add event insurance
- **WHEN** a client opts into per-event insurance at checkout
- **THEN** the coverage is recorded, priced into the order, and its documentation is attached to the booking

### Requirement: Policy & Expiry Tracking
The system SHALL track the tenant's own insurance policies and alert on upcoming expiry.

#### Scenario: Policy expiry alert
- **WHEN** the tenant's liability policy nears expiry
- **THEN** an alert is raised so coverage is renewed before it lapses
