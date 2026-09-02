## Why

Parity alone is not enough. EE already combines ERPNext depth, multi-tenant SaaS, AI, and experience OS in ways rivals do not. This phase productizes eight differentiators that make EE category-defining versus IO/ERS/Goodshuffle/HoneyBook/DJI.

## What Changes

- Event Day Copilot (AI grounded in timeline/music/venue).
- Demand heatmap + dynamic package nudges.
- Trusted partner overflow exchange between EE tenants (audited, opt-in).
- Client Live Event Page (QR) for guests.
- Ops Score / reliability badge on booking site (optional).
- PaaS developer surface: public REST catalog, webhooks, embed SDK docs.
- Vertical starter kits (DJ, Inflatable, Booth, Game Truck, Casino).
- After-action revenue loop: highlight reel + review + rebook.
- Non-goals: public anonymous marketplace; ticketing/CEU.

## Capabilities

### New Capabilities

- `category-differentiators`: Event Day Copilot, demand heatmap nudges, partner overflow exchange, live event page, ops reliability badge, PaaS embed SDK docs, vertical starter kits, after-action revenue loop.

### Modified Capabilities

- `ai-assistant`: Event Day Copilot + demand nudges; confirm-before-send preserved.
- `service-catalog`: Starter kits seed catalog/forms.
- `vendor-network`: Opt-in overflow exchange across tenants via control-plane mediated handoff.
- `event-collaboration`: Live Event Page for guests.
- `marketing-engagement`: After-action loop with review + rebook.
- `reporting-bi`: Ops score inputs.
- `booking-availability`: Optional public reliability badge.
- `saas-control-plane`: PaaS API docs hosting + overflow mediation records.
- `owner-portal`: Surfaces for kits, badge, copilot, overflow.
- `media-delivery`: Highlight reel uses published gallery when present.

## Impact

- Custom Frappe DocTypes/APIs in `entertainment_express`; portal SPA updates; migrate per tenant site.
- Multi-tenant isolation tests required; no cross-site data.
- Depends on earlier competitive-gap phases where noted in ROADMAP.
