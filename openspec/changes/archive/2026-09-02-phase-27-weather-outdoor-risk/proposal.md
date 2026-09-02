## Why

Inflatable and outdoor entertainment operators (Inflatable Party Magic, Jump Around, Fantasy World, Party Pros) sell explicit weather, wind, and rain-date policies. EE has generic cancellation settings but no forecast-driven risk alerts, wind thresholds tied to assets, or rain-date reschedule flow — so tenants still manage outdoor risk in email and tribal knowledge.

## What Changes

- Add a **weather / outdoor risk** capability: tenant policy thresholds (wind, precip, lightning, heat), rain-date / weather-reschedule rules, and booking risk status.
- Pull forecasts for outdoor/weather-sensitive bookings and alert owner/employee/client on existing notification channels.
- Block or warn on confirm/dispatch when thresholds are exceeded per tenant policy.
- Surface risk strip on owner job view and client booking detail.
- **Explicit non-goals:** insurance carrier claims filing; owning a weather company; PBX.

## Capabilities

### New Capabilities

- `weather-outdoor-risk`: Forecast checks, thresholds per service/asset tag, rain-date/reschedule, booking weather status, alerts.

### Modified Capabilities

- `booking-availability`: Weather-sensitive booking flags and rain-date hold/reschedule without double-booking assets.
- `service-catalog`: Mark service items/assets as outdoor / weather-sensitive with optional wind/precip limits.
- `notifications`: Weather watch / warning / rain-date offer templates on existing channels.
- `owner-portal`: Job risk strip includes weather status; policy settings without Desk.
- `customer-portal`: Client sees weather status and can accept rain-date offer when enabled.
- `scheduling-dispatch`: Dispatch board flags weather-blocked jobs; crew run sheet shows outdoor risk note.

## Impact

- New DocTypes / APIs under `entertainment_express` (weather policy, forecast cache, rain-date offers).
- Background job for forecast refresh; pluggable weather provider (Open-Meteo or Maps provider; tenant credentials optional).
- Depends on: phase-1 bookings, phase-6 notifications, phase-17 venues (geo), phase-25 portals.
- Isolation: forecast and alerts scoped to this tenant site only.
