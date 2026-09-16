## Why

Event management software traditionally operates on an administrative cadence—handling quotes, contracts, and invoices days or weeks in advance. However, the true vulnerability and reputational risk in mobile entertainment occurs during **Saturday night live operations**. When vans are caught in traffic, equipment faults occur during rigging, or a wedding ceremony runs 30 minutes late, owners and operators are blind, forced to coordinate via chaotic phone calls and frantic group texts.

The **Live Event Flight Deck & Dynamic Timeline Pacing** change introduces a real-time operational mission control for `/owner` and a synchronized field execution engine across `/employee` and `/client`. It provides live telemetry on van locations, geofenced crew status milestones, hardware fault escalation, and instant 1-click timeline shifting that cascades schedule adjustments automatically across all field staff and client screens.

## What Changes

- **Live Ops Flight Deck on `/owner`**: High-density, real-time command map showing all active events for the day, vehicle locations, geofenced crew check-in states, and active incident alerts.
- **Geofenced Field Milestone State Machine**: Structured field progression (`dispatched` → `en_route` → `on_site` → `rigging` → `soundcheck` → `show_live` → `teardown` → `cleared`) with automated GPS geofence validation and 1-tap progression in `/employee`.
- **Dynamic Timeline Pacing Engine**: Live event delay calculator in `/employee`. When a moment runs late (e.g., speeches or ceremony delayed by 20 minutes), the event lead taps "+20m", automatically shifting all downstream timeline moments, run-of-show cues, and client portal displays without manual recalculation.
- **Hardware Fault & Incident Telemetry**: 1-tap incident logging in `/employee` (e.g., power trip, speaker failure, photo booth printer jam) with automated push notification alerts to the owner flight deck and standby technicians.
- **Client & Vendor Live Timeline Sync**: Real-time read-only timeline view on `/client` keeping event hosts, coordinators, and caterers synchronized to the live schedule.

## Capabilities

### New Capabilities
- `live-event-flight-deck`: Real-time operational command center, geofenced crew state machine, equipment fault telemetry, and dynamic timeline pacing engine.

### Modified Capabilities
- `event-timeline`: Support live moment offset shifting (`delay_minutes`), active cue highlighting, and dynamic broadcast via WebSocket / SSE.
- `owner-portal`: Add live `/owner/flight-deck` command center route with interactive map and event cards.
- `employee-portal`: Add Live Event Day execution view with geofenced milestone check-in, 1-tap timeline offset shifter, and incident reporting.
- `customer-portal`: Display live timeline status badge ("Live Now: Dinner & Speeches") and synced moment pacing.

## Impact

- **Backend Architecture**:
  - `entertainment_express/live_ops/flight_deck.py`: Real-time aggregation of active day bookings, coordinates, milestones, and incidents.
  - `entertainment_express/live_ops/timeline_pacing.py`: Cascade shifting algorithm for downstream `Event Timeline Moment` items.
  - `entertainment_express/live_ops/incident_desk.py`: Live incident logger and dispatcher.
- **DocTypes**:
  - New `EE Live Incident`: Records timestamp, severity (`minor`, `major`, `critical`), equipment reference, and resolution.
  - Extend `Event Booking`: Add `live_status`, `last_geofence_ping`, `active_timeline_offset_minutes`, and `incident_count`.
  - Extend `Event Timeline Moment`: Add `is_current_moment`, `actual_start_time`, and `is_delayed`.
- **Realtime / Socket**:
  - Uses Frappe's native Socket.IO channel `live_event_{booking_name}` and tenant-wide `flight_deck_{tenant}` for sub-second synchronization.
