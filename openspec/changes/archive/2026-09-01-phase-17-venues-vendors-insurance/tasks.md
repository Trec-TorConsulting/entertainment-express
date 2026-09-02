# Tasks: Phase 17 — Venues, Vendors & Insurance

> Reusable places, partner network, COI/waivers, and damage holds. No maps OAuth. No external insurance carrier. Money via `flt` + backend strings.

## 1. Schema

- [x] 1.1 DocType `EE Venue` + child `EE Venue Contact`; Event Booking Link `venue` plus snapshot logistics fields (`load_in_notes`, `parking_notes`, `power_notes`, `noise_curfew`).
      **Accept:** migrate on a tenant site; picking a venue copies address/geo/notes onto the job.
- [x] 1.2 DocTypes `EE Vendor` + `EE Vendor Contact`, `EE Referral`, `EE Vendor Assignment`.
      **Accept:** referral commission and agreed_cost are Currency; no Supplier required.
- [x] 1.3 DocTypes `EE Insurance Policy`, `EE Certificate of Insurance`, `EE Waiver Template`, `EE Waiver`; booking fields `ee_damage_hold_invoice`, `ee_damage_hold_status`, `ee_event_insurance`, `ee_event_insurance_amount`.
      **Accept:** migrate; waiver has signer audit fields; hold status has no SPA math.

## 2. APIs

- [x] 2.1 `api/venues.py`: staff CRUD, list, get, attach to booking (snapshot copy). Isolation: this site only.
      **Accept:** other tenant names never queried; guest 403.
- [x] 2.2 `api/vendors.py`: staff CRUD vendors, referrals, assignments; list for a booking.
      **Accept:** guest 403; commission/cost returned as formatted strings.
- [x] 2.3 `api/compliance.py`: policies, COI attach/status, waiver list/sign, wrap `create_damage_hold` / capture / release, event-insurance flag. Daily expiry/COI/waiver reminders.
      **Accept:** guest 403 on sign and holds; missing Twilio does not raise; amounts are strings.

## 3. Portals

- [x] 3.1 `/owner/places`, `/owner/partners`, `/owner/coverage`; job view venue pick, vendors, COI, waiver, hold.
      **Accept:** not EmptyState; no `/app`; no DocType names in copy.
- [x] 3.2 Employee run sheet / field job shows venue logistics + other vendors.
      **Accept:** unassigned crew does not see other jobs’ vendors.
- [x] 3.3 `/client/documents` lists pending waivers; payer signs; guests 403.
      **Accept:** pytest; signed waiver has timestamp.

## 4. Ship

- [x] 4.1 `tests/test_phase17_venues_vendors.py`: isolation, guest 403, hold money strings, venue snapshot.
      **Accept:** pytest on tenant site.
- [x] 4.2 Rebuild `public/{owner,employee,client}/`; bump bench image `0.0.61-ee` → `0.0.62-ee`; migrate tenant sites.
      **Accept:** Places and a COI-flagged job load for the right roles.
