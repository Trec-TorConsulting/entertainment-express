# Capability: Subcontractor Management

## ADDED Requirements

### Requirement: Subcontractor Directory & Qualification
The system SHALL maintain a subcontractor registry of partner entertainment companies, including company name, primary dispatch contacts, verticals/services offered, service areas, default payout terms, W-9 status, and COI/insurance verification status.

#### Scenario: Registering a partner company as a qualified subcontractor
- **WHEN** an owner adds a partner company with valid W-9 and COI documents on file and marks them as an active subcontractor
- **THEN** the partner appears in the qualified subcontractor directory and becomes available for job sub-out assignment

### Requirement: Sub-Out Job Workflow & Assignment
The system SHALL allow an owner or dispatcher to sub out an entire booking or specific service items to a partner subcontractor company, specifying agreed subcontractor payout, payment terms, and special fulfillment instructions.

#### Scenario: Subbing out a double-booked wedding DJ job
- **WHEN** an owner selects an Event Booking and assigns a qualified subcontractor with an agreed payout of $1,200 on Net-15 terms
- **THEN** the system creates a Subcontract Job record linked to the booking, calculates expected gross margin, and sets the subcontract status to `draft`

### Requirement: Subcontractor Job Packet & Privacy Controls
The system SHALL generate a clean Subcontractor Job Packet (run sheet, schedule, venue access notes, and equipment requirements) with configurable client privacy masking (white-label mode hiding client phone/email or full-access mode).

#### Scenario: Generating white-label job packet for partner company
- **WHEN** an owner issues a job packet with white-label privacy masking enabled
- **THEN** client direct contact details and total client invoice price are masked, while event timeline, venue logistics, and on-site contact rules remain visible

### Requirement: External Offer Acceptance Portal
The system SHALL provide a secure, tokenized external portal view where a subcontractor company can review event details, accept or decline the job offer, and acknowledge subcontract terms without needing an EE tenant login.

#### Scenario: Subcontractor accepts job offer via secure link
- **WHEN** the partner company clicks the secure link in the job offer notification and confirms acceptance
- **THEN** the subcontract status transitions to `accepted`, the owner receives an instant notification, and the primary booking dispatch status updates accordingly

#### Scenario: Subcontractor declines job offer
- **WHEN** the partner company declines the job offer with an optional decline reason
- **THEN** the subcontract status transitions to `declined`, the owner is alerted to reassign the job, and the booking returns to at-risk dispatch status

### Requirement: Subcontractor Margin & Payout Tracking
The system SHALL compute and display gross profit margin per subbed job (client contract price vs. agreed subcontractor cost) and generate payable purchase invoice records upon verified job completion.

#### Scenario: Job completion triggers payout ledger entry
- **WHEN** a subbed-out job is marked completed by the owner
- **THEN** the system logs the final margin performance and generates an ERPNext purchase invoice record ready for payout according to agreed payment terms
