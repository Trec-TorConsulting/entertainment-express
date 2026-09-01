## Context

Phase 6 `notifications.send` already fans out email/SMS/WhatsApp with opt-out and quiet hours. There is no segment, campaign, promo, or review-request DocType. Vendor `EE Referral` is partners, not client-to-client. Isolation is site-per-tenant. Money uses `flt`. Guests are not marketers.

Stakeholders: `EE Tenant Admin`, `EE Marketing`, `EE Sales`. Not guests.

## Goals / Non-Goals

**Goals:**
- Owner builds a list, sends a campaign, sees sent/skipped/opened.
- Opt-out skips promotional sends.
- Completed jobs trigger thank-you + review ask.
- Promo codes apply with `flt`; referral first-job issues a code.

**Non-Goals:**
- Mailchimp / Google Business OAuth.
- Visual multi-step journey canvas.
- WhatsApp template approval with Meta.

## Decisions

### D1 — DocTypes
**EE Segment**: `segment_name`, `match` (`all_customers|completed_jobs|upcoming_jobs|leads`), `event_type`, `days`.
**EE Campaign**: name, channel, segment, subject, body, status, counts.
**EE Campaign Recipient** (child): email, status (`queued|sent|skipped|failed|opened|clicked`), skip_reason, track_token.
**EE Promo Code**: code, kind (`percent|amount`), value, max_uses, uses, expires, active.
**EE Promo Redemption**: promo, party, amount, quotation/booking.
**EE Review Request**: booking, status, review_url, sent_at.
**EE Client Referral**: referrer, referred_email, status (`invited|booked|rewarded`), reward_code.

### D2 — Delivery
Campaigns call `notifications.send` with template `campaign_blast`, `channels=[campaign.channel]`, `priority` from template = promotional. Pre-check `_allowed` so skipped rows never enqueue.

### D3 — Tracking
Guest whitelist `track(token, kind)` increments opened/clicked. Email body includes a 1×1 image URL and wrapped links. Tokens are `hash` autoname — unguessable enough for v1.

### D4 — Promo money
Percent → Quotation `additional_discount_percentage = flt(value)`. Amount → `discount_amount = flt(value)` or booking `grand_total`/`balance_due` reduced with `flt`. Never SPA math.

### D5 — Files
| Area | Path |
|---|---|
| API | `api/engagement.py` |
| Portal | owner `/grow`; client Events promo |
| Tests | `tests/test_phase8_marketing.py` |

## Risks

- [Twilio missing] → `send` already logs failed, never fake-delivered.
- [Huge lists] → cap 500 recipients per campaign.

## Migration Plan

1. DocTypes + templates + patch; migrate.
2. SPA + scheduler; bump `0.0.64-ee` → `0.0.65-ee`.
3. Rollback: hide `/grow`; records remain.

## Open Questions

- None blocking.
