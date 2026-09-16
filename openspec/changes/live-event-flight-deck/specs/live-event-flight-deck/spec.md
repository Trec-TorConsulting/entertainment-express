## ADDED Requirements

### Requirement: Live Ops Flight Deck Real-Time Aggregation
The system SHALL provide an API to aggregate all active events on the current date, returning geographic coordinates, vehicle GPS tracking, geofence milestones, active timeline moments, and open incident tickets.

#### Scenario: Current day events queried on flight deck
- **GIVEN** 6 events scheduled for today across 4 venues
- **WHEN** an owner accesses `/api/method/entertainment_express.live_ops.flight_deck.get_active_flight_deck`
- **THEN** the system returns each booking's current live status (`en_route`, `on_site`, `show_live`, etc.), latest coordinates, crew roster, and any open incidents

### Requirement: Geofenced Field Progression State Machine
The system SHALL enforce a deterministic state machine for event execution: `dispatched` → `en_route` → `on_site` → `rigging` → `soundcheck` → `show_live` → `teardown` → `cleared`. The system SHALL validate device GPS coordinates against the venue's geofence radius upon transitioning to `on_site`.

#### Scenario: Crew arrives on-site within geofence
- **GIVEN** a venue located at latitude 39.9526, longitude -75.1652 with a 300-meter radius
- **WHEN** an employee submits an `on_site` check-in with GPS coords 39.9530, -75.1650
- **THEN** the system validates the geofence, updates the booking's `live_status` to `on_site`, logs the arrival timestamp, and broadcasts the status via Socket.IO

### Requirement: Dynamic Timeline Pacing Cascade
The system SHALL support shifting live timeline moments by an arbitrary minute offset (`+N` or `-N` minutes). Shifting a moment SHALL automatically cascade the new estimated start and end times to all subsequent unfinished moments for that event and publish real-time notifications to connected clients and crew.

#### Scenario: Event lead applies a 20-minute delay
- **GIVEN** an active event timeline with "First Dance" scheduled at 19:30 and "Cake Cutting" at 20:15
- **WHEN** the event lead submits `shift_timeline_pacing(booking_name, offset_minutes=20, reason="Dinner delayed")`
- **THEN** the system adjusts "First Dance" to 19:50, "Cake Cutting" to 20:35, updates `Event Booking.active_timeline_offset_minutes = 20`, and pushes updates to `/employee` and `/client` screens within 500ms

### Requirement: Equipment Fault & Incident Dispatch
The system SHALL allow field crew to log operational incidents (`minor`, `major`, `critical`) tagged to serialized assets, vehicles, or venue conditions, immediately notifying the owner flight deck.

#### Scenario: Critical equipment failure logged in field
- **GIVEN** an active live event
- **WHEN** a crew member files a `critical` incident for "Subwoofer amplifier blown"
- **THEN** the system creates an `EE Live Incident`, sends an urgent high-priority push notification to all tenant administrators, and marks the event card on the Flight Deck with a blinking red critical alert
