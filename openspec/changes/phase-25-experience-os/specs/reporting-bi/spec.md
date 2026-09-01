## ADDED Requirements

### Requirement: Canned Portal Report Packs
The system SHALL expose canned report APIs consumed by `/owner/reports`, `/employee/reports`, and `/client` event money summaries as defined in the experience-os design (owner company pack, role-sliced staff pack, client “what I owe / paid / left” only). Exports SHALL be CSV or PDF and SHALL include only rows the caller may see. The system SHALL NOT offer a report builder or general-ledger browser in these portals.

#### Scenario: Client sees only their event money
- **WHEN** a customer opens money on an event
- **THEN** they see amounts they owe, paid, and remaining for their invoices — never another customer’s balances

#### Scenario: Guest has no reports
- **WHEN** an `EE Event Guest` requests a report API
- **THEN** access is denied
