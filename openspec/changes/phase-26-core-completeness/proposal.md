## Why

Phase 25 shipped owner / employee / client *shells*. A tenant still cannot run the money-making loop without Desk: send a visual proposal, have the client sign and pay, complete planning, see quote-level gear conflicts, clone a job, or show a public catalog. Adjacent products (HoneyBook, Goodshuffle Pro, eventplanner.net checklists) win on those loops. Conference features from Eventsquid (ticketing, CEU, exhibitors) are out of scope.

## What Changes

- Close the **revenue loop in the portals**: owner sends an interactive proposal (packages + price + contract + deposit); client reviews, optionally adjusts allowed add-ons, e-signs, and pays without leaving `/client`.
- Replace `/client` Pay / Documents / Planning **empty states** with working screens over existing billing, e-sign, planning-form, timeline, and music APIs. Home next action is Sign or Pay when either is outstanding.
- Make **event-type workflow checklists** usable: templates with due dates offset from the event; owner Today / Reminders show open tasks; auto-apply on booking by event type.
- **Potential conflicts** on unsigned quotes (and holds), not only confirmed bookings — warn, do not silently block sending a quote.
- **Clone job** and save-as-template (packages, timeline, checklist, planning form, hidden warehouse lines).
- **Public catalog / wishlist** on the tenant site: browse packages with images, request a quote or book; branding beyond name + color.
- **Client-visible vs warehouse-only** quote lines (cables, spare parts stay on pull sheets).
- Wire `/owner/automations` to existing notification settings (deposit chase, planning-form reminders, unsigned-proposal follow-up).
- **Explicit non-goals:** attendee ticketing, CEU/speakers/exhibitors, virtual event hub, public vendor marketplace, AI concept→deck (phase 11), appointments/venues/COI/vendor network (phases 16–17), marketing campaigns (phase 8), calendar two-way sync (phase 13).

## Capabilities

### New Capabilities

- (none) — all behavior extends existing specs. No marketplace, no ticketing product.

### Modified Capabilities

- `crm`: Interactive Proposals must be sendable from `/owner` and completable by the client; proposal view tracking; Tasks & Workflow Templates auto-apply and appear in owner Reminders.
- `customer-portal`: Pay, Documents (sign), and Planning are functional; proposal accept flow; guests still cannot pay or sign.
- `owner-portal`: Send proposal, clone job, conflict warnings, checklist inbox, catalog images; Automations is not an empty state.
- `employee-portal`: Sales can send/view proposals; dispatch/field see checklist + hidden packing lines, not client-only copy.
- `booking-availability`: Potential (quote/hold) vs actual (confirmed) conflicts; public catalog/wishlist on the tenant booking site.
- `service-catalog`: Packages expose public vs warehouse-only lines; images for storefront and proposals.
- `equipment-inventory-fleet`: Pull sheets include warehouse-only lines that quotes hide.
- `event-planning-forms`: Client completes forms on `/client/planning`; owner sees completion on the job.
- `event-timeline`: Client and assigned crew edit/view timeline in portals (existing finalize rules).
- `music-planning`: Client/guest song lists on `/client/planning`; crew play view unchanged.
- `event-collaboration`: Planning hub includes forms/timeline/music, not only suggest/vote.
- `billing-payments`: Deposit capture from the proposal and `/client/pay` uses existing processors; guests 403.
- `notifications`: Proposal viewed, unsigned follow-up, checklist due, planning-form reminder — existing channels.
- `identity-access`: Proposal accept and pay remain `EE Customer` on that booking’s customer; guests denied.

## Impact

- Frontends: `frontend/owner-portal`, `frontend/employee-portal`, `frontend/customer-portal`, `frontend/portal-kit`; rebuild `public/{owner,employee,client}/`. Tenant public home / booking pages under `entertainment_express/www/`.
- Backend: `entertainment_express/api/` (proposal, checklist, conflict, clone, storefront, client pay/sign/planning); reuse ERPNext Quotation / Sales Invoice / Payment Entry; no new money math.
- DocTypes: proposal view log, workflow template (+ child tasks), clone/template flag on booking or a small `EE Job Template`; catalog `client_visible` on package/item child; no new tenant databases.
- Tests: tenant isolation; guest cannot pay/sign; quote conflict is warning not silent overbook of confirmed assets; clone does not copy payments.
- Cluster: bench image bump after SPA + API land; `bench migrate` on tenant sites.
- Depends on: phase-1 quotes/contracts/deposits, phase-5 payments, phase-15 planning/timeline/music, phase-25 portal OS.
- Does not: Desk replacement for SaaS operator; GL; Eventsquid-style registration.
