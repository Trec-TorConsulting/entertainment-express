## Why

Severe weather (high winds, lightning, rainstorms) is the primary existential threat to outdoor mobile entertainment, inflatable rentals, and open-air concerts. Commercial bounce houses turn into lethal windborne hazards when winds exceed 15–20 mph (mandated by ASTM standards), and costly audio equipment suffers catastrophic water damage in sudden downpours. Operators face intense, hostile disputes with clients over non-refundable deposits when bad weather hits. Without automated weather monitoring and clear, proactive rescheduling workflows, operators either risk catastrophic legal liability or suffer toxic chargebacks.

## What Changes

- Introduce an automated **Weather Risk Engine** in Frappe integrating with Open-Meteo and NOAA APIs to track micro-climate forecasts for all outdoor bookings at 72h, 48h, 24h, and 6h intervals.
- Enforce **Safety Threshold Rules** per vertical (e.g. Inflatables: Wind Gust > 15 mph triggers Safety Advisory, > 20 mph triggers Mandatory Inflatable Grounding; Staging/DJs: Rain Probability > 60% requires confirmed covered structure).
- Deliver an automated **Rain-Date Guarantee & Rescheduling Engine**: clients with weather-threatened events receive automated notifications offering 1-click self-service rescheduling to an available rain date without forfeit of deposit.
- Provide an **Owner Weather Flight Deck** at `/owner/weather` with interactive radar maps, weekend threat matrices, and batch weather alert messaging.
- Surface live weather status badges on client proposals, booking confirmations, and field crew run sheets.

## Capabilities

### New Capabilities
- `weather-risk-cancellation-engine`: Real-time weather telemetry polling, automated ASTM safety threshold enforcement, proactive client weather advisories, and 1-click rain-date credit voucher conversion.

### Modified Capabilities
- `booking-availability`: Bookings gain weather risk status tracking and outdoor flag indicators.
- `notifications`: Transactional weather advisory and severe weather warning templates.

## Impact

- **DocTypes**:
  - `EE Weather Threshold Rule`: Max wind speed (mph), max gust (mph), max precip probability (%), min temperature (F), linked to Item Group.
  - `EE Weather Log`: Snapshot of forecasted wind, rain, temp, lightning radius for a specific booking and timestamp.
  - `EE Rain Date Voucher`: Store credit voucher generated upon weather cancellation, valid for 12 months.
- **Server APIs**:
  - `entertainment_express.weather.api.poll_booking_weather(booking_id)`
  - `entertainment_express.weather.api.evaluate_weather_risk(booking_id)`
  - `entertainment_express.weather.api.issue_rain_date_voucher(booking_id, reason)`
- **Portal UI**:
  - Owner View: `/owner/weather` (Radar overlay, booking risk pins, batch rain-date trigger).
  - Client View: `/client/weather/:booking_id` (Live event weather radar, rain-date reschedule button).
  - Field App: Real-time wind speed alert banner on My Day screen.
