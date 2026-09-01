## MODIFIED Requirements

### Requirement: Packing Lists / Pull Sheets
The system SHALL generate per-event packing lists (pull sheets) of all assets and consumables required, and
support verifying items are packed (scan or check-off). Warehouse-only catalog lines SHALL appear on the
pull sheet even when hidden from the client Proposal.

#### Scenario: Generate and verify a packing list
- **WHEN** an event's packing list is generated and crew pack the truck
- **THEN** each item can be checked off or scanned as packed, and the system flags any missing items before
  departure

#### Scenario: Hidden lines still pack
- **WHEN** a booking’s package includes warehouse-only lines
- **THEN** those lines appear on the pull sheet with qty and are absent from the client Proposal line list
