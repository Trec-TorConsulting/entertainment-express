# Capability: Event Timeline (Run-of-Show Builder)

## Purpose
A collaborative **event-day timeline / run-of-show / itinerary builder** used by clients and staff to plan
the minute-by-minute flow of an event (arrivals, ceremony, grand entrance, first dance, toasts, cake, last
song, teardown). Distinct from the crew **run sheet** (logistics packet): the timeline is the *program*.
Standard in DJ/event tools (DJ Event Planner "Timelines", Check Cherry timeline preferences) and currently
missing from our spec.

### Data Model
- **Event Timeline**: booking (link), status (`draft|shared|finalized`), timezone, items (child:
  `start_time`, `end_time`, `title`, `description`, `responsible` (crew/vendor), `song` (link to music
  selection), `location`, `notes`, `visible_to_client` (bool), order).
- **Timeline Template**: name, event_type, default items — for quick-starting common event types.

## Requirements

### Requirement: Timeline Building
The system SHALL let staff build an ordered, timed run-of-show for a booking with items (time, title,
description, responsible party, associated song, location), with full CRUD.

#### Scenario: Build a reception timeline
- **WHEN** staff add timeline items (Grand Entrance 6:00, First Dance 6:15, Toasts 6:30, Dinner 6:45...)
- **THEN** the items persist in order with their times and details

### Requirement: Timeline Templates
The system SHALL provide reusable timeline templates per event type to quick-start a booking's timeline.

#### Scenario: Apply a template
- **WHEN** staff apply the "Wedding Reception" timeline template to a booking
- **THEN** the standard items are created and can be edited for the specific event

### Requirement: Client Collaboration
The system SHALL let clients view and (where permitted) suggest edits to the timeline in the portal, with
staff approval.

#### Scenario: Client suggests a change
- **WHEN** a client edits a client-visible timeline item or adds a request in the portal
- **THEN** the change is captured for staff approval and the client is notified of the outcome

### Requirement: Song Linkage
The system SHALL let timeline items reference specific songs from the booking's music selections.

#### Scenario: Link first-dance song
- **WHEN** a timeline item "First Dance" is linked to the client's chosen first-dance song
- **THEN** the song shows on the timeline and on the crew/DJ view

### Requirement: Finalization & Distribution
The system SHALL finalize a timeline and distribute it to crew (run sheet) and, if enabled, the client.

#### Scenario: Finalize and distribute
- **WHEN** staff finalize the timeline
- **THEN** it locks against client edits, appears on the crew run sheet/mobile app, and (if enabled) is
  shared with the client
