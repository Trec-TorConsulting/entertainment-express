## Why

Phase 25 shipped one product family with three skins, but owners and clients still hit empty states on the money path: no interactive Proposal (packages + contract + deposit), Pay/Documents/Planning that are not lists-or-nothing, and no clone-job / catalog-wishlist / pull-sheet completeness. The shells exist; the revenue and planning loops are not yet runnable without Desk.

## What Changes

- **Proposal workspace** in `/owner` and `/client`: pick packages/add-ons, generate quote + contract, collect deposit — one flow, no Desk.
- **Working Pay, Documents, Planning** in `/client` (not empty states): list own invoices and pay via Stripe checkout; review/sign contracts as the logged-in payer; planning forms/timeline/music already behind APIs, surfaced in the SPA.
- **Event-type workflow checklists** so a DJ vs bounce-house job shows the right next steps (data-driven, not hard-coded verticals).
- **Quote conflict flags**: potential vs actual (requested add-ons vs billed lines).
- **Clone job** from an existing booking (new date, same package/gear pattern).
- **Public catalog + wishlist** on the tenant booking site (guest browse, customer save).
- **Warehouse-only lines on pull sheets** so field crew see pack-from-warehouse items only.
- Explicitly **not**: Eventsquid ticketing/CEU, eventplanner.net marketplace, or EventPlanner.ai decks.

## Capabilities

### New Capabilities
None. This phase completes existing loops.

### Modified Capabilities
- `crm`: interactive Proposal (quote + contract + deposit) from owner and client, not Desk-only.
- `customer-portal`: Pay, Documents, and Planning are functional; home next-action is Sign then Pay.
- `owner-portal`: Proposal + clone job from Calendar/Pipeline; catalog drives quotes.
- `employee-portal`: pull sheets show warehouse-only lines; sales can open Proposal for their pipeline.
- `booking-availability`: clone job respects availability/conflicts.
- `service-catalog`: public catalog + wishlist.
- `equipment-inventory-fleet`: warehouse-only pull-sheet lines.
- `event-planning-forms`: planning hub uses real forms, not an idea-only list.
- `event-timeline`: client/owner can view/edit run-of-show in portal.
- `music-planning`: client/guest music requests in Planning.
- `event-collaboration`: approved plan items can become quote lines (conflict flag if they do not).
- `billing-payments`: paying customer may start Stripe checkout on **their** invoices; guests 403.
- `notifications`: proposal sent, contract to sign, payment receipt (existing templates).
- `identity-access`: guests remain non-payers on checkout and sign APIs.

## Impact

- Frontends: `frontend/owner-portal`, `frontend/customer-portal`, `frontend/employee-portal`, `frontend/portal-kit`; rebuild `public/{owner,employee,client}/`.
- Backend: `api/portal_client.py` (new), `api/payments_stripe.py` (customer-owned checkout), `api/contract.py` (session sign/view), `api/portal_crud.py` (owner records), quote/booking APIs for Proposal and clone.
- Tests: guest denied pay/sign; customer A cannot pay customer B’s invoice; money strings only.
- Cluster: bench image bump after SPA + API land.
