## ADDED Requirements

### Requirement: Structured Client Music Planning & Spotify Search
The system SHALL provide an interactive music planning interface where clients can search Spotify tracks, preview 30-second audio clips, and categorize songs into Must-Play, Formal Moments, and Do-Not-Play lists.

#### Scenario: Adding a First Dance track
- **WHEN** a client searches for "Lover - Taylor Swift" in `/client/music/:booking_id`
- **AND** assigns the moment to `First Dance`
- **THEN** the track metadata, Spotify ID, and album artwork are persisted and locked to the First Dance program slot.

### Requirement: Multi-Format DJ Software Playlist Export
The system SHALL export the event's curated tracks into native Serato CSV, Rekordbox XML, and VirtualDJ playlist formats with 1 click.

#### Scenario: Exporting Rekordbox collection XML
- **WHEN** an employee clicks "Export for Rekordbox" on the booking overview
- **THEN** the server returns an XML file adhering to Pioneer Rekordbox DJ XML schema with correct artist, title, and crate metadata.

### Requirement: Live Crowd Song Request & Tipping Feed
The system SHALL generate a public, tokenized mobile request page allowing party guests to search songs and optionally submit a digital tip to the DJ.

#### Scenario: Guest requests a song with a $10 tip
- **WHEN** a guest visits `/requests/:token`, submits "September - Earth Wind & Fire", and charges a $10 tip via Apple Pay
- **THEN** the request appears at the top of the DJ's live screen with a highlighted green tip badge.

### Requirement: Do-Not-Play Conflict Interception
The system SHALL cross-reference live guest requests against the client's Do-Not-Play list and alert the DJ before any track is queued.

#### Scenario: Guest requests a banned track
- **WHEN** a guest requests a track that matches the title or artist on the booking's Do-Not-Play list
- **THEN** the DJ screen flashes a bold red conflict warning: "CLIENT DO NOT PLAY VIOLATION".
