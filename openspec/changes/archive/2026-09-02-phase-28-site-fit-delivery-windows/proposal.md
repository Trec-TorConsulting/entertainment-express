## Why

Party rental leaders and ERS/Goodshuffle win on delivery windows, site questions (space/surface/power), attended vs drop-off staffing, and weight-aware truck loads. EE has venue notes and packing lists but not first-class site-fit gates, delivery windows, fulfillment modes, or load weight checks.

## What Changes

- First-class **fulfillment mode** on service items: attended | drop_off | self_serve.
- **Site-fit requirements** (min area, surface types, power circuits, clearance height) validated at quote/book against venue/booking answers.
- **Delivery and pickup windows** on bookings with dispatch board support.
- **Weight-aware load planning**: asset/kit weights vs vehicle capacity; warn on overweight loads.
- Non-goals: full TMS; last-mile carrier APIs.

## Capabilities

### New Capabilities

- `site-fit-logistics`: Site suitability (space, surface, power, clearance), delivery/pickup windows, attended vs drop-off modes, weight-aware vehicle loads.

### Modified Capabilities

- `service-catalog`: Fulfillment mode and site-fit requirement fields on items/packages.
- `venue-management`: Structured surface/power/clearance fields used by site-fit checks.
- `booking-availability`: Collect site answers; block or flag unfit sites per policy.
- `scheduling-dispatch`: Delivery/pickup windows on board; load weight warnings.
- `equipment-inventory-fleet`: Weight on assets; vehicle capacity; load check API.
- `owner-portal`: Site-fit and delivery window editing without Desk.
- `employee-portal`: Dispatch/field see windows, mode, and load warnings.
- `customer-portal`: Client answers site-fit questions when required.

## Impact

- Custom Frappe DocTypes/APIs in `entertainment_express`; portal SPA updates; migrate per tenant site.
- Depends on prior roadmap phases for bookings, portals, fleet, and notifications as applicable.
- Multi-tenant isolation tests required; no cross-site data.
