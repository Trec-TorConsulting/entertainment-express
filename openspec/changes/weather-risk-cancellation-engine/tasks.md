## 1. DocType Schemas & Safety Rules

- [x] 1.1 Create `EE Weather Threshold Rule` DocType linked to Item Group with wind and precipitation limit fields.
- [x] 1.2 Create `EE Weather Forecast Log` DocType to snapshot API weather observations.
- [x] 1.3 Create `EE Rain Date Voucher` DocType to track store credit rebooking credits.

## 2. Weather Telemetry & Scheduler Jobs

- [x] 2.1 Implement Open-Meteo API integration in `entertainment_express.weather.api.sync_booking_weather_forecast`.
- [x] 2.2 Implement scheduled cron task evaluating outdoor events at 72h, 48h, 24h intervals.
- [x] 2.3 Implement automated SMS/Email advisory triggers when wind or rain exceeds threshold rules.
- [x] 2.4 Implement `claim_rain_date_reschedule` creating store credit vouchers.

## 3. Portal UI & Weather Cockpit

- [x] 3.1 Build `WeatherFlightDeck.tsx` in `/owner/weather` with interactive weather map and risk ranking.
- [x] 3.2 Build `BroadcastAlertModal.tsx` for 1-click batch client notification.
- [x] 3.3 Build `WeatherGuarantee.tsx` in `/client/weather/:booking_id` allowing self-service rain-date rescheduling.
- [x] 3.4 Add wind safety checklist to `/employee/field` setup workflow.

## 4. Verification & Testing

- [x] 4.1 Write automated tests `test_weather_risk.py` verifying wind threshold triggers, rain date voucher generation, and weather telemetry parsing.
