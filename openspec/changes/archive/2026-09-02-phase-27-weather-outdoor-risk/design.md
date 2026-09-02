## Context

Outdoor rentals cancel or shift on wind/rain. Competitors leave this to contract text; EE can productize it. Venue geo and booking windows already exist.

## Goals / Non-Goals

**Goals:** Configurable thresholds; forecast job; booking weather status; rain-date offer that re-checks availability; portal + notification surfaces.

**Non-Goals:** Automatic full refunds without owner action; lightning-detection hardware; multi-day festival weather grids.

## Decisions

### D1 — EE Weather Policy (Single) + optional per-item overrides
Tenant Single **EE Weather Policy**: `enabled`, `wind_mph_max`, `precip_inch_hours`, `lightning_policy` (`warn|block`), `lead_hours`, `auto_offer_rain_date`, `refund_mode` (`manual|policy_link`). Service Item / Service Asset fields: `weather_sensitive`, optional override limits.

### D2 — Forecast cache, not inline HTTP
Scheduler enqueues `refresh_booking_weather` for confirmed outdoor jobs in the lead window. Store **EE Weather Snapshot** (booking, fetched_at, wind, precip, source, raw_json truncated). Fail open: if provider down, status `unknown`, no silent cancel.

### D3 — Rain-date is a tentative hold + client offer
`offer_rain_date(booking, candidate_start)` creates a hold via existing availability engine; client accepts on `/client`; on accept, move booking window and release original commitment. Money: no auto-refund; owner confirms credit/rebook per policy.

### D4 — Files
| Area | Path |
|------|------|
| Policy / API | `entertainment_express/api/weather.py` |
| Job | `entertainment_express/weather/jobs.py` |
| DocTypes | `weather` module |
| Portals | owner job strip, client booking detail |
| Tests | `tests/test_phase27_weather.py` |

## Risks

- **False positives cancel revenue** → default `warn` not `block` until tenant opts into hard block.
- **Provider outage** → `unknown` + staff alert, never invent cancel.
- **Isolation** → snapshots never cross sites.

## Migration

Fixtures for Weather Policy defaults; migrate tenants; no money mutation. Rollback: disable policy flag.
