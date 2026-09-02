## ADDED Requirements

### Requirement: Public Scheduling Page
The system SHALL publish each active Meeting Type on the tenant site as a self-book page. Guests SHALL pick an offered slot and submit name and email. The request SHALL be rate-limited. Slots SHALL come only from this tenant’s site database.

#### Scenario: Prospect books a consult
- **WHEN** a visitor opens the public schedule page, picks an open slot, and submits name and email
- **THEN** an Appointment is created for that type and staff, a Lead is created or linked on this site, and both parties receive a confirmation through existing notification channels

#### Scenario: Other tenant’s types hidden
- **WHEN** a visitor loads tenant A’s schedule page
- **THEN** meeting types and slots from tenant B never appear

### Requirement: Native Slot Engine
The system SHALL offer only slots that fit staff weekly hours, date overrides, buffers, existing Appointments, Event Booking crew assignments, and time-off. Sending a quote SHALL remain unrelated; this engine does not reserve event gear.

#### Scenario: Event assignment blocks a consult
- **WHEN** staff is assigned to a confirmed Event Booking overlapping Tuesday 2pm
- **THEN** Tuesday 2pm is not offered for that staff member’s meeting types

#### Scenario: Two prospects one slot
- **WHEN** two guests request the same last remaining slot
- **THEN** one Appointment is stored and the other request is rejected as no longer open

## MODIFIED Requirements

### Requirement: Calendar Sync
The system SHALL treat native EE availability as the source of truth for appointment slots in this phase. Two-way Google / Microsoft / Apple calendar sync SHALL remain the `integrations` phase-13 work. The system MAY offer an ICS download for a booked Appointment.

#### Scenario: Appointment on staff calendar
- **WHEN** an appointment is booked
- **THEN** it appears on `/owner` and `/employee` calendars for that staff member on this tenant site

#### Scenario: ICS download
- **WHEN** a confirmed invitee requests a calendar file
- **THEN** the system returns an ICS for that Appointment only (no other tenants, no other meetings)
