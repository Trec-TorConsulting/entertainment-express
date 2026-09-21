## ADDED Requirements

### Requirement: Pre-Quote Direct COGS Simulation
The system SHALL calculate expected direct labor wages, travel fuel costs, consumable depletion, equipment wear amortization, and payment processing fees before quote submission.

#### Scenario: Simulating margin on corporate DJ quote
- **WHEN** a sales coordinator edits a $2,000 corporate DJ quotation
- **THEN** the system calculates estimated direct COGS ($780) and displays an estimated gross margin of 61.0%.

### Requirement: Dynamic Margin Floor Guardrails
The system SHALL alert the user and require managerial override if an edited quote drops below the configured margin floor threshold.

#### Scenario: Quote discounted below 35% margin floor
- **WHEN** a coordinator discounts a package such that estimated gross margin falls to 28%
- **THEN** the system displays a margin floor warning and requires an `EE Tenant Admin` override password to send.

### Requirement: Automated ERPNext Cost Center Provisioning & Event P&L
The system SHALL auto-create an ERPNext Cost Center for every confirmed booking and aggregate all realized payroll, subcontractor bills, fuel, and payment fees into a real-time Event P&L.

#### Scenario: Reviewing post-event profitability
- **WHEN** an owner opens the Event P&L Drawer on `/owner/money` for a completed event
- **THEN** the drawer displays total collected revenue minus all General Ledger expenses tagged to that booking's Cost Center, displaying exact net profit and margin drift.
