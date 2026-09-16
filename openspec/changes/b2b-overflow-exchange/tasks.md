# Tasks: B2B Overflow & Sub-Rental Gear Exchange

- [ ] 1. DocTypes & Isolation Architecture
  - [ ] 1.1 Create `EE Exchange Listing` DocType schema in `entertainment_express/doctype/ee_exchange_listing/`
  - [ ] 1.2 Create `EE Exchange Transaction` DocType schema in `entertainment_express/doctype/ee_exchange_transaction/`
  - [ ] 1.3 Add tenant isolation test in `entertainment_express/tests/test_exchange_isolation.py` ensuring no cross-tenant database reads

- [ ] 2. Control Plane Integration Client
  - [ ] 2.1 Implement `entertainment_express/exchange/client.py` for HMAC-signed communication with `admin.{base_domain}`
  - [ ] 2.2 Implement payload anonymization sanitizing client names and exact addresses prior to acceptance
  - [ ] 2.3 Implement webhook receiver for listing state changes (`accepted`, `fulfilled`, `cancelled`)

- [ ] 3. Compliance & White-Label Packet Engine
  - [ ] 3.1 Implement automated COI verification check in `entertainment_express/exchange/compliance.py`
  - [ ] 3.2 Implement tokenized white-label gig packet generator creating branded run sheets for fulfilling partners
  - [ ] 3.3 Add non-solicitation agreement acceptance gate upon claiming network jobs

- [ ] 4. Escrow Accounting & Settlement
  - [ ] 4.1 Implement `entertainment_express/exchange/escrow.py` creating ERPNext `Purchase Invoice` on completion
  - [ ] 4.2 Hook escrow settlement into `cost_engine.py` subcontractor line items
  - [ ] 4.3 Add dispute handling workflow for damaged gear or service non-performance

- [ ] 5. Owner Portal Marketplace UI
  - [ ] 5.1 Create `/owner/exchange` page and layout in `frontend/owner-portal/src/app/routes/exchange/ExchangePage.tsx`
  - [ ] 5.2 Implement `ExchangeListingCard.tsx` with payout details, date, required assets, and "Claim Gig" CTA
  - [ ] 5.3 Implement `PostListingModal.tsx` allowing 1-click broadcast of overbooked jobs from `/owner/calendar`
  - [ ] 5.4 Verify frontend portal build with `npm run build`
