## ADDED Requirements

### Requirement: Frictionless Public Guest Gallery
The system SHALL provide a web-based, mobile-responsive gallery accessible via secure token without requiring an account or native app installation.

#### Scenario: Guest scans photo strip QR code
- **WHEN** a guest scans the QR code printed on their photo strip
- **THEN** the browser opens `/gallery/:token` showing the event's photos in a responsive masonry view.

### Requirement: Client Deliverables & Privacy Moderation
The system SHALL enable the booking client to mark photos as favorites, hide specific images from the public view, and trigger a full-resolution ZIP download.

#### Scenario: Client hides an unflattering photo
- **WHEN** the authenticated client toggles "Hide from Guest Gallery" on photo `IMG_4091.jpg`
- **THEN** `IMG_4091.jpg` immediately disappears from `/gallery/:token` while remaining visible in the client's private archive.

### Requirement: Automated Background Thumbnail Generation
The system SHALL automatically generate optimized WebP thumbnails and medium-resolution web versions upon upload to conserve mobile bandwidth.

#### Scenario: Booth uploads 12MB RAW/JPEG photo
- **WHEN** the photo booth rig posts a high-resolution image to `upload_booth_media`
- **THEN** the server stores the original in object storage and queues background generation of a 300px thumbnail and a 1600px web view.
