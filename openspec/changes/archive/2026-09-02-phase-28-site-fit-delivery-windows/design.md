## Context
Operators ask space/surface/power before quoting inflatables; ERS/Goodshuffle schedule delivery windows and truck loads. EE venue free-text is not enough.

## Goals / Non-Goals
**Goals:** Structured site-fit; fulfillment modes; delivery/pickup windows; weight vs capacity warnings.
**Non-Goals:** Carrier tracking APIs (phase-32 ETA); weather (phase-27); full WMS rebuild.

## Decisions
### D1 — Fulfillment mode on Service Item
`fulfillment_mode`: attended|drop_off|self_serve. Attended requires crew roles; drop_off may skip attendant; self_serve implies client operates with waiver (phase-29).

### D2 — EE Site Fit Profile
Child table on Service Item / Package: `min_sq_ft`, `surfaces` (lawn|concrete|asphalt|indoor), `power_amps`, `clearance_ft`, `water_required`. Booking collects answers; `evaluate_site_fit` returns ok|warn|block.

### D3 — Delivery windows
Booking fields `delivery_window_start/end`, `pickup_window_start/end`. Dispatch board filters by window. Availability buffers already cover setup; windows are logistics overlays.

### D4 — Weight-aware loads
Asset `shipping_weight_lb`; Vehicle `max_payload_lb`. Packing list / assignment API sums weights; warn if over capacity (default warn, optional block).

### D5 — Files
`api/site_fit.py`, `api/load_plan.py`; portals; tests `test_phase28_site_fit.py`.

## Migration

Fixtures + patches; rollback by feature flag / unused fields.
