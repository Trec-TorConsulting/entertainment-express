# Capability: Venue Management

## Purpose
A reusable **venue database** so tenants stop re-entering location details for repeat venues. Venues carry
addresses, geolocation, access/load-in notes, parking, power/electrical, noise ordinances, contacts, and
preferred-vendor status. Bookings reference a venue, auto-populating logistics for crew. Standard in DJ
Event Planner ("Venues") and event tools; currently missing from our spec.

### Data Model
- **Venue**: name, address, geo, venue_type, capacity, contacts (child: name/role/phone/email),
  load_in_notes, parking_notes, power_notes, noise_curfew, setup_restrictions, wifi, preferred (bool),
  coi_required (bool), maps_link, photos, service_area (link), notes.
- **Venue Event History**: derived — bookings at this venue.

## Requirements

### Requirement: Venue Registry
The system SHALL maintain a venue database with logistics detail and contacts, with full CRUD.

#### Scenario: Create and reuse a venue
- **WHEN** a booking is created at a venue already in the database
- **THEN** the venue's address, access notes, parking, power, and contacts auto-populate the booking

### Requirement: Venue Logistics on Run Sheet
The system SHALL surface venue load-in, parking, power, and curfew details to crew on the run sheet.

#### Scenario: Load-in details for crew
- **WHEN** a crew member opens an event at a known venue
- **THEN** the run sheet shows load-in instructions, parking, power, and curfew from the venue record

### Requirement: Venue Requirements & COI Flags
The system SHALL track venue requirements (e.g., certificate of insurance required, curfew) and flag them on
related bookings.

#### Scenario: COI required
- **WHEN** a booking is at a venue flagged `coi_required`
- **THEN** the booking flags that a certificate of insurance must be provided before the event (links to
  `insurance-compliance`)

### Requirement: Venue History & Insights
The system SHALL show the history of events at a venue and support venue-based reporting.

#### Scenario: Venue history
- **WHEN** staff view a venue
- **THEN** past and upcoming events at that venue are listed

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

#### Scenario: Venue history on company OS
- **WHEN** an owner opens a venue
- **THEN** this site’s bookings at that venue are listed and other tenants’ jobs never appear
