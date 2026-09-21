## ADDED Requirements

### Requirement: Interactive Proposal Tier Selection
The system SHALL provide a web-based proposal interface where customers can switch between predefined package tiers and view updated line items, totals, and required deposits in real time.

#### Scenario: Switching from Gold to Platinum tier
- **WHEN** a client views proposal `PROP-2026-001` and clicks "Platinum Package" ($2,500) instead of "Gold Package" ($1,800)
- **THEN** the proposal interface updates the itemized list, recalculated subtotal, sales tax, and 25% deposit requirement ($625).

### Requirement: In-Proposal Add-On Upselling
The system SHALL display optional add-on equipment or services with real-time price updates and toggle controls.

#### Scenario: Adding cold spark fountains to proposal
- **WHEN** a client toggles the "Cold Spark Fountains (Pair)" add-on (+$400)
- **THEN** the summary subtotal increases by $400 and the add-on is staged for contract inclusion.

### Requirement: Authoritative Server Price Recalculation
The system SHALL re-evaluate all package and add-on item prices on the server during proposal acceptance to prevent client-side price tampering.

#### Scenario: Submitting modified client payload
- **WHEN** a client submits an acceptance request with a tampered price of $1.00 for a $500 add-on
- **THEN** the server discards the client-provided price, looks up the current `Item Price` in ERPNext, and charges the verified price.

### Requirement: E-Signature Capture & Audit Logging
The system SHALL capture the signer's name, canvas signature image, IP address, user-agent string, and timestamp upon agreement.

#### Scenario: Executing digital proposal signature
- **WHEN** the client types their legal name, signs the canvas pad, and clicks "Accept & Sign"
- **THEN** an immutable signature record is stored and linked to the resulting Booking and Sales Order.
