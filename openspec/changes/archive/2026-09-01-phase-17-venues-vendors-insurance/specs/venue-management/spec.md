## ADDED Requirements

### Requirement: Venue Registry On Company OS
The system SHALL let the owner create, edit, and deactivate venues on `/owner` without `/app`. Labels SHALL be business language, not DocType names. Booking a known venue SHALL copy address, geo, load-in, parking, power, and curfew onto that job as a snapshot.

#### Scenario: Create and reuse a venue
- **WHEN** an owner saves a hall with load-in notes and later picks it on a job
- **THEN** the job shows that address and notes, and a later venue edit does not rewrite past jobs

#### Scenario: Other tenant hidden
- **WHEN** staff list venues
- **THEN** only this site’s venues appear

### Requirement: Venue Logistics On Run Sheet
The system SHALL surface venue load-in, parking, power, and curfew to crew on the run sheet for that booking.

#### Scenario: Load-in details for crew
- **WHEN** a crew member opens an assigned job at a known venue
- **THEN** the run sheet shows load-in, parking, power, and curfew from the job snapshot

### Requirement: Venue COI Flag
The system SHALL flag a booking when its venue requires a certificate of insurance until a COI file is attached (see `insurance-compliance`).

#### Scenario: COI required
- **WHEN** a job is linked to a venue with COI required and no delivered certificate
- **THEN** the job shows that a certificate is still needed

### Requirement: Venue History
The system SHALL list past and upcoming jobs at a venue on this tenant only.

#### Scenario: Venue history
- **WHEN** an owner opens a venue
- **THEN** this site’s bookings at that venue are listed and other tenants’ jobs never appear
