# Capability: Appointments & Scheduling (Consultations)

## Purpose
A **Calendly-style appointment scheduler** for sales consultations, planning meetings, venue walk-throughs,
and phone calls — distinct from event bookings. Prospects/clients self-book meetings against staff
availability, with calendar sync, reminders, and confirmations. Standard in HoneyBook (Scheduler) and Check
Cherry (appointment scheduling) and currently missing from our spec.

### Data Model
- **Meeting Type**: name, duration, location_type (`phone|video|in_person`), buffer, availability_window,
  assigned_staff/round-robin, questions, active, video_link_provider.
- **Availability Schedule**: staff (link), weekly hours, date overrides, time-off (shared with workforce
  availability where applicable).
- **Appointment**: meeting_type (link), staff (link), invitee (name/email/phone), start/end, status
  (`scheduled|rescheduled|canceled|completed|no_show`), location/video_link, related lead/booking, notes.

## Requirements

### Requirement: Bookable Meeting Types
The system SHALL let tenants define meeting types with duration, location, buffers, and availability, with
full CRUD.

#### Scenario: Create a consultation type
- **WHEN** a tenant creates a 30-minute "Free Consultation" video meeting type with weekday availability
- **THEN** it becomes self-bookable via a public scheduling link

### Requirement: Self-Service Booking
The system SHALL let prospects/clients self-book an available slot, collecting their details and any intake
questions.

#### Scenario: Prospect books a consult
- **WHEN** a prospect picks an open slot and submits their info
- **THEN** an Appointment is created, both parties are confirmed, and a lead is created/linked in CRM

### Requirement: Availability & Conflict Prevention
The system SHALL compute staff availability from working hours, buffers, existing appointments, and event
assignments to prevent double-booking.

#### Scenario: No double-booking
- **WHEN** a staff member already has an appointment or event assignment overlapping a requested slot
- **THEN** that slot is not offered

### Requirement: Calendar Sync
The system SHALL two-way sync appointments with Google/Microsoft/Apple calendars (via `integrations`).

#### Scenario: Appointment on staff calendar
- **WHEN** an appointment is booked
- **THEN** it appears on the assigned staff member's connected calendar, and external busy times block
  availability

### Requirement: Reminders, Reschedule & Confirmation
The system SHALL send confirmations/reminders and allow reschedule/cancel with policy, tracking no-shows.

#### Scenario: Reminder and reschedule
- **WHEN** an appointment approaches, or an invitee reschedules via their link
- **THEN** reminders are sent and reschedules update both calendars and notify both parties

### Requirement: Video Links
The system SHALL generate/attach a video meeting link for video meeting types.

#### Scenario: Video link attached
- **WHEN** a video consultation is booked
- **THEN** a meeting link is included in the confirmation and calendar event
