## ADDED Requirements

### Requirement: AI Expense Receipt OCR Scanner and Ledger Generation
The system SHALL ingest receipt images captured from mobile devices or uploaded via `/owner/money`, extract key financial attributes via multimodal vision, and automatically generate an ERPNext `Expense Claim` or `Purchase Invoice` linked to the designated `Event Booking` Cost Center.

#### Scenario: Crew uploads parking receipt
- **WHEN** a crew member snaps a photo of a $35 venue parking receipt on their phone
- **THEN** the vision model extracts $35.00, vendor name, and date, matches it to the active event booking, and creates a submitted `Expense Claim` updating the event's direct costs

### Requirement: Autonomous Accounts Receivable Dunning Agent
The system SHALL evaluate outstanding customer balances against payment terms and event dates, generate progressive dunning stages (Friendly, Firm, Final Demand), and send personalized communication containing one-click Stripe payment links upon owner approval or auto-schedule.

#### Scenario: Balance approaching event date
- **WHEN** an event balance is unpaid 7 days before event execution
- **THEN** the dunning agent drafts an email and SMS with a secure Stripe pay link reminding the client of the balance due, logged in the ERPNext Communication timeline

### Requirement: 60-Second Instant Lead Quoting Assistant
The system SHALL monitor incoming inquiries, parse event parameters (guest count, venue, services), verify availability in MariaDB, and draft a 3-tier (Good, Better, Best) ERPNext `Quotation` within 60 seconds of receipt.

#### Scenario: Web inquiry creates draft quotation
- **WHEN** a prospective client submits a booking request for a 4-hour wedding DJ with uplighting
- **THEN** the system generates an ERPNext `Quotation` with packages, calculates travel fees from venue address, and alerts the owner on their mobile device for 1-tap dispatch

### Requirement: Automated Bank Reconciliation and Stripe Batch Matcher
The system SHALL ingest bank statement feeds and decompose lumped Stripe bank deposits into individual `Payment Entry` documents, automatically booking credit card merchant fees to the Expense account.

#### Scenario: Stripe payout reconciliation
- **WHEN** a $4,850 Stripe payout hits the company bank account representing $5,000 in gross charges and $150 in Stripe fees across 3 bookings
- **THEN** the system matches the 3 bookings' invoices, records the $150 processing fee, and reconciles the bank transaction with zero manual math
