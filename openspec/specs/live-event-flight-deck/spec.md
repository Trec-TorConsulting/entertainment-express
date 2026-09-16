# Capability: Live Event Flight Deck & Dynamic Timeline Pacing

## Purpose
Provides a real-time operational mission control for `/owner` and dynamic event pacing execution across `/employee` and `/client`. Tracks vehicle GPS locations, geofenced crew milestone check-ins, live pacing delays, and hardware incident escalations.

## Requirements

### Requirement: Flight Deck Mission Control
The `/owner/flight-deck` command center (`get_active_flight_deck`) SHALL aggregate active day bookings, venue coordinates, live execution statuses, pacing delays, and open incident alerts.

#### Scenario: Viewing flight deck command center
- **WHEN** an owner accesses `/owner/flight-deck`
- **THEN** all active day event cards and vehicle pins are rendered

### Requirement: Geofenced Milestone Verification
The field milestone state machine (`update_field_milestone`) SHALL calculate Haversine distance against venue coordinates to verify crew presence before updating status milestones (`on_site`, `rigging`, `show_live`, `teardown`).

#### Scenario: On-site milestone check-in
- **WHEN** a worker taps "On-Site" check-in within 500m of venue coordinates
- **THEN** milestone status updates and broadcasts to flight deck

### Requirement: Dynamic Timeline Cascade Shifting
When an event runs late, the pacing controller (`shift_timeline_pacing`) SHALL recalculate all downstream uncompleted moments by the requested delay minutes and emit real-time Socket.IO broadcasts across all connected portals.

#### Scenario: Shifting timeline pacing
- **WHEN** an event lead taps "+15m" delay
- **THEN** downstream uncompleted moments shift and synchronize across screens
