## MODIFIED Requirements

### Requirement: DJ Software Export Formats
The system SHALL provide integration adapters that export music planning metadata to Serato CSV, Rekordbox XML (supported subset), native VirtualDJ (.vdjfolder XML), and M3U without distributing audio binaries.

#### Scenario: Export via integrations module
- **WHEN** staff request a Serato or VirtualDJ export for a booking music list
- **THEN** the integrations adapter returns a downloadable metadata file scoped to this tenant site

#### Scenario: VirtualDJ native crate export
- **WHEN** staff request a VirtualDJ export format
- **THEN** the adapter generates a `.vdjfolder` XML file formatted with `<VirtualFolder>` and `<Song>` tags containing track metadata

## ADDED Requirements

### Requirement: VirtualDJ Live Request Polling Adapter
The system SHALL provide an integration connector supporting VirtualDJ's Ask-The-DJ / Web request format, serving live approved song requests via a lightweight JSON or XML response.

#### Scenario: Live request feed query
- **WHEN** VirtualDJ requests the live feed endpoint with the booking's secret token
- **THEN** the adapter returns the pending request queue formatted for VirtualDJ consumption

### Requirement: VirtualDJ History Log Parser
The system SHALL parse VirtualDJ history.txt files and VirtualDJ Database XML exports, extracting played track titles, artists, and play timestamps.

#### Scenario: Parse history.txt
- **WHEN** a VirtualDJ history.txt file is processed
- **THEN** the parser extracts an ordered list of timestamped track entries with artist and title fields
