## ADDED Requirements

### Requirement: Named Competitor Import Presets
The system SHALL provide named mapping presets for Inflatable Office, Event Rental Systems, Bouncy Castle Network, Goodshuffle Pro, DJ Event Planner, and DJ Intelligence export CSVs.

#### Scenario: Select Inflatable Office preset
- **WHEN** an owner starts an import with the Inflatable Office preset
- **THEN** columns map to EE customer/inventory/booking fields per the preset without manual mapping for known headers

### Requirement: Dry Run Validation Report
The system SHALL support a dry-run import that reports row errors without writing business documents.

#### Scenario: Dry run shows bad dates
- **WHEN** a dry-run encounters unparseable event dates
- **THEN** those rows are listed in the report and no bookings are created
