# Capability: Live Tracking

## Purpose
Client-facing live ETA and delivery progress from crew en-route location pings.

## Requirements

### Requirement: Live Tracking Sessions
The system SHALL start a live tracking session when crew marks en-route and end it when the job is completed or canceled.

#### Scenario: Start on en-route
- **WHEN** assigned crew marks en-route
- **THEN** a tracking session with share token is created for that booking

### Requirement: Client ETA View
The system SHALL show estimated arrival and last progress to the paying customer while the session is active.

#### Scenario: Customer views ETA
- **WHEN** a customer opens live tracking for their booking
- **THEN** they see ETA minutes and status without seeing other tenants' jobs

### Requirement: Tracking Privacy Stop
The system SHALL stop accepting location pings and invalidate the share token when the session ends.

#### Scenario: Complete stops tracking
- **WHEN** the job is marked complete
- **THEN** further location pings are rejected and the share link no longer shows live position
