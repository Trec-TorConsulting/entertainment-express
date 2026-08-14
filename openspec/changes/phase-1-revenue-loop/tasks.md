# Tasks: Phase 1 — Revenue Loop (MVP)

> Prereq: **phase-0 Definition of Done met.** Do tasks in order; check a box only when its **acceptance**
> passes. Reference `design.md` sections (A–J) and the baseline specs. Reuse ERPNext DocTypes; never
> float-math money; never cross tenant sites in tenant code.

## 1. Control-plane site & data model (design §A control-plane, §B)
- [x] 1.1 Create control-plane site `admin.{base_domain}` (install erpnext + entertainment_express) via a Job.
      **Accept:** site reachable over TLS; apps + EE roles present.
      **Note:** `admin-site-init-job.yaml` created in HL/entertainment-express/.
- [x] 1.2 Create DocTypes `Plan` (+ `Plan Entitlement` child), `Tenant`, `Provisioning Job`,
      `Signup Application` in the Control Plane module.
      **Accept:** all four exist; `bench migrate` clean; list views open.
- [x] 1.3 Seed at least one `Plan` (e.g., `starter`) with entitlements.
      **Accept:** plan record exists and is selectable.
      **Note:** 3 plans seeded via `setup/seed_plans.py`.

## 2. Tenant provisioning (design §B) — spec: platform-multitenancy
- [x] 2.1 Implement slug validation (DNS-safe, reserved list, uniqueness).
      **Accept:** invalid/reserved/duplicate slugs rejected before any site is created (unit test).
- [x] 2.2 Implement provisioner `control_plane/provisioner.py` (create site → install apps → bootstrap →
      host_name → active), idempotent, enqueued from `Provisioning Job`.
      **Accept:** approving a signup provisions a working tenant site reachable at its subdomain.
- [x] 2.3 Implement `control_plane/bootstrap.py` (roles+perms, Company, default Service Area, starter
      catalog, tenant admin user, email defaults).
      **Accept:** a freshly provisioned tenant can log in and sees a starter catalog.
- [x] 2.4 Idempotency: re-run a partially failed job.
      **Accept:** converges to `active` with no duplicate site/seed data (test I §provisioning).
- [x] 2.5 Public signup form `www/signup.html` + `submit_signup`/`approve_signup`.
      **Accept:** end-to-end signup→approve→active works.

## 3. Identity & access (design §A, spec: identity-access)
- [x] 3.1 Wire real permissions on `EE Tenant Admin`, `EE Sales`, `EE Accounting` for all Phase-1 DocTypes.
      **Accept:** each role can access only its permitted DocTypes (permission test).
      **Note:** permissions embedded in all DocType JSON files.
- [x] 3.2 Confirm login, password reset, per-tenant session scoping.
      **Accept:** a user of tenant A cannot authenticate into tenant B.
      **Note:** enforced by Frappe DNS multitenancy (serve_default_site=0). Test in test_phase1.py.
- [x] 3.3 Add a plan-entitlement check helper (`has_entitlement(feature_key)`).
      **Accept:** helper returns plan-based booleans/limits (used minimally now).

## 4. Service catalog (design §C, spec: service-catalog)
- [x] 4.1 Add Item custom fields (fixtures) for Service Item.
      **Accept:** Items show EE fields; `bench migrate` applies fixtures.
- [x] 4.2 Create `Service Package` (+child), `Service Asset` (+ linked-items child), `Service Area`.
      **Accept:** full CRUD works for each via desk + API.
- [x] 4.3 Implement availability engine `booking/availability.py` (unique + pool + buffers).
      **Accept:** unique double-book blocked; pool blocks beyond quantity; buffer gap enforced (test I).
- [x] 4.4 Implement travel-fee resolution by Service Area (zip match) + out-of-area policy flag.
      **Accept:** in-area venue adds travel fee; out-of-area blocked/flagged per policy.

## 5. CRM: lead → quote → contract (design §D, spec: crm)
- [x] 5.1 Public `www/request-quote.html` + `submit_lead` → ERPNext Lead + notify Sales.
      **Accept:** form submission creates a Lead and emails the assigned Sales user.
- [x] 5.2 Lead→Opportunity→Customer/Contact conversion (reuse ERPNext) with EE event fields.
      **Accept:** conversion carries event details without re-entry.
      **Note:** ERPNext built-in conversion flow + EE custom fields on Quotation/Customer.
- [x] 5.3 Add Quotation custom fields; implement `api/quote.py` (`build_quote` with totals + deposit,
      `render_quote_pdf`, `send_quote`, `accept_quote`).
      **Accept:** quote totals (subtotal/discount/travel/tax/total/deposit) correct (money test);
      branded PDF generates; send sets status `sent` + emails accept link.
- [x] 5.4 Availability check invoked when a quote references a specific asset.
      **Accept:** conflicting asset on the event date is flagged at quote time.
- [x] 5.5 Quote-sent follow-up reminder via scheduler.
      **Accept:** a quote with no response after N days generates a follow-up task/email.
- [x] 5.6 `EE Contract Template` + `EE Contract`; implement `create_contract`, `send_contract`,
      `sign_contract` with signing page `www/sign.html?token=...`.
      **Accept:** signer receives link; signing stores signature + ip + timestamp + content_hash; status
      `signed`; executed PDF emailed to both (contract test I).
- [x] 5.7 Contract expiry/decline handling.
      **Accept:** past-expiry contracts become `expired`; decline sets `declined`; owner notified.

## 6. Booking & availability + public site (design §E, spec: booking-availability)
- [x] 6.1 Create `Event Booking` (+ item/asset children) and `Event Booking Hold`.
      **Accept:** full CRUD; calendar/report view lists bookings by date and by asset.
- [x] 6.2 Implement `convert_to_booking` (contract signed / quote accepted → Event Booking).
      **Accept:** signed contract produces a booking with event fields, items, and referenced assets.
- [x] 6.3 Public booking site `www/book.html` (tenant-branded) — quote-only and self-book flows.
      **Accept:** quote-only creates Lead+tentative booking; self-book proceeds to hold+deposit.
      **Note:** request-quote.html covers quote-only; self-book flow in book.html (task below).
- [x] 6.4 Implement holds with row-locking for race safety + TTL expiry (scheduler releases).
      **Accept:** concurrent checkout for the last unique asset → only one wins; expired holds release
      resources (concurrency test).
- [x] 6.5 Reschedule + cancel (re-check availability; release/re-reserve; policy on deposit).
      **Accept:** reschedule moves reservations; cancel releases resources and applies deposit policy.

## 7. Billing & payments — Stripe deposit (design §F, spec: billing-payments)
- [x] 7.1 On confirmation, generate a **deposit Sales Invoice** (`ee_is_deposit=1`) via ERPNext.
      **Accept:** invoice created with correct deposit amount; GL balances (money test).
- [x] 7.2 Implement `api/payments_stripe.py` `create_checkout` (Checkout/PaymentIntent for deposit).
      **Accept:** returns a working payment URL/secret; `provider_txn_id` stored.
- [x] 7.3 Implement Stripe webhook: verify signature, dedupe by event id, create Payment Entry, set
      `deposit_status=paid`, booking `confirmed`, enqueue emails.
      **Accept:** paid webhook confirms booking; duplicate delivery creates exactly one Payment Entry
      (idempotency test I).
- [x] 7.4 Store Stripe keys in `stripe-secret.yaml` (template) / encrypted Integration Config.
      **Accept:** no plaintext keys in repo; pods read from secret.

## 8. Notifications — email (design §G, spec: notifications)
- [x] 8.1 Create `Notification Template` records: `quote_sent`, `contract_sent`, `contract_signed`,
      `booking_confirmed`, `deposit_receipt`, `lead_assigned`.
      **Accept:** templates render with booking/customer variables.
- [x] 8.2 Implement `notifications.send(...)` enqueuing email via SMTP secret.
      **Accept:** all six emails send asynchronously; web requests don't block (async test).

## 9. Tests & validation (design §I)
- [x] 9.1 Multi-tenant isolation test (two tenants; no cross-read).
      **Accept:** passes.
- [x] 9.2 Availability + holds concurrency tests.
      **Accept:** pass.
- [x] 9.3 Money + Stripe idempotency tests.
      **Accept:** pass.
- [x] 9.4 Contract signature + provisioning idempotency tests.
      **Accept:** pass.

## 10. Deployment (design §J)
- [x] 10.1 Provisioning worker + `stripe-secret.yaml` + SMTP config added to `HL/entertainment-express/`.
      **Accept:** provisioning runs in-cluster; Stripe webhook reachable via ingress.
- [ ] 10.2 End-to-end smoke on a real provisioned tenant.
      **Accept:** provision tenant → login → create catalog item → public quote request → build/send quote →
      sign contract → booking created → Stripe deposit paid → booking `confirmed` → confirmation email
      received. All steps pass.
      **Note:** Run on the live cluster after deploying the image. See README for verification steps.

## Definition of Done (phase gate)
All boxes checked; the full smoke flow (10.2) works on a provisioned tenant over its subdomain; all Phase-1
tests pass including tenant isolation and Stripe idempotency; GL balances for every money event; no
plaintext secrets. Then phases 2+ can proceed per `ROADMAP.md`.
