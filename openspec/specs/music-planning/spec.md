# Capability: Music Planning

## Purpose
DJ/entertainment-specific **music planning**: client and guest song requests, must-play / do-not-play
lists, curated song-suggestion lists by moment (first dance, father-daughter, hora, etc.), streaming
integration (Spotify / Apple Music / YouTube Music) with track import and preview, and an internal music
library with a "do I have it?" checker. These are core, heavily-used features in DJ Event Planner and Check
Cherry and are currently missing from our spec. Optional/enabled per tenant (relevant to DJ/karaoke
verticals).

### Data Model
- **Song**: title, artist, album, year, genre, external_ids (spotify/apple/youtube), preview_url,
  in_library (bool).
- **Music Selection**: booking (link), category (`must_play|do_not_play|special_moment|general_request`),
  moment (e.g., first_dance), song (link/free text), requested_by (`client|guest|staff`), status
  (`requested|approved|rejected|played`), notes.
- **Curated List**: tenant list by moment/genre used to suggest songs to clients.
- **Guest Request Link**: per-booking public link/token allowing event guests to submit song requests.

## Requirements

### Requirement: Client Song Lists
The system SHALL let clients build must-play, do-not-play, and special-moment song lists for their booking in
the portal, with full CRUD.

#### Scenario: Client adds must-play and do-not-play
- **WHEN** a client adds songs to must-play and do-not-play lists
- **THEN** the selections attach to the booking and appear to the DJ/crew before and during the event

### Requirement: Streaming Integration & Preview
The system SHALL let clients paste a Spotify / Apple Music / YouTube Music playlist link and import its
tracks, and let staff preview tracks.

#### Scenario: Import a playlist
- **WHEN** a client pastes a Spotify playlist link
- **THEN** the tracks are imported as music selections with preview links where available

### Requirement: Curated Suggestion Lists
The system SHALL let tenants publish curated song lists by moment so clients can browse and choose.

#### Scenario: Choose from curated list
- **WHEN** a client browses the tenant's "First Dance" curated list and selects a song
- **THEN** the song is set as the first-dance selection for the booking (and links to the timeline)

### Requirement: Guest Song Requests
The system SHALL provide a per-event guest-facing request link so event guests can submit song requests
subject to the tenant's do-not-play rules and approval.

#### Scenario: Guest submits a request
- **WHEN** a guest submits a song via the event's public request link
- **THEN** it is added as a guest request, screened against the do-not-play list, and queued for DJ approval

### Requirement: Music Library & Availability Check
The system SHALL maintain an internal music library and let staff check whether a requested song is
available ("do I have it?").

#### Scenario: Library availability check
- **WHEN** a requested song is checked against the library
- **THEN** the system indicates whether it is in the tenant's library and flags gaps to acquire

### Requirement: DJ/Crew Play View
The system SHALL present the crew/DJ a consolidated, filterable view of all music selections for an event.

#### Scenario: DJ play view
- **WHEN** a DJ opens the event on the mobile app
- **THEN** must-play, do-not-play, special-moment, and approved guest requests are shown, filterable and
  markable as played

### Requirement: Music Lists On Client Planning
The system SHALL let the paying customer manage must-play, do-not-play, and special-moment lists on `/client/planning`. Accepted guests MAY submit general requests subject to existing guest-request rules.

#### Scenario: Customer adds a must-play in the SPA
- **WHEN** a customer adds a must-play song on `/client/planning`
- **THEN** the Music Selection is stored on that booking and appears for assigned crew

### Requirement: Apple And YouTube Playlist Import
The system SHALL import Apple Music and YouTube playlist links as music selections with preview URLs where the provider allows, in addition to Spotify. Missing keys SHALL not fail the music page.

#### Scenario: Import YouTube without a key
- **WHEN** a client pastes a YouTube playlist URL and no YouTube key is configured
- **THEN** the API returns a clear setup message and no selections are created

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

