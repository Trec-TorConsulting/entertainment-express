## 1. Tip Pooling DocTypes & Schemas

- [x] 1.1 Create `EE Tip Pool` DocType linked to Booking with total amount and split rule options.
- [x] 1.2 Create `EE Tip Split Line` child table storing per-worker share and transfer IDs.
- [x] 1.3 Create `EE Worker Payout Account` storing Stripe Connect Express account ID and instant payout eligibility.

## 2. Server APIs & Stripe Connect Transfers

- [x] 2.1 Implement `create_guest_tip_intent` endpoint with Apple Pay / Google Pay support.
- [x] 2.2 Implement `settle_event_tip_pool` calculating Equal, Hours-Weighted, and Role-Weighted distributions.
- [x] 2.3 Implement `trigger_stripe_instant_payout` invoking Stripe Transfers and Instant Payout API.
- [x] 2.4 Add post-gig teardown hook triggering automatic tip pool settlement upon verified equipment checkout.

## 3. Worker Mobile UI & Guest Tip Screen

- [x] 3.1 Build `DigitalTipJar.tsx` at `/tip/:token` with preset tip buttons and Apple Pay button.
- [x] 3.2 Build `EarningsView.tsx` in `/employee/earnings` showing available balance and 1-tap instant cashout.
- [x] 3.3 Build `TipManagement.tsx` in `/owner/money/tips` for owner oversight and manual split overrides.

## 4. Verification & Testing

- [x] 4.1 Write automated tests `test_tip_pooling.py` verifying split math (equal, hours, role) and Stripe transfer payload construction.
