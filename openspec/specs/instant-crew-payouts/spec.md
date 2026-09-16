# Capability: Crew Instant Payouts & Micro-Incentives

## Purpose
Provides Stripe Connect Instant Payout integration for crew members and gig workers upon post-event teardown sign-off, alongside an algorithmic worker reliability scoring engine.

## Requirements

### Requirement: Stripe Connect Instant Disbursements
The payout engine (`execute_instant_payout`) SHALL process instant transfers via Stripe Connect to crew debit cards, deducting configurable 1.5% instant transfer fees and recording payment entries.

#### Scenario: Requesting instant transfer
- **WHEN** a crew member triggers an instant payout
- **THEN** net earnings are transferred to their debit card via Stripe Connect

### Requirement: Teardown & Damage Gate
Instant payout requests SHALL be gated (`validate_teardown_payout_gate`) until teardown equipment check-in is complete and all open damage incidents are resolved.

#### Scenario: Unresolved damage incident
- **WHEN** an open equipment damage report exists for a booking
- **THEN** instant payout requests are blocked until incident review

### Requirement: Algorithmic Reliability Rating
The reliability engine (`calculate_reliability_score`) SHALL compute worker reliability scores (0-100) weighting Punctuality (40%), Checklist Fidelity (25%), Asset Care (20%), and Client CSAT (15%), feeding into dispatch priority recommendations.

#### Scenario: Scoring worker performance
- **WHEN** an event completes
- **THEN** worker reliability scores are recalculated across all 4 vectors
