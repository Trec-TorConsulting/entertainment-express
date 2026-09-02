## Why

Groups like The Fun Group Miami operate many brands (bounce, game trailer, laser tag) under one company. EE assumes a single brand skin per tenant, forcing fake multi-site setups or messy catalogs.

## What Changes

- EE Brand records: logo, colors, domain/path, from-email.
- Catalog packages and booking site theming scoped to a brand.
- Quotes/bookings carry brand for client-facing assets.
- Non-goals: separate databases per brand; cross-tenant brand share.

## Capabilities

### New Capabilities

- `multi-brand`: Multiple brands/DBAs under one tenant site with brand-scoped catalog, booking site, and notifications.

### Modified Capabilities

- `service-catalog`: Optional brand link on packages/items.
- `booking-availability`: Public site resolves brand by host/path.
- `customer-portal`: Client sees brand-appropriate chrome for their bookings.
- `owner-portal`: Brand CRUD and assignment without Desk.
- `notifications`: From-name/email per brand when configured.
- `platform-multitenancy`: Still one site/DB per company tenant; brands are logical.
- `ui-design-system`: Brand tokens override portal kit where set.

## Impact

- Custom Frappe DocTypes/APIs in `entertainment_express`; portal SPA updates; migrate per tenant site.
- Multi-tenant isolation tests required; no cross-site data.
- Depends on earlier competitive-gap phases where noted in ROADMAP.
