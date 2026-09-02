## Why

Owners still blast from personal Gmail. HoneyBook-class tools have lists, review asks, and promo codes. Phase 6 already delivers email/SMS/WhatsApp with opt-out. This phase puts segments, campaigns, post-event review asks, promo codes, and client referrals on `/owner/grow` without Desk.

## What Changes

- **EE Segment** — named audience from this site’s customers, leads, or jobs (e.g. completed in the last 12 months).
- **EE Campaign** — draft/send on email, SMS, or WhatsApp via existing `notifications.send`. Opt-outs skipped. Opens/clicks via a tokenized guest track URL. Missing Twilio does not crash.
- **Post-event journey** — daily sweep: completed jobs get a thank-you + review request when a review URL is set.
- **EE Promo Code** — percent or amount (`flt`), max uses, expiry. Apply on a quote/job. SPA shows backend money strings.
- **EE Client Referral** — referrer + referred email; first completed job issues a reward promo.
- **Override:** Google Business / Mailchimp OAuth and visual journey builders are **out**. v1 records a review URL the owner pastes. Open/click tracking is a token ping, not a full ESP.
- **Non-goals:** control-plane SaaS marketing (phase 19), vendor referrals (already phase 17), GL coupon liability.

## Capabilities

### New Capabilities
- (none) — `marketing-engagement` already exists.

### Modified Capabilities
- `marketing-engagement`: portal CRUD for segments, campaigns, promos, referrals, review asks; analytics counts.
- `owner-portal`: `/owner/grow` without `/app`.
- `customer-portal`: payer can apply a promo code; guests 403.
- `identity-access`: guests cannot send campaigns; no `tenant`/`site` args.
- `notifications`: campaigns use promotional priority so opt-out is honored.
- `billing-payments` / `crm`: promo discount via `flt` on Quotation/Event Booking; no SPA math.

## Impact

- Backend: `api/engagement.py`; DocTypes under Entertainment Express Core; daily scheduler; guest `track`.
- Frontend: owner Grow; client Events promo field; rebuild `public/{owner,client}/`.
- Tests: `tests/test_phase8_marketing.py`.
- Cluster: bump `0.0.64-ee` → `0.0.65-ee`.
- Depends on: phase-6 notifications, phase-1 customers/bookings.
