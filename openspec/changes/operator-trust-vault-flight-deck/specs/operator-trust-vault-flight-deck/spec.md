## ADDED Requirements

### Requirement: Verified Operator Trust Badges
The system SHALL surface verified credentials (general liability insurance COI, state business registration, and worker vetting) on proposals and booking confirmations.

#### Scenario: Venue coordinator downloads COI
- **WHEN** a venue coordinator reviews an interactive proposal and clicks "Download Verified COI ($2M Policy)"
- **THEN** the system generates a watermarked PDF certificate verifying the policy is active and current.

### Requirement: Real-Time Event Day Milestone Stepper
The system SHALL provide clients with an event day flight deck displaying sequential operational milestones (`Dispatched` -> `En Route` -> `Arrived` -> `Setup Ready` -> `Event Live` -> `Teardown`).

#### Scenario: Driver marks en route
- **WHEN** the driver taps "Start Drive to Venue" in the mobile field app
- **THEN** the milestone transitions to `En Route` and the client flight deck displays the live map and calculated arrival ETA.

### Requirement: Automated Privacy Geofence Cutoff
The system SHALL immediately cease GPS location streaming the moment the vehicle crosses the venue geofence boundary or marks on-site arrival.

#### Scenario: Vehicle arrives at event venue
- **WHEN** the vehicle enters within 200 meters of the venue address
- **THEN** the tracking session is marked `Arrived` and all subsequent GPS coordinate broadcasts from the device are discarded.
