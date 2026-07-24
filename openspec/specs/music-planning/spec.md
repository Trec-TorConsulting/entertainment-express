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
