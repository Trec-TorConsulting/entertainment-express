## ADDED Requirements

### Requirement: Automated Emergency Crew Cascade
The system SHALL identify all skill-qualified, currently unbooked staff and trigger an automated SMS cascade ladder when a shift is dropped within 24 hours of call time.

#### Scenario: Lead DJ calls in sick
- **WHEN** an operator triggers emergency callout for a wedding Lead DJ with a $100 surge bonus
- **THEN** the system dispatches SMS messages to all available workers holding the `Lead DJ` skill with unique 1-tap claim links.

### Requirement: Atomic Single-Winner Shift Claiming
The system SHALL process shift claims atomically, awarding the booking assignment to the first claimant and cleanly locking out subsequent attempts without race conditions.

#### Scenario: Two workers attempt simultaneous claim
- **WHEN** Worker A and Worker B tap "Claim Shift" at the exact same second
- **THEN** MariaDB row locking assigns the shift to Worker A, sets status to `Claimed`, and displays "Shift Already Covered" to Worker B.

### Requirement: Peer B2B Subcontractor Liquidity
The system SHALL allow operators to broadcast unfillable gigs to verified peer operators on the B2B exchange network without revealing customer PII.

#### Scenario: Broadcasting overflow gig to partner network
- **WHEN** an internal callout expires after 30 minutes without a claim
- **THEN** the owner can 1-click broadcast the gig to local verified network partners with automated insurance compliance gating.
