## ADDED Requirements

### Requirement: Apple And YouTube Playlist Import
The system SHALL import Apple Music and YouTube playlist links as music selections with preview URLs where the provider allows, in addition to Spotify. Missing keys SHALL not fail the music page.

#### Scenario: Import YouTube without a key
- **WHEN** a client pastes a YouTube playlist URL and no YouTube key is configured
- **THEN** the API returns a clear setup message and no selections are created
