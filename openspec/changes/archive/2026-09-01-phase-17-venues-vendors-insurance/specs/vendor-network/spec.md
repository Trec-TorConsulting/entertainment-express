## ADDED Requirements

### Requirement: Vendor Directory On Company OS
The system SHALL let the owner maintain partners (category, contacts, preferred, W-9 / COI on file, subcontractor flag) on `/owner` without `/app`.

#### Scenario: Add a preferred photographer
- **WHEN** an owner adds a photographer as preferred
- **THEN** that partner is available for referrals and job coordination on this site only

### Requirement: Referral Tracking
The system SHALL record referrals sent or received with optional commission stored via `flt` and shown as a backend money string.

#### Scenario: Track a received referral
- **WHEN** a lead is marked as referred by a partner
- **THEN** the referral is stored on this site and the commission amount is a formatted string in the portal

### Requirement: Overflow Assignment
The system SHALL assign a subcontractor partner to a job with agreed cost (`flt`) and status.

#### Scenario: Subcontract overflow event
- **WHEN** dispatch assigns a subcontractor because internal crew is unavailable
- **THEN** the assignment, agreed cost string, and status are stored on that booking

### Requirement: Event Vendor List
The system SHALL list other vendors on a job for day-of coordination (name, role, phone).

#### Scenario: Event vendor list
- **WHEN** crew opens an assigned job
- **THEN** other vendors and their contacts for that job are visible and other tenants’ vendors are not
