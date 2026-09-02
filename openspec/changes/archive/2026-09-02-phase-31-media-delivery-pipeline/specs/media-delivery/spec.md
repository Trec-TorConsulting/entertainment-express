## ADDED Requirements

### Requirement: Booking Media Galleries
The system SHALL create media galleries per booking with uploaded items stored in tenant object storage.

#### Scenario: Crew uploads booth photos
- **WHEN** crew uploads photos to a booking gallery
- **THEN** items appear for staff and remain unpublished to clients until published

### Requirement: Publish And Share
The system SHALL let owners publish galleries and issue expiring share links for clients or guests.

#### Scenario: Client opens published gallery
- **WHEN** a gallery is published
- **THEN** the paying customer can view/download items on `/client` and share links work until expiry

### Requirement: Templates And Print Counts
The system SHALL store optional template names and print/session counts on gallery sessions for booth reporting.

#### Scenario: Increment print count
- **WHEN** staff records prints for a session
- **THEN** the gallery print count increments for that booking only
