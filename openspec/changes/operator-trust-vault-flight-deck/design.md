## Context

Event day is extremely stressful for clients (e.g. nervous wedding couples or corporate meeting planners). A 15-minute traffic delay without visibility triggers panic phone calls. Uber and DoorDash have established the consumer expectation that when someone is traveling to deliver a service, you see their vehicle moving on a map with an accurate ETA.

## Goals / Non-Goals

**Goals:**
- Present verifiable business credentials on proposals: verified insurer, policy number, and 1-click COI PDF download.
- Display an animated milestone progress bar on event day in the client portal.
- Render vehicle en-route tracking on Leaflet / Mapbox using ephemeral WebSockets or polling (every 10 seconds).
- Strictly enforce driver privacy: GPS coordinates are never stored permanently; telemetry is discarded once the driver marks "Arrived On Site".

**Non-Goals:**
- 24/7 continuous vehicle tracking outside of dispatched event trips.
- In-cab driver video surveillance.

## Architecture & DocType Definitions

### 1. `EE Trust Credentials` (Single per Tenant or Brand)
- **Fields:**
  - `carrier_name`: Data (e.g. "Travelers", "Next Insurance")
  - `policy_number`: Data
  - `coverage_amount`: Currency (e.g. $2,000,000)
  - `policy_expiry`: Date
  - `coi_document`: Attach (PDF)
  - `is_state_registered`: Check (default 1)
  - `state_registration_id`: Data
  - `background_check_provider`: Data (e.g. "Checkr")
  - `last_vetted_date`: Date

### 2. `EE Live Tracking Session`
- **Fields:**
  - `booking`: Link to `Booking` (unique)
  - `token`: Data (ephemeral 64-char session token)
  - `driver_user`: Link to `User`
  - `current_lat`: Float
  - `current_lng`: Float
  - `current_speed_mph`: Float
  - `calculated_eta_datetime`: Datetime
  - `status`: Select (`Pending`, `Active`, `Arrived`, `Closed`)
  - `last_ping_datetime`: Datetime

## Server APIs & Python Hooks

File: `entertainment_express/live_tracking/api.py`

```python
import frappe
from frappe.utils import now_datetime

@frappe.whitelist(allow_guest=True)
def get_flight_deck_status(booking_id, client_token=None):
    """Returns milestone status, lead crew contact, and active vehicle telemetry."""
    pass

@frappe.whitelist()
def update_driver_location(session_token, lat, lng, speed_mph=0):
    """High-frequency location update from crew mobile app while en route."""
    pass

@frappe.whitelist()
def transition_event_milestone(booking_id, milestone):
    """
    milestone: ['dispatched', 'en_route', 'on_site', 'setup_ready', 'live', 'completed']
    If milestone == 'on_site', terminates tracking session and stops GPS broadcast.
    """
    pass
```

## Frontend Portal Architecture

- **Path:** `apps/portal-kit/src/pages/client/flightdeck/FlightDeck.tsx`
- **Subcomponents:**
  - `MilestoneStepper`: Horizontal animated stepper with icons and pulse animation on active state.
  - `EnRouteLiveMap`: Mapbox / Leaflet map displaying vehicle car icon moving toward venue marker, with green ETA banner ("Estimated Arrival: 1:42 PM").
  - `CrewLeadCard`: Photo, first name, and click-to-call button for the designated on-site lead.
  - `TrustCredentialsBadgeRow`: Verified COI, license, and background check trust chips.

## Multi-Tenant Isolation & Security

- Live tracking session tokens are unique, short-lived, and tied strictly to the tenant site database.
- GPS coordinates are scrubbed from cache memory 10 minutes after session termination.

## Risks & Mitigations

- **Risk:** Field crew forgets to tap "Arrived On Site", leaving tracking active.
- **Mitigation:** Automated geofence boundary: if vehicle GPS coordinates are within 200 meters of the venue address for > 3 minutes, automatically transition milestone to `on_site` and kill GPS broadcast.
