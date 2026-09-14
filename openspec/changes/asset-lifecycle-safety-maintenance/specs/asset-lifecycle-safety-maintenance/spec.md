## ADDED Requirements

### Requirement: Serialized Usage Telemetry Tracking
The system SHALL track cumulative event usage meters (operating hours, event rental count, and vehicle mileage) on each serialized `Service Asset`.

#### Scenario: Incrementing usage count on event completion
- **WHEN** an event is marked completed by dispatch or crew checkout
- **THEN** the system increments the event count and operating duration for all assigned serialized assets

#### Scenario: Vehicle odometer update
- **WHEN** crew enters vehicle return odometer readings in the field app
- **THEN** the vehicle asset's current mileage updates and checks against mileage-based maintenance thresholds

### Requirement: Maintenance Triggers & Work Orders
The system SHALL evaluate recurring calendar intervals and usage meters against defined `Equipment Maintenance Schedule` rules, automatically raising an ERPNext `Asset Maintenance Log` when thresholds are reached.

#### Scenario: Usage threshold maintenance trigger
- **WHEN** an inflatable unit reaches 20 completed rental events
- **THEN** the system automatically generates an inspection task and flags the unit for preventative seam and blower maintenance

#### Scenario: Calendar-based annual inspection trigger
- **WHEN** a sound system reaches 12 months since its last electrical safety inspection
- **THEN** an annual PAT test task is scheduled and the owner is notified 30 days prior to expiry

### Requirement: Safety Certificate Dispatch Gate
The system SHALL enforce active, valid safety certificates on designated assets, preventing dispatch assignment if a required certificate is expired or missing.

#### Scenario: Dispatch blocked for expired certificate
- **WHEN** a dispatcher attempts to assign an inflatable with an expired state safety certificate
- **THEN** the system rejects the assignment with a descriptive validation error: "Asset {asset_id} cannot be assigned: State Safety Inspection Certificate expired on {date}"

#### Scenario: Overriding safety block by tenant admin
- **WHEN** an `EE Tenant Admin` provides an explicit authorized override with an audit reason
- **THEN** the assignment proceeds and an audit log entry is recorded

### Requirement: Teardown Quarantine Workflow
The system SHALL allow field crew to report equipment damage with photos and severity during on-site teardown, immediately transitioning the asset into a `Quarantined` state that blocks it from subsequent bookings.

#### Scenario: Crew flags damaged asset on teardown
- **WHEN** a crew member submits a defect report for an amplifier with photo proof and notes "intermittent channel failure"
- **THEN** the asset status changes to `Quarantined`, future dispatch availability is revoked, and a maintenance repair order is created

#### Scenario: Releasing asset from quarantine
- **WHEN** a technician completes repairs and marks the maintenance order as `Repaired & Tested`
- **THEN** the asset status returns to `Available` and availability is restored
