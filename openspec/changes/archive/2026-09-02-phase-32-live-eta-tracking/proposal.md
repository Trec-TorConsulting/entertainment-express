## Why

Clients expect Uber-like ETAs on delivery day. Goodshuffle dispatch and ERS driver apps move this direction; EE has crew GPS check-in but no client-facing live ETA product.

## What Changes

- Live tracking session from en-route status with ETA computation.
- Client portal + optional SMS link for map/ETA.
- Privacy: share only while en-route/on-site; stop after complete.
- Non-goals: continuous background tracking of off-duty crew; consumer ride-hail.

## Capabilities

### New Capabilities

- `live-tracking`: Share live crew/vehicle ETA and delivery progress with clients from field GPS and dispatch status.

### Modified Capabilities

- `scheduling-dispatch`: Tracking session tied to assignment status transitions.
- `mobile-field-app`: Opt-in location pings while en-route.
- `customer-portal`: Live ETA view for the paying customer.
- `notifications`: En-route and arriving messages with tracking link.
- `identity-access`: Tracking tokens scoped; guests read-only if invited.
- `integrations`: Maps provider for ETA minutes.

## Impact

- Custom Frappe DocTypes/APIs in `entertainment_express`; portal SPA updates; migrate per tenant site.
- Multi-tenant isolation tests required; no cross-site data.
- Depends on earlier competitive-gap phases where noted in ROADMAP.
