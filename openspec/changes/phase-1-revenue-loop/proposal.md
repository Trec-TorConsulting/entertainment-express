# Change: Phase 1 — Revenue Loop (MVP)

## Why
Phase 0 gives us a running but empty platform. Phase 1 delivers the first **end-to-end money-making slice**
so a real mobile-entertainment company can be onboarded and take a booking with a paid deposit. This is the
minimum that makes EE a usable product: **provision a tenant → the tenant logs in → captures a lead →
builds a quote from a configurable catalog → gets a signed contract → converts to a booking → collects a
Stripe deposit invoice**, with confirmation emails.

## What Changes
This phase spans several capabilities but only the **subset** needed for the revenue loop. Later phases
complete each capability.

1. **Automated tenant provisioning (control plane subset)**
   - Control-plane site `admin.{base_domain}` with `Tenant`, `Provisioning Job`, minimal `Plan` DocTypes.
   - A provisioning worker/Job that creates a tenant site, installs apps, runs **tenant bootstrap**
     (roles, defaults, a starter service catalog), maps the subdomain, marks active — idempotently.
2. **Identity & access (subset)**
   - EE roles wired with real permissions for `EE Tenant Admin`, `EE Sales`, `EE Accounting`.
   - Login, password reset, session scoping per tenant. (2FA/mobile tokens deferred.)
3. **Service catalog (subset)**
   - `Service Item` (extends ERPNext Item), `Service Package`, `Service Asset`, basic `Service Area` +
     travel fee, simple pricing (base price + package price + travel fee). Full CRUD + availability check
     for unique/pool assets.
4. **CRM (subset)**
   - `Lead` capture (manual + public web form), convert to `Opportunity`, build **EE Quote** (extends
     ERPNext Quotation) with event fields, generate branded PDF, send quote link.
   - **EE Contract** with native e-signature (audit trail) → on sign, convert to booking.
5. **Booking & availability (subset)**
   - `Event Booking` DocType, availability engine (asset/crew-role conflict + buffers), a public
     **online booking site** page for quote requests / tentative bookings, booking holds for race safety.
6. **Billing & payments (subset)**
   - On booking confirmation, generate a **deposit Sales Invoice** (ERPNext) and collect via **Stripe**
     (Checkout/PaymentIntent). Webhook reconciliation (idempotent) marks it paid and confirms the booking.
7. **Notifications (subset)**
   - Transactional **email** only: quote sent, contract sent/signed, booking confirmed, deposit receipt.

## Impact
- New DocTypes in `entertainment_express` across modules: Control Plane, Service Catalog, Booking, Billing
  Payments, Entertainment Express Core.
- Custom Fields on ERPNext Item, Quotation, Sales Invoice, Customer/Contact via fixtures.
- New whitelisted APIs under `entertainment_express/api/` for catalog, quote, contract, booking, payment
  webhook, and the public booking/lead endpoints in `www/`.
- New infra: provisioning worker (extends phase-0 bench), Stripe secret, SMTP config.
- Dependencies: **phase-0 must be complete.**

## Non-Goals (explicitly deferred)
- Dispatch/crew assignment (phase-2), HR/payroll (phase-3), fleet (phase-4).
- Square/PayPal/ACH, refunds, tips, payment schedules beyond a single deposit (phase-5).
- SMS/WhatsApp/push (phase-6), customer portal (phase-7), marketing (phase-8), mobile app (phase-9),
  reporting (phase-10), AI (phase-11), full control plane + subscription billing + metering (phase-12).
- 2FA, mobile tokens, custom domains (phase-14).

## Requirements delivered (traceability)
- `platform-multitenancy`: Automated Tenant Provisioning; Tenant Lifecycle Management (create only; suspend/
  resume/deprovision deferred to phase-12); Site-Per-Tenant Isolation (verified by test).
- `saas-control-plane`: Self-Service Tenant Signup (basic, operator-approved); Plans & Entitlements (minimal
  plan record — enforcement stubs).
- `identity-access`: User Authentication (password login/reset); Role-Based Authorization (Tenant Admin/
  Sales/Accounting); Plan-Based Entitlement Checks (hook in place, minimal).
- `service-catalog`: Configurable Service Items; Packages & Add-ons (packages only); Service Assets;
  Dynamic Pricing Rules (travel fee + base/package only); Service Areas & Travel Fees.
- `crm`: Lead Capture & Management; Opportunity Pipeline (basic); Quoting; Contracts & E-Signature;
  Quote-to-Booking Conversion; Activities & Follow-ups (quote-sent reminder only).
- `booking-availability`: Availability Engine; Public Online Booking Site (quote request + tentative);
  Booking Holds; Booking Lifecycle & Modifications (create/confirm/cancel subset); Calendar views (basic).
- `billing-payments`: Deposits & Payment Schedules (single deposit); Multi-Processor Payments (Stripe only);
  Webhook Reconciliation; Accounting Integrity (deposit invoice + payment entry).
- `notifications`: Multi-Channel Delivery (email only); Templates & Personalization; Asynchronous Sending.
