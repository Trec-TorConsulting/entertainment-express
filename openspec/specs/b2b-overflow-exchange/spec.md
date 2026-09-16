# Capability: B2B Overflow & Sub-Rental Gear Exchange

## Purpose
Provides a secure, cross-tenant liquidity network mediated through the EE Control Plane. Allows operators to buy and sell overflow booking capacity and sub-rent gear with automated COI verification, margin escrow, and white-labeled gig packet generation while preserving multi-tenant DB isolation.

## Requirements

### Requirement: Control-Plane Mediated Listings
The tenant exchange client (`publish_overflow_job`) SHALL send anonymized HMAC-signed listing payloads to the central Control Plane clearinghouse, preventing direct cross-tenant database reads.

#### Scenario: Publishing an overflow job
- **WHEN** an operator publishes an overbooked booking
- **THEN** an anonymized listing is registered on the Control Plane exchange

### Requirement: Automated COI Verification Gate
Peer operators SHALL pass an automated COI liability check (`verify_partner_coi`) matching minimum coverage limits before claiming network listings.

#### Scenario: Claiming a network gig
- **WHEN** a peer operator attempts to claim a network job
- **THEN** their active Certificate of Insurance is verified for $1M minimum coverage

### Requirement: Escrow Payout Settlement
Mutual completion sign-off (`complete_and_release_escrow`) SHALL trigger escrow payout disbursement to the fulfilling partner.

#### Scenario: Event completion sign-off
- **WHEN** both originating and fulfilling operators sign off on completed work
- **THEN** pledged escrow funds are disbursed
