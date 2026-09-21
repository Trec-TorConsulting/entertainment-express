## 1. Emergency Callout DocTypes & Schemas

- [x] 1.1 Create `EE Emergency Callout` DocType with role, surge bonus, and atomic claim lifecycle.
- [x] 1.2 Create `EE Emergency Recipient` child table storing per-worker tokens and SMS delivery receipts.
- [x] 1.3 Create `EE Subcontractor Exchange Posting` DocType for peer network overflow broadcasting.

## 2. Server APIs & Atomic Shift Locking

- [x] 2.1 Implement `launch_emergency_crew_cascade` selecting matching available workers and queuing SMS messages.
- [x] 2.2 Implement `claim_emergency_shift` with MariaDB `SELECT FOR UPDATE` atomic concurrency lock.
- [x] 2.3 Add automatic booking assignment hook updating `Booking` crew table and alerting dispatcher.
- [x] 2.4 Add multi-tenant isolation unit tests confirming tokens cannot cross tenant boundaries.

## 3. Worker Mobile UI & Dispatch Board Integration

- [x] 3.1 Build `ClaimEmergencyShift.tsx` at `/claim/:token` with responsive mobile CTA button.
- [x] 3.2 Build `EmergencyDrawer.tsx` on Owner Dispatch board with live broadcast progress ticker.
- [x] 3.3 Add B2B subcontractor exchange broadcast tab for peer operator liquidity.

## 4. Verification & Testing

- [x] 4.1 Write concurrent automated tests `test_emergency_claim_race.py` simulating 5 simultaneous claim requests and asserting exactly one winner.
