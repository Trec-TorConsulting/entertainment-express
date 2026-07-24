# Capability: Event Planning Forms (Questionnaire Engine)

## Purpose
A configurable, conditional **questionnaire / planning-form engine** — the feature DJs, booths, and event
pros use most. Tenants build form templates per event type (wedding, school, corporate, mitzvah,
quinceañera, birthday, etc.) that customers complete in the portal after booking, with automatic reminders
until complete and results surfaced to crew on the run sheet. This is the single most-used post-booking
tool in competing products (Check Cherry, DJ Event Planner) and is currently missing from our spec.

### Data Model
- **Planning Form Template**: name, event_type, active, fields (child: `label`, `field_type`
  [text/long_text/select/multiselect/date/time/number/checkbox/file_upload/song_picker/playlist_link/
  section], options, required, conditional_on (field+value), help_text, order).
- **Planning Form Instance**: booking (link), template (link), status (`not_started|in_progress|complete`),
  answers (child: field, value/file), completion_percent, last_reminder_sent.
- **Field Library**: reusable fields (e.g., "Bride name pronunciation", "Guest count") shareable across
  templates.

## Requirements

### Requirement: Configurable Form Templates
The system SHALL let a tenant build planning-form templates with typed fields, sections, required flags, and
help text, with full CRUD.

#### Scenario: Build a wedding planning form
- **WHEN** a tenant creates a "Wedding" template with fields (must-play songs, do-not-play songs, name
  pronunciation, ceremony details, timeline preferences, special announcements)
- **THEN** the template is saved and can be attached to wedding-type packages/bookings

### Requirement: Conditional Logic
The system SHALL show/hide fields based on prior answers (conditional questions).

#### Scenario: Conditional field
- **WHEN** a field is configured to appear only when "Event includes ceremony? = Yes"
- **THEN** the ceremony fields display only when the customer answers Yes, and are hidden/omitted otherwise

### Requirement: Event-Type Assignment
The system SHALL attach the correct form template(s) to a booking automatically based on the booking's event
type / package.

#### Scenario: Auto-attach on booking
- **WHEN** a booking is confirmed for a wedding package
- **THEN** the wedding planning form instance is created and made available in the customer portal

### Requirement: Customer Completion in Portal
The system SHALL let customers complete planning forms in the portal on their own time, saving progress, and
track completion percentage.

#### Scenario: Save progress
- **WHEN** a customer partially completes a form and returns later
- **THEN** their prior answers are retained and completion percentage reflects progress

### Requirement: Automatic Reminders
The system SHALL send automatic reminders until a form is complete, on a configurable cadence, stopping when
complete or when the event passes.

#### Scenario: Reminder until complete
- **WHEN** a planning form is incomplete and the reminder cadence is due
- **THEN** a reminder is sent to the customer (via `notifications`) and stops once the form is complete

### Requirement: Crew Visibility
The system SHALL surface completed planning-form answers to assigned crew on the run sheet / mobile app.

#### Scenario: Answers on run sheet
- **WHEN** a crew member opens the event
- **THEN** the planning-form answers (must-play, do-not-play, pronunciations, special notes) appear in the
  run sheet

### Requirement: Post-Event Evaluation Forms
The system SHALL support post-event feedback/evaluation forms distinct from public reviews, with results
reporting.

#### Scenario: Send evaluation
- **WHEN** an event completes
- **THEN** an evaluation form can be sent to the customer, and responses are aggregated for reporting
