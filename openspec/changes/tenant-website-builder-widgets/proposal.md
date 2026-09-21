## Why

Independent mobile entertainment and party rental operators frequently struggle with website management. Most are locked into rigid, dated WordPress themes or forced to maintain separate subscriptions to external website builders (Wix, Squarespace, Webflow) that fail to synchronize in real time with their availability and equipment catalog. When bookings occur, operators must manually update availability or risk booking collisions. Operators need a native, drag-and-drop Visual Website Builder hosted directly on their Frappe tenant domain, paired with embeddable vanilla JS widgets that allow them to drop live availability checkers, interactive catalog wishlists, and booking flows into any external website.

## What Changes

- Implement a **No-Code Visual Website Builder** in the Owner Portal (`/owner/website`) with modular page blocks (Hero, Services, Availability Checker, Reviews, Pricing Tiers, FAQ, Lead Form).
- Deliver dynamic server-side rendering for public tenant pages under `/p/<route>` (e.g. `/p/bounce-houses`, `/p/weddings`) with automated SEO meta tags, OpenGraph images, and responsive mobile layouts.
- Provide a lightweight, zero-dependency embeddable JavaScript widget runtime (`entx-widgets.js`) that renders:
  1. **Availability Checker Widget**: Date & time slot picker showing real-time gear/crew open slots.
  2. **Catalog & Wishlist Widget**: Interactive package explorer allowing guests to build an equipment wishlist and request a quote.
  3. **Instant Book Widget**: End-to-end checkout embedding contract and deposit payments.
- Add an **EE Embed Key & Domain Whitelist** security model so operators can restrict widget embedding to their verified external domains with rate limiting against automated scraping.

## Capabilities

### New Capabilities
- `tenant-website-builder-widgets`: Visual no-code CMS page builder for tenant websites, public route publishing (`/p/*`), and embeddable JavaScript booking/catalog widgets with domain security.

### Modified Capabilities
- `tenant-website`: Upgrades the basic template engine to a block-based modular page builder.
- `service-catalog`: Exposes read-only public catalog endpoints secured by embed API keys.

## Impact

- **DocTypes**:
  - `EE Tenant Page`: CMS document storing slug, title, block JSON schema, SEO metadata, published status.
  - `EE Tenant Page Block`: Child table of reusable block definitions.
  - `EE Embed Key`: API key, secret, domain whitelist, rate limits, active status.
- **Server APIs**:
  - `entertainment_express.tenant_website.api.get_public_page(slug)`
  - `entertainment_express.tenant_website.api.save_page_blocks(slug, blocks_json)`
  - `entertainment_express.tenant_website.api.get_widget_catalog(embed_key)`
  - `entertainment_express.tenant_website.api.check_widget_availability(embed_key, date, category)`
- **Portal UI**:
  - New Route: `/owner/website` (Visual block editor, page manager, theme customizer, embed snippet generator).
- **Public Assets**:
  - `public/js/entx-widgets.js` (Standalone, zero-dependency web component runtime).
