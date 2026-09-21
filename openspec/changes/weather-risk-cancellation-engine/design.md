## Context

In party rentals and outdoor mobile entertainment, operators are legally and contractually obligated to protect safety. In many jurisdictions, operating an inflatable in winds exceeding 20 mph violates state law and voids liability insurance. By automating forecast telemetry and offering transparent, proactive rain-date vouchers, operators turn weather disasters into customer loyalty opportunities while eliminating dispute chargebacks.

## Goals / Non-Goals

**Goals:**
- Poll hourly weather forecasts using venue latitude/longitude coordinates via Open-Meteo API (free/open, no API key required, reliable worldwide).
- Compute composite risk score: `Clear`, `Advisory`, `Critical Risk`, `Mandatory Shutdown`.
- Automatically send SMS/Email warning to client at 48 hours and 24 hours if risk score is `Critical Risk`.
- Allow client to claim a Rain-Date voucher in `/client/weather/:booking_id` that converts their deposit into store credit for 365 days.
- Display live anemometer / wind speed checklist in field crew app during on-site inspection.

**Non-Goals:**
- Custom hardware IoT anemometer integration (field crews use hand-held anemometers and log readings manually).
- Weather insurance underwriting (we provide policy enforcement and rain-date rebooking, not insurance payout underwriting).

## Architecture & DocType Definitions

### 1. `EE Weather Threshold Rule`
- **Fields:**
  - `rule_name`: Data
  - `item_group`: Link to `Item Group` (e.g. Inflatables, Tents, Outdoor Audio)
  - `max_sustained_wind_mph`: Float (default 15.0)
  - `max_gust_mph`: Float (default 20.0)
  - `max_precip_probability`: Percent (default 60%)
  - `min_temp_f`: Float (default 40.0 for inflatable vinyl flexibility)
  - `action_on_breach`: Select (`Advisory Warning`, `Mandatory Cancellation`, `Requires Indoor Relocation`)

### 2. `EE Weather Forecast Log`
- **Fields:**
  - `booking`: Link to `Booking`
  - `poll_timestamp`: Datetime
  - `forecast_for_datetime`: Datetime
  - `temperature_f`: Float
  - `wind_speed_mph`: Float
  - `wind_gust_mph`: Float
  - `precip_probability`: Percent
  - `weather_code_text`: Data (e.g. "Scattered Thunderstorms")
  - `risk_level`: Select (`Clear`, `Watch`, `Severe Risk`)

### 3. `EE Rain Date Voucher`
- **Fields:**
  - `voucher_code`: Data (unique code)
  - `customer`: Link to `Customer`
  - `originating_booking`: Link to `Booking`
  - `voucher_amount`: Currency
  - `issue_date`: Date
  - `expiry_date`: Date (issue_date + 365 days)
  - `redeemed_booking`: Link to `Booking`
  - `status`: Select (`Active`, `Redeemed`, `Expired`)

## Server APIs & Python Hooks

File: `entertainment_express/weather/api.py`

```python
import frappe
import requests
from frappe.utils import now_datetime, add_to_date

@frappe.whitelist()
def sync_booking_weather_forecast(booking_id):
    """Fetches hourly weather from Open-Meteo for venue lat/long."""
    pass

@frappe.whitelist()
def evaluate_weekend_weather_threats():
    """Scheduled cron task evaluating all outdoor bookings in next 72 hours."""
    pass

@frappe.whitelist()
def claim_rain_date_reschedule(booking_id, new_date=None):
    """Cancels weather-compromised booking and generates EE Rain Date Voucher."""
    pass
```

## Frontend Portal Architecture

- **Path:** `apps/portal-kit/src/pages/owner/weather/WeatherFlightDeck.tsx`
- **Subcomponents:**
  - `WeatherThreatMap`: Mapbox / Leaflet map plotting outdoor event pins with real-time radar precipitation overlay.
  - `ThreatTable`: Filterable list of upcoming bookings sorted by highest wind gust or rain probability.
  - `BroadcastAlertModal`: Modal allowing 1-click SMS/Email dispatch to all threatened event clients.
- **Client Route:** `apps/portal-kit/src/pages/client/weather/WeatherGuarantee.tsx`
  - Radar widget, live forecast, safety explanation, and "Reschedule to Rain Date" button.

## Multi-Tenant Isolation & Security

- Weather logs and rain date vouchers are strictly scoped to the tenant's MariaDB site database.
- External weather API requests only pass latitude and longitude; no tenant customer data or PII is transmitted to Open-Meteo.

## Risks & Mitigations

- **Risk:** Weather forecast shifts dramatically 2 hours before an event.
- **Mitigation:** Field crew mobile app requires on-site wind reading confirmation during setup check-in before turning on blowers.
