## Why

Jobs still store a one-off address string. Crew re-ask load-in, parking, and power every time, venues that require a certificate of insurance are not flagged, and partner photographers or overflow DJs live in notes. HoneyBook / DJ Event Planner win on repeat venues, referrals, and waivers. Phase 16 closed consults; this phase closes day-of logistics and risk without Desk.

## What Changes

- Add a reusable **Venue** record (address, geo, contacts, load-in / parking / power / curfew, COI required). Booking a known place copies logistics onto the job and run sheet.
- Add a **Vendor / partner** directory (category, contacts, preferred, W-9 / COI on file) plus referrals (sent/received) and overflow assignments with agreed cost.
- Track the tenant’s **insurance policies** (expiry alerts), per-job **COI** (requested → delivered), client **liability waivers** (e-sign with audit), and **damage holds** using existing Stripe preauth (`create_damage_hold` / capture / release) with status on the job.
- Owner CRUD on `/owner` (Places, Partners, Coverage). Employee run sheet shows venue logistics and other vendors. Client signs waivers on `/client/documents`. Event guests stay off money and sign-as-payer.
- **Override:** baseline `insurance-compliance` per-event insurance via an external carrier (insure.events) is **out of this phase**. v1 records opt-in + a backend-formatted amount on the booking. No new insurance-provider OAuth.
- **Explicit non-goals:** Google Maps routing (phase 13), full GL for vendor payables, marketplace vendor network, Eventsquid ticketing, phase 18 CSV import of venues.

## Capabilities

### New Capabilities

- (none) — `venue-management`, `vendor-network`, and `insurance-compliance` already exist in baseline specs.

### Modified Capabilities

- `venue-management`: Portal CRUD; booking link auto-fills logistics; COI flag on the job; venue history.
- `vendor-network`: Portal directory, referrals, overflow assignment, event vendor list for crew.
- `insurance-compliance`: Policy expiry, COI file/status, client waivers, damage-hold status wrapping existing billing preauth. Per-event carrier checkout deferred (see override).
- `owner-portal`: Places, Partners, and Coverage without `/app`. Job view shows venue, COI, waiver, hold.
- `employee-portal`: Run sheet / My Day show venue logistics and other vendors for assigned jobs.
- `customer-portal`: Payer signs required waivers; guests 403.
- `billing-payments`: Damage hold/capture/release remain processor calls; amounts are `flt` + backend strings. No new processor.
- `notifications`: COI missing, policy expiry, waiver needed — existing `notifications.send`; missing Twilio does not crash.
- `identity-access`: Guest cannot sign waivers as payer or place/capture holds.
- `booking-availability`: Booking stores a Venue link; address snapshot stays for history if the venue later changes.

## Impact

- Frontends: `frontend/owner-portal`, `frontend/employee-portal`, `frontend/customer-portal`; rebuild `public/{owner,employee,client}/`.
- Backend: `api/venues.py`, `api/vendors.py`, `api/compliance.py`; DocTypes under Entertainment Express Core; Event Booking `venue` Link + logistics snapshot fields; wrap `api/billing.py` damage hold.
- Tests: `tests/test_phase17_venues_vendors.py` — isolation, guest 403, money strings on holds.
- Cluster: bump bench image; `bench migrate` on tenant sites.
- Depends on: phase-1 bookings/contracts, phase-4 sub-rentals (overflow is vendors, not stock), phase-5 Stripe preauth, phase-26 portals.
- Does not: maps OAuth, insure.events, Desk-only venue lists, charging vendors through EE payroll.
