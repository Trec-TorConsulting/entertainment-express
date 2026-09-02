## ADDED Requirements

### Requirement: DJ Software Export Formats
The system SHALL provide integration adapters that export music planning metadata to Serato CSV, Rekordbox XML (supported subset), and M3U without distributing audio binaries.

#### Scenario: Export via integrations module
- **WHEN** staff request a Serato export for a booking music list
- **THEN** the integrations adapter returns a downloadable metadata file scoped to this tenant site
