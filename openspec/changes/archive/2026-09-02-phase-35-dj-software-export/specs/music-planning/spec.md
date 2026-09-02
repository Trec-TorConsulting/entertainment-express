## ADDED Requirements

### Requirement: DJ Software Playlist Export
The system SHALL export client/crew music lists as metadata playlists in Serato CSV, Rekordbox XML (supported subset), and M3U formats without including audio file binaries.

#### Scenario: Export must-play for Serato
- **WHEN** a DJ exports the must-play list as Serato CSV
- **THEN** a file downloads with title/artist rows for that booking only

#### Scenario: Guest denied export
- **WHEN** an event guest calls the export API
- **THEN** the request is denied (403)
