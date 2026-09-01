## ADDED Requirements

### Requirement: Portal Music Requests
The system SHALL accept must-play / do-not-play / special-moment requests from the paying customer and accepted guests in `/client/planning` using existing music-planning APIs.

#### Scenario: Guest requests a song
- **WHEN** an accepted guest submits a must-play
- **THEN** it appears on that booking’s music list and not on any other booking
