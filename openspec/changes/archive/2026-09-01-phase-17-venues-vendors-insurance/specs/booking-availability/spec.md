## ADDED Requirements

### Requirement: Booking Stores Venue Snapshot
The system SHALL link a job to a Venue and keep address/geo snapshots on the booking so availability and history do not depend on later venue edits.

#### Scenario: Venue change does not move past jobs
- **WHEN** a venue address is updated after a confirmed job
- **THEN** that job’s stored address remains the snapshot from link time
