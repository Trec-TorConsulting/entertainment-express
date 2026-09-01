# Tasks: Phase 8 — Marketing & Engagement

> Lists, campaigns, review asks, promos, referrals on `/owner/grow`. Opt-out via phase 6. Money via `flt`.

## 1. Schema

- [x] 1.1 DocTypes `EE Segment`, `EE Campaign` + child `EE Campaign Recipient`.
      **Accept:** migrate; recipient has track_token.
- [x] 1.2 DocTypes `EE Promo Code`, `EE Promo Redemption`, `EE Review Request`, `EE Client Referral`; Portal Settings `review_url`.
      **Accept:** promo value is Currency; no SPA math.

## 2. API

- [x] 2.1 `api/engagement.py`: segment preview, campaign CRUD/send, track open/click, promo apply, referral save, analytics.
      **Accept:** guest 403 on send; opt-out skipped; no `tenant`/`site` args; `flt` on promo.
- [x] 2.2 Daily `run_lifecycle`: completed jobs → thank-you + review request; referral first-job → reward code.
      **Accept:** missing Twilio does not raise; missing review URL skips review send.

## 3. Portal

- [x] 3.1 `/owner/grow`: lists, send campaign, promo codes, referrals, review URL, campaign counts.
      **Accept:** not EmptyState; no `/app`; no DocType names.
- [x] 3.2 `/client` Events: payer applies a promo; guests 403.
      **Accept:** pytest.

## 4. Ship

- [x] 4.1 `tests/test_phase8_marketing.py`: isolation, guest 403, opt-out skip, `flt`.
      **Accept:** pytest on tenant site.
- [x] 4.2 Rebuild `public/{owner,client}/`; bump `0.0.64-ee` → `0.0.65-ee`; migrate tenant sites.
      **Accept:** Grow loads for the owner.
