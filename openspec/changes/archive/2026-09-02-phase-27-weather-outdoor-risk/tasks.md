# Tasks: Phase 27 — Weather & Outdoor Risk

## 1. Schema

- [x] 1.1 DocTypes `EE Weather Policy` (Single), `EE Weather Snapshot`; custom fields `weather_sensitive` + optional overrides on Service Item / Service Asset; booking `weather_status`.
      **Accept:** migrate on a tenant site; other sites unchanged.
- [x] 1.2 Module registered; fixtures for default policy (warn, not block).

## 2. Forecast engine

- [x] 2.1 `api/weather.py` + provider adapter; cache snapshots; fail to `unknown`.
      **Accept:** pytest with mocked provider; isolation across sites.
- [x] 2.2 Scheduler job refreshes confirmed weather-sensitive bookings in lead window.
      **Accept:** idempotent re-run; no cancel without policy block + staff path.

## 3. Rain date

- [x] 3.1 `offer_rain_date` / `accept_rain_date` using holds + availability.
      **Accept:** conflict rejects; accept moves window; guest 403.

## 4. Portals & notifications

- [x] 4.1 Owner policy settings + job weather strip; client status + accept.
- [x] 4.2 Notification templates; no crash without Twilio.
- [x] 4.3 Dispatch board flag + run sheet note.

## 5. Tests & DoD

- [x] 5.1 Isolation + unknown-provider + rain-date conflict tests.
- [x] 5.2 Spec requirements demonstrably covered; no cross-tenant leak.
