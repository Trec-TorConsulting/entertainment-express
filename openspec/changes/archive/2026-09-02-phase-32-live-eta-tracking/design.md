## Context
Field check-in GPS exists; productize for clients during delivery window.

## Goals / Non-Goals
**Goals:** Tracking session; ETA; client view; auto-stop.
**Non-Goals:** Historical stalker maps; off-duty tracking.

## Decisions
### D1 — EE Live Tracking Session
Started when assignment → en_route; stores last lat/lng, eta_minutes, share_token; ends on complete/cancel.

### D2 — Ping cadence
Field app posts location every N minutes while session active; server computes ETA via maps provider or haul minutes fallback.

### D3 — Privacy
Token expires at session end; client only; optional guest read if owner enables.

### D4 — Files
`api/tracking.py`, field hooks, tests `test_phase32_tracking.py`.

## Migration

Fixtures + patches; feature-flag rollback where applicable.
