## MODIFIED Requirements

### Requirement: DJ Software Playlist Export
The system SHALL export client/crew music lists as metadata playlists in Serato CSV, Rekordbox XML (supported subset), native VirtualDJ (.vdjfolder XML), and M3U formats without including audio file binaries.

#### Scenario: Export must-play for Serato
- **WHEN** a DJ exports the must-play list as Serato CSV
- **THEN** a file downloads with title/artist rows for that booking only

#### Scenario: Export for VirtualDJ folder
- **WHEN** a DJ exports the playlist as VirtualDJ folder
- **THEN** a `.vdjfolder` XML file downloads containing VirtualDJ track elements with title, artist, category, and comment metadata for that booking only

#### Scenario: Guest denied export
- **WHEN** an event guest calls the export API
- **THEN** the request is denied (403)

## ADDED Requirements

### Requirement: VirtualDJ Live Request Feed
The system SHALL provide a secure token-authenticated HTTP endpoint allowing VirtualDJ software and custom browser panels to poll real-time approved guest and client song requests for an active event booking.

#### Scenario: Polling live requests with valid token
- **WHEN** VirtualDJ software polls the live request endpoint with a valid booking live token
- **THEN** the system returns a list of approved song requests including song name, artist, moment, and guest notes for that booking

#### Scenario: Polling with invalid token
- **WHEN** an unauthenticated caller or invalid token attempts to access the live request feed
- **THEN** the request is rejected with a 401 Unauthorized status

### Requirement: VirtualDJ History Reconciliation
The system SHALL accept uploaded VirtualDJ session history logs (history.txt or VirtualDJ Database XML), parse the played tracks and timestamps, and reconcile them against the booking's `Music Selection` records, automatically marking matched selections as played.

#### Scenario: Successful history upload and reconciliation
- **WHEN** a DJ uploads a VirtualDJ history.txt log after an event
- **THEN** matching `Music Selection` records on that booking are marked with status `played` and their played timestamp is recorded

#### Scenario: Uploading history for unassigned event
- **WHEN** a user without permission or crew assignment to the booking attempts to upload a history log
- **THEN** the system throws a permission error (403)
