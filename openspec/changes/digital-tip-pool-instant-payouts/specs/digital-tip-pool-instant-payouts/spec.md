## ADDED Requirements

### Requirement: Frictionless Mobile Guest Digital Tipping
The system SHALL provide a public web page where event attendees can send digital tips via Apple Pay, Google Pay, or credit card without creating an account or downloading an app.

#### Scenario: Wedding guest leaves a $20 tip
- **WHEN** a guest scans the DJ booth QR code and submits a $20 tip via Apple Pay
- **THEN** the charge succeeds and the funds are credited to the event's `EE Tip Pool`.

### Requirement: Algorithmic Tip Pool Distribution
The system SHALL automatically divide collected tips across on-site staff according to configured split rules (Equal, Hours-Weighted, or Role-Weighted).

#### Scenario: Dividing $300 tip pool equally across 3 crew members
- **WHEN** the tip pool is settled under the `Equal Split` rule for 3 active crew members
- **THEN** each worker is allocated exactly $100.00 in the split line items.

### Requirement: Stripe Connect Instant Payouts
The system SHALL support instant payout transfers directly to worker debit cards within 30 minutes of event teardown verification.

#### Scenario: Worker requests instant cashout
- **WHEN** a crew member taps "Cash Out Now" in `/employee/earnings`
- **THEN** the system executes a Stripe instant payout transfer, making funds available on the worker's debit card within minutes.
