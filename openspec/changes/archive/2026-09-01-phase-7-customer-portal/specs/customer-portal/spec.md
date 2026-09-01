## ADDED Requirements

### Requirement: Published Event Photos
The system SHALL let the owner publish files on a job and SHALL list those published files on `/client/photos` for booking members. Unpublished files SHALL be hidden from customers and guests. Downloads SHALL check membership. Guests SHALL NOT upload.

#### Scenario: Customer opens published gallery
- **WHEN** the owner publishes a photo on a job and the paying customer opens Photos
- **THEN** they can view/download that file and do not see unpublished files

#### Scenario: Guest sees only this event
- **WHEN** an accepted guest opens Photos
- **THEN** they see published files for that event only
