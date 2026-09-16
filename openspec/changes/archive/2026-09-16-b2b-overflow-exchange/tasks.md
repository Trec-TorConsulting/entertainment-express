# Tasks: B2B Overflow & Sub-Rental Gear Exchange

- [x] 1. DocTypes & Isolation Architecture
  - [x] 1.1 Create `EE Exchange Listing` DocType schema in `entertainment_express/doctype/ee_exchange_listing/`
  - [x] 1.2 Create `EE Exchange Transaction` DocType schema in `entertainment_express/doctype/ee_exchange_transaction/`
  - [x] 1.3 Add tenant isolation test in `entertainment_express/tests/test_exchange_isolation.py` ensuring no cross-tenant database reads

- [x] 2. Control Plane Integration Client
  - [x] 2.1 Implement `entertainment_express/exchange/client.py` for HMAC-signed communication with `admin.{base_domain}`
  - [x] 2.2 Implement payload anonymization sanitizing client names and exact addresses prior to acceptance
  - [x] 2.3 Implement webhook receiver for listing state changes (`accepted`, `fulfilled`, `cancelled`)

- [x] 3. Compliance & White-Label Packet Engine
  - [x] 3.1 Implement automated COI verification check in `entertainment_express/exchange/compliance.py`
  - [x] 3.2 Implement tokenized white-label gig packet generator creating branded run sheets for fulfilling partners
  - [x] 3.3 Add non-solicitation agreement acceptance gate upon claiming network jobs

- [x] 4. Escrow Accounting & Settlement
  - [x] 4.1 Implement `entertainment_express/exchange/escrow.py` creating ERPNext `Purchase Invoice` on completion
  - [x] 4.2 Hook escrow settlement into `cost_engine.py` subcontractor line items
  - [x] 4.3 Add dispute handling workflow for damaged gear or service non-performance

- [x] 5. Owner Portal Marketplace UI
  - [x] 5.1 Create `/owner/exchange` page and layout in `frontend/owner-portal/src/app/routes/exchange/ExchangePage.tsx`
  - [x] 5.2 Implement `ExchangeListingCard.tsx` with payout details, date, required assets, and "Claim Gig" CTA
  - [x] 5.3 Implement `PostListingModal.tsx` allowing 1-click broadcast of overbooked jobs from `/owner/calendar`
  - [x] 5.4 Verify frontend portal build with `npm run build`
