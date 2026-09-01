## Context

Phase 25 delivered chrome + collaboration + canned reports. Quotes, contracts, Stripe checkout, planning forms, timeline, and music APIs already exist from phases 1/5/15. They are not wired into `/owner` and `/client` as one Proposal/Pay/Documents/Planning loop. Guests must stay non-payers.

## Goals / Non-Goals

**Goals:**
- Owner and client can complete a booking money path without `/app`.
- Client Pay lists own invoices and opens Stripe Checkout; Documents lists/signs own contracts.
- Clone job, public catalog/wishlist, warehouse-only pull sheets, event-type checklists, quote vs plan conflicts.
- Money remains backend-formatted strings. Isolation tests on every payer API.

**Non-Goals:**
- Ticketing, CEU credits, vendor marketplace, AI pitch decks.
- GL / chart of accounts in portals.
- Replacing Expo crew app.
- New payment processors (Stripe stays primary).

## Decisions

### D1 — Client payer APIs (`portal_client`)
Whitelist methods on `entertainment_express.api.portal_client`: `list_invoices`, `start_checkout`, `list_contracts`, `get_contract`, `sign_contract`. `_require_payer()` denies `EE Event Guest` unless they also have `EE Customer`. Checkout calls existing `payments_stripe.create_checkout` after proving the invoice’s Customer matches the session user’s `email_id`.

**Alt:** reuse `frappe.client.get_list` in the SPA. **Rejected** — leaks DocTypes and cannot format money or enforce guest deny in one place.

### D2 — Session sign vs email token
Keep guest-token `sign_contract` / `view_contract` for email links. Add `view_my_contract` / `sign_my_contract` for logged-in payers (session = signer email or booking customer). Token path unchanged.

### D3 — Proposal is a wizard over existing DocTypes
Owner `/owner/pipeline/:id/proposal` and client `/client/events?booking=` “Review proposal”:
1. Packages/add-ons from catalog (Items with `ee_item_type`).
2. Create/update ERPNext Quotation (existing `api/quote.py`).
3. Create/send `EE Contract` (existing `api/contract.py`).
4. Deposit invoice + Stripe checkout.

No new DocType for “Proposal”. Status copy: Draft → Sent → Signed → Deposit paid.

### D4 — Clone job
`portal_crud` or booking API: copy Event Booking to a new date, strip assignments/holds, re-run availability. Fail closed on conflict.

### D5 — Public catalog / wishlist
Tenant public site lists active catalog items. Logged-in `EE Customer` can wishlist (reuse Lead notes or a small child table on Customer — prefer a **Wishlist Item** child on Customer if no existing table; otherwise Comment with a typed prefix is **not** acceptable). Isolation: catalog is tenant-scoped by site.

### D6 — Pull sheets
Employee/dispatch pull sheet filters lines to warehouse/stock items (`is_stock_item` or `ee_item_type=rental`) — no service-only rows.

### D7 — Checklists
`EE Portal Settings.feature_flags` or Event Booking `event_type` maps to a JSON checklist of steps (booked → contract → deposit → planning → dispatch). Data-driven keys, not vertical names in code.

## Risks / Trade-offs

- **[Customer checkout on wrong invoice]** → Mitigation: server compares `Sales Invoice.customer` to session Customer; guests 403.
- **[Stripe unconfigured]** → Mitigation: Pay shows a clear “Ask your coordinator” error, no crash.
- **[Proposal scope]** → Mitigation: tasks ordered Pay/Documents first (already started), then Proposal wizard, then clone/catalog/pull sheets.

## Migration Plan

- No data migration for Pay/Documents.
- Wishlist child table: Frappe patch if a new child DocType is required.
- SPA rebuild + image tag.

## Open Questions

- Wishlist persistence: Customer child table vs new `EE Wishlist` DocType — **prefer child on Customer** unless ERPNext already has a list we can reuse.
- Whether unsigned `draft` contracts are visible to the client: **yes, if they are the signer**, so Documents is never an empty state after owner sends a proposal.
