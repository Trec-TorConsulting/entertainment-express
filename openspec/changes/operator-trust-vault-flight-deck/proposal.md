## Why

Across online event planning forums, customer trust and scam anxiety have exploded. Unscrupulous fly-by-night operators use stolen photos, take cash/Venmo deposits, and either fail to show up or dispatch unvetted crews without liability insurance. Legitimate event businesses lose deals to price-slashing scammers or suffer from nervous clients calling and texting frantically on event morning asking "Are you really coming? Where is the truck?". Operators need verifiable trust badges (insurance COI, state licenses, background checks) embedded on their proposals, and clients need a live "Flight Deck" on event day showing live vehicle GPS en route, arrival ETA, and milestone status.

## What Changes

- Introduce an **Operator Trust Vault** in Frappe storing cryptographically verifiable compliance badges: General Liability COI ($1M–$2M policy limit), State Business Entity Registration, and Crew Background Check Verification.
- Embed dynamic **Trust Seals & COI Download Buttons** on interactive proposals and client portals, giving event coordinators and venues 1-click verification of vendor legitimacy.
- Deliver an **Event Day Client Flight Deck** (`/client/flight-deck/:booking_id`) that activates 6 hours prior to call time, featuring:
  1. Live real-time milestone stepper (`Crew Dispatched` → `En Route` → `Arrived On Site` → `Sound Check / Setup` → `Event Live` → `Teardown`).
  2. Live GPS vehicle map tracking while the driver is actively en route, with calculated ETA powered by distance matrix APIs.
  3. Strict driver privacy protection: GPS telemetry streaming terminates automatically the moment the driver marks "Arrived On Site".
  4. Direct masked communication button to connect with the on-site crew lead.

## Capabilities

### New Capabilities
- `operator-trust-vault-flight-deck`: Business verification trust seals, COI verification downloads, and real-time event-day client flight deck with privacy-guarded vehicle GPS en-route tracking.

### Modified Capabilities
- `customer-portal`: Adds live event-day flight deck view.
- `mobile-field-app`: Streams en-route GPS coordinates with automatic arrival cutoff.

## Impact

- **DocTypes**:
  - `EE Trust Credentials`: Policy number, carrier, expiry date, COI PDF attachment, background check certification date.
  - `EE Live Tracking Session`: Linked to `Booking`, tracks active vehicle lat/long, heading, speed, ETA minutes, and session status (`Created`, `Streaming`, `Terminated`).
- **Server APIs**:
  - `entertainment_express.live_tracking.api.get_client_flight_deck(booking_id)`
  - `entertainment_express.live_tracking.api.stream_driver_telemetry(session_token, lat, lng, speed)`
  - `entertainment_express.live_tracking.api.record_milestone_transition(booking_id, new_milestone)`
- **Portal UI**:
  - Client Route: `/client/flight-deck/:booking_id` (Interactive radar/map, milestone stepper, crew profile card).
  - Field App: En-route toggle that prompts background geolocation permission and broadcasts coordinates until arrival.
