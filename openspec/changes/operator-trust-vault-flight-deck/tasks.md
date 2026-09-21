## 1. Trust Vault Schemas & Tracking Session Model

- [x] 1.1 Create `EE Trust Credentials` DocType storing insurance carrier, policy limit, expiry, and COI attachment.
- [x] 1.2 Create `EE Live Tracking Session` DocType with ephemeral coordinates and status lifecycle.
- [x] 1.3 Add milestone state machine to `Booking`: `dispatched`, `en_route`, `on_site`, `setup_ready`, `live`, `completed`.

## 2. Telemetry APIs & Privacy Controls

- [x] 2.1 Implement `update_driver_location` endpoint with token validation and Redis pub/sub broadcast.
- [x] 2.2 Implement `transition_event_milestone` endpoint with automated geofence boundary auto-arrival.
- [x] 2.3 Implement privacy scrubber: automatically purge tracking coordinates once milestone reaches `on_site`.
- [x] 2.4 Implement `get_flight_deck_status` endpoint providing read-only client telemetry.

## 3. Client Portal UI & Mobile Field Integration

- [x] 3.1 Build `FlightDeck.tsx` at `/client/flight-deck/:booking_id` with animated milestone stepper and live map.
- [x] 3.2 Build `TrustBadgeRow.tsx` component embedded on proposals and client dashboard.
- [x] 3.3 Add en-route GPS streaming button and geofence listener to mobile field app `/employee/field`.

## 4. Verification & Testing

- [x] 4.1 Write automated tests `test_flight_deck_tracking.py` testing milestone transitions, geofence auto-cutoff, and privacy data purging.
