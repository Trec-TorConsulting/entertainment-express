## ADDED Requirements

### Requirement: Temporal Availability & Buffer Window Calculation
The system SHALL verify equipment availability against discrete datetime windows expanded by item-specific or category-specific prep, travel, and sanitization turnaround buffers.

#### Scenario: Turnaround buffer prevents double booking
- **WHEN** Item `BH-01` has an event ending at 16:00 on Saturday with an 18-hour sanitization/drying buffer
- **AND** a customer requests `BH-01` for an event starting at 09:00 on Sunday morning (17 hours later)
- **THEN** `check_temporal_availability` returns `available: false` with conflict reason citing the active turnaround buffer.

### Requirement: Field Quarantine Lockout
The system SHALL immediately withdraw any equipment item flagged as damaged, dirty, or failing safety inspection from all prospective availability queries.

#### Scenario: Crew flags torn seam during teardown
- **WHEN** a crew member submits a damage report for asset `BH-01` with reason `Torn Seam`
- **THEN** an `EE Equipment Quarantine` record is created
- **AND** asset `BH-01` cannot be booked or reserved until an authorized owner or technician records an inspection clearance.

### Requirement: Visual Resource Timeline Grid
The system SHALL render a responsive timeline grid in the Owner Portal showing item availability, active bookings, buffer blocks, and quarantine periods.

#### Scenario: Viewing inventory conflicts
- **WHEN** an owner navigates to `/owner/inventory/availability`
- **THEN** the timeline displays equipment grouped by category with visual color blocks for confirmed events (blue), buffers (amber), and quarantines (red).
