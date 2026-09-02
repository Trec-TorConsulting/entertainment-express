## Why

Inflatable Office, Bouncy Castle Network, ERS, and DJ Intelligence sell turnkey websites and embeddable booking tools. EE has a public booking site and SaaS marketing site, but tenants cannot build multi-page marketing sites or drop widgets onto their existing WordPress/Squarespace sites.

## What Changes

- Tenant **website pages** CMS (Home, About, Services, Gallery, Contact) on the tenant public host.
- **Embed SDK / widgets**: availability checker, catalog, wishlist, book CTA, review badge placeholder.
- CORS + public API tokens for embeds; rate limits.
- Non-goals: full WordPress hosting; EE SaaS www rewrite; PBX.

## Capabilities

### New Capabilities

- `tenant-website`: Tenant-branded marketing pages plus embeddable availability, catalog, wishlist, and booking widgets for external sites.

### Modified Capabilities

- `booking-availability`: Public widget endpoints for availability and catalog.
- `service-catalog`: Published packages exposed to embed catalog.
- `marketing-engagement`: Optional review badge data for widgets.
- `owner-portal`: Website pages and embed snippet manager without Desk.
- `identity-access`: Public embed APIs site-scoped and rate-limited.
- `platform-multitenancy`: Widget traffic remains on tenant site hostname.

## Impact

- Custom Frappe DocTypes/APIs in `entertainment_express`; portal SPA updates; migrate per tenant site.
- Depends on prior roadmap phases for bookings, portals, fleet, and notifications as applicable.
- Multi-tenant isolation tests required; no cross-site data.
