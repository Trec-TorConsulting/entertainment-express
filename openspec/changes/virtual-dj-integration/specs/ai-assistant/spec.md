## ADDED Requirements

### Requirement: AI Virtual DJ Set Curation
The system SHALL provide an AI-powered Virtual DJ curation engine that analyzes booking details, event type, timeline moments, client vibe preferences, must-plays, and do-not-plays to auto-generate structured, energy-curved playlist drafts.

#### Scenario: Generate AI playlist for wedding reception
- **WHEN** an authorized user requests an AI Virtual DJ set for a wedding booking
- **THEN** the system generates a structured tracklist partitioned across timeline moments with BPM pacing and energy ratings, excluding all do-not-play items and incorporating all must-play items

#### Scenario: Graceful degradation when AI offline
- **WHEN** the LLM backend is unreachable during set generation
- **THEN** the system returns rule-based recommendations from the tenant's curated lists with `available` set to false and the message containing `AI suggestion unavailable`
