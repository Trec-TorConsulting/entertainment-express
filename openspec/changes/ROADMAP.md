# Entertainment Express — Implementation Roadmap

> **How to use this file (implementing model, read carefully):**
> 1. Read [`openspec/project.md`](../project.md) end to end first.
> 2. Read the baseline capability specs in [`openspec/specs/`](../specs) — they are the authoritative
>    definition of WHAT to build.
> 3. Implement **strictly in phase order** below. Do not start a phase until the previous phase's
>    "Definition of Done" is met.
> 4. Each `phase-N-*/` folder contains `proposal.md` (why + scope + which spec requirements),
>    `design.md` (concrete how: DocTypes, fields, APIs, manifests, file paths), and `tasks.md`
>    (ordered, checkable steps with acceptance criteria). Do one task at a time and check it off.
> 5. Fully-detailed proposals exist for archived phases **0–39**. Research notes:
>    [`COMPETITIVE_GAP_NOTES.md`](COMPETITIVE_GAP_NOTES.md).

> **Commands & workflow (spec-first model — important):**
> - The **source of truth is the baseline specs** in [`openspec/specs/`](../specs). Changes
>   (`phase-N-*/`) intentionally carry only `proposal.md` / `design.md` / `tasks.md` — they do **not**
>   contain delta specs.
> - **To start / continue building a phase:** `openspec status --change <phase-id> --json`, then work
>   its `tasks.md` (or ask Antigravity / Gemini to apply the change via openspec-apply-change). `applyRequires` is `["tasks"]`, which is satisfied.
> - **To validate:** use `openspec validate --specs` (validates all baseline specs). Do **not** expect
>   `openspec validate <phase-id>` to pass — it reports "no deltas" by design, which is expected and is
>   **not** an error to fix.
> - **To see phases/tasks:** `openspec list`.

## Phase status legend
- ✅ detailed change proposal exists (proposal + design + tasks)
- 📝 summarized here; expand into a full proposal before implementing

---

## Phase 0 — Foundation & Deployment ✅ archived 2026-09-02
**Goal:** A running, empty EE platform: the `entertainment_express` Frappe app scaffolded, ERPNext + EE
bench containerized, deployed to K3S namespace `entertainment-express`, MariaDB/Redis/ingress/TLS working,
one base tenant site reachable over its subdomain, backups scheduled.
**Specs:** `infrastructure-deployment`, `platform-multitenancy` (runtime pieces only).
**Folder:** [`archive/2026-09-02-phase-0-foundation/`](archive/2026-09-02-phase-0-foundation/)

## Phase 1 — Revenue Loop (MVP) ✅ archived 2026-09-02
**Goal:** The first end-to-end money-making slice: automated tenant provisioning + auth/roles, CRM
(lead→opportunity→quote→e-sign contract), configurable service catalog + assets, online booking +
availability, and quote-to-invoice with a Stripe deposit payment.
**Specs:** `platform-multitenancy`, `identity-access`, `saas-control-plane` (provisioning + minimal plans),
`crm`, `service-catalog`, `booking-availability`, `billing-payments` (deposit/invoice/Stripe subset),
`notifications` (transactional email subset).
**Folder:** [`archive/2026-09-02-phase-1-revenue-loop/`](archive/2026-09-02-phase-1-revenue-loop/)

## Phase 2 — Scheduling & Dispatch ✅ archived 2026-09-02
Crew/asset assignment, offer/accept for gig crew, dispatch board, run sheets, field status states,
deterministic crew suggest, and call-time drive order (maps minutes when connected).
**Spec:** `scheduling-dispatch`. **Depends on:** phase-1 bookings, phase-3 workers can precede if needed.
**Folder:** [`archive/2026-09-02-phase-2-scheduling-dispatch/`](archive/2026-09-02-phase-2-scheduling-dispatch/)

## Phase 3 — HR & Workforce ✅ archived 2026-09-02
Worker (W2/1099) onboarding, skills/roles, availability, timesheets, compliance docs. Enables real
dispatch matching and payouts. Owner/employee without Desk.
**Spec:** `hr-workforce`. **Depends on:** phase-1.
**Folder:** [`archive/2026-09-02-phase-3-hr-workforce/`](archive/2026-09-02-phase-3-hr-workforce/)

## Phase 4 — Equipment, Inventory & Fleet ✅ archived 2026-09-02
Asset registry/condition/utilization, consumable stock, vehicles, maintenance, check-in/out & damage,
barcode/QR scan check-in/out, packing lists/pull sheets, multi-location stock, sub-rentals.
Owner/employee without Desk.
**Spec:** `equipment-inventory-fleet`. **Depends on:** phase-1 service-catalog assets.
**Folder:** [`archive/2026-09-02-phase-4-equipment-fleet/`](archive/2026-09-02-phase-4-equipment-fleet/)

## Phase 5 — Full Billing & Multi-Processor Payments ✅ archived 2026-09-02
Complete deposits/payment schedules, Square + PayPal + ACH + Authorize.Net, security/damage deposits & card
pre-authorization, installment payment plans, refunds, tips, webhook reconciliation, full accounting
integrity beyond the phase-1 Stripe subset. Owner/employee/client without Desk.
**Spec:** `billing-payments`, `integrations` (payments). **Depends on:** phase-1.
**Folder:** [`archive/2026-09-02-phase-5-full-billing/`](archive/2026-09-02-phase-5-full-billing/)

## Phase 6 — Notifications (Full Multi-Channel) ✅ archived 2026-09-02
SMS/WhatsApp (Twilio), FCM push, templates, preferences/opt-out/quiet hours, delivery tracking, retries,
beyond the phase-1 email subset. Owner/employee/client without Desk.
**Spec:** `notifications`, `integrations` (comms). **Depends on:** phase-1.
**Folder:** [`archive/2026-09-02-phase-6-notifications/`](archive/2026-09-02-phase-6-notifications/)

## Phase 7 — Customer Portal ✅ archived 2026-09-01
Authenticated self-service: dashboard, booking self-management, portal sign & pay, event questionnaires,
messaging, deliverables access. Surfaces planning forms, timeline, and music planning (delivered in
phase-15).
**Spec:** `customer-portal`. **Depends on:** phase-1, phase-5, phase-6.
**Folder:** [`archive/2026-09-01-phase-7-customer-portal/`](archive/2026-09-01-phase-7-customer-portal/)

## Phase 8 — Marketing & Engagement ✅ archived 2026-09-01
Segmentation, email/SMS/WhatsApp campaigns, lifecycle journeys, review generation, referrals/promotions,
campaign analytics.
**Spec:** `marketing-engagement`. **Depends on:** phase-6.
**Folder:** [`archive/2026-09-01-phase-8-marketing-engagement/`](archive/2026-09-01-phase-8-marketing-engagement/)

## Phase 9 — Mobile Field App (PWA) ✅ archived 2026-09-01
Crew PWA: job list/details, navigation, check-in/out, on-site workflows, media/signature capture, offline
tolerance, push, issue reporting.
**Spec:** `mobile-field-app`. **Depends on:** phase-2, phase-3, phase-6.
**Folder:** [`archive/2026-09-01-phase-9-mobile-field-app/`](archive/2026-09-01-phase-9-mobile-field-app/)
The earlier Expo/customer/dispatch scaffold lives at
[`archive/2026-09-02-phase-4-mobile-app/`](archive/2026-09-02-phase-4-mobile-app/).

## Phase 10 — Reporting & BI ✅
Operational dashboards, financial reports, utilization/ops KPIs, custom reports/exports, scheduled delivery,
control-plane analytics.
**Spec:** `reporting-bi`. **Depends on:** data from phases 1–9.
**Folder:** [`archive/2026-09-01-phase-10-reporting-bi/`](archive/2026-09-01-phase-10-reporting-bi/)

## Phase 11 — AI Assistant & Intelligence ✅
Pluggable Ollama backend, conversational assistant, smart quoting, forecasting, dispatch/route suggestions,
content drafting, lead scoring, guardrails.
**Spec:** `ai-assistant`. **Depends on:** phases 1–10 data; Ollama on node05.
**Folder:** [`archive/2026-09-02-phase-11-ai-assistant/`](archive/2026-09-02-phase-11-ai-assistant/)

## Phase 12 — SaaS Control Plane (Full) ✅
Complete self-service signup, plans/entitlements, usage metering, Stripe subscription billing + dunning,
fleet health dashboard, lifecycle (suspend/resume/deprovision) beyond phase-1 provisioning subset.
**Spec:** `saas-control-plane`, `platform-multitenancy` (lifecycle). **Depends on:** phase-1.
**Folder:** [`archive/2026-09-02-phase-12-saas-control-plane/`](archive/2026-09-02-phase-12-saas-control-plane/)

## Phase 13 — Integrations Expansion ✅
Calendar two-way sync (Google/M365/iCal), maps/routing provider, DocuSign, accounting sync (QuickBooks/Xero),
music streaming (Spotify/Apple/YouTube), integration observability framework hardening.
**Spec:** `integrations`. **Depends on:** phases that consume each integration.
**Folder:** [`archive/2026-09-02-phase-13-integrations/`](archive/2026-09-02-phase-13-integrations/)

## Phase 14 — Hardening & Enterprise Readiness ✅
Performance/scale testing per-site and multi-site, security review (OWASP), backup/restore drills, 2FA/SSO,
audit completeness, per-tenant custom domains, observability/alerting, documentation.
**Specs:** all. **Depends on:** everything.
**Folder:** [`archive/2026-09-02-phase-14-hardening/`](archive/2026-09-02-phase-14-hardening/)

## Phase 15 — Event Planning Suite ✅
The DJ/entertainment client-planning engine: configurable conditional **planning forms/questionnaires** per
event type with reminders, collaborative **event timeline/run-of-show** builder with templates, and
**music planning** (client + guest song requests, must-play/do-not-play, curated suggestion lists, streaming
import/preview, music library & availability check). Surfaces to crew on run sheets and the mobile app.
**Specs:** `event-planning-forms`, `event-timeline`, `music-planning`. **Depends on:** phase-1, phase-7
(portal), phase-13 (streaming integrations), phase-9 (mobile crew view).
**Folder:** [`archive/2026-09-02-phase-15-event-planning/`](archive/2026-09-02-phase-15-event-planning/)

## Phase 16 — Appointments & Consultation Scheduling ✅ archived 2026-09-01
**Goal:** Calendly-style self-service scheduler for consultations/planning meetings: bookable meeting types,
availability/conflict prevention against events and time-off, reminders, reschedule/cancel. Native EE
calendars this phase; Google/Microsoft two-way sync stays phase 13.
**Spec:** `appointments-scheduling` (plus portal/CRM/notification deltas). **Depends on:** phase-3 workers,
phase-6 reminders, phase-26 portals.
**Folder:** [`archive/2026-09-01-phase-16-appointments-scheduling/`](archive/2026-09-01-phase-16-appointments-scheduling/)

## Phase 17 — Venues, Vendors & Insurance/Compliance ✅ archived 2026-09-01
Reusable **venue database** (logistics, access, COI flags), **vendor/partner network** (referrals,
subcontracting/overflow), and **insurance & compliance** (COI tracking, liability/damage waivers, security/
damage deposits & pre-auth, per-event insurance, policy expiry).
**Specs:** `venue-management`, `vendor-network`, `insurance-compliance`. **Depends on:** phase-1, phase-4
(equipment/sub-rentals), phase-5 (deposits/pre-auth).
**Folder:** [`archive/2026-09-01-phase-17-venues-vendors-insurance/`](archive/2026-09-01-phase-17-venues-vendors-insurance/)

## Phase 18 — Data Migration & Onboarding ✅ archived 2026-09-01
Guided CSV/Excel import with mapping/validation, competitor-export mapping presets, idempotent resumable
import jobs, data export, and a new-tenant onboarding checklist. Reduces tenant switching cost.
**Spec:** `data-migration`. **Depends on:** phase-1 (core entities exist); can run in parallel with later
phases as those entities become importable.
**Folder:** [`archive/2026-09-01-phase-18-data-migration-onboarding/`](archive/2026-09-01-phase-18-data-migration-onboarding/)

## Phase 19 — SaaS Marketing Website & Lead Capture ✅ archived 2026-09-02
**Goal:** The public product front door at `www.{base_domain}` (served by the control-plane site) that sells
EE to prospective tenants: CMS-editable marketing pages + blog, a pricing page synced to control-plane
`Plan` records, public demo/contact/newsletter lead capture with spam protection, a "start free trial" CTA
that creates a control-plane Signup Application (with UTM attribution) and hands off to provisioning, plus
SEO (sitemap/robots/meta/JSON-LD), analytics + cookie consent, and one new `Marketing Settings` DocType.
Frappe-native (no new frontend stack); strictly isolated from tenant sites.
**Spec:** `marketing-website`. **Depends on:** phase-1 (control-plane site, `Plan`, `Signup Application`,
provisioning, email notifications). Enhanced later by phase-8 (marketing-engagement) and phase-12 (full
control plane).
**Folder:** [`archive/2026-09-02-phase-19-marketing-website/`](archive/2026-09-02-phase-19-marketing-website/)

## Phase 21 — Front Page UI ✅ archived 2026-09-02
**Goal:** Shared visual system (portal-kit tokens + marketing CSS) and a designed SaaS home + tenant
public home. Frappe-native public pages; no new backend.
**Specs:** `ui-design-system` (new), `marketing-website` (UX). **Depends on:** phase-19, phase-20.
**Folder:** [`archive/2026-09-02-phase-21-front-page-ui/`](archive/2026-09-02-phase-21-front-page-ui/)

## Phase 22 — /client UI ✅ archived 2026-09-02
**Goal:** Designed customer portal IA and consumer-density UI over existing `/client` APIs.
**Specs:** `customer-portal`. **Depends on:** phase-21.
**Folder:** [`archive/2026-09-02-phase-22-client-ui/`](archive/2026-09-02-phase-22-client-ui/)

## Phase 23 — /employee UI ✅ archived 2026-09-02
**Goal:** Designed ops-density employee shell (My Day, workspaces, field bottom nav).
**Specs:** `employee-portal`. **Depends on:** phase-21, phase-20, phase-2.
**Folder:** [`archive/2026-09-02-phase-23-employee-ui/`](archive/2026-09-02-phase-23-employee-ui/)

## Phase 24 — Owner UI (`/owner`) ✅ archived 2026-09-02
**Goal:** Designed tenant-owner cockpit at `/owner`. Operator Desk stays `/app`.
**Specs:** `owner-portal`. **Depends on:** phase-21, phase-20.
**Folder:** [`archive/2026-09-02-phase-24-owner-ui/`](archive/2026-09-02-phase-24-owner-ui/)

## Phase 25 — Experience OS (owner / employee / client) ✅ archived 2026-09-02
**Goal:** Replace portal chrome with one product family, three skins: `/owner` company OS (optional Talent
tab), `/employee` role-sliced ops, `/client` complete client OS plus event guests (planning, votes, chat;
payer-only money). Canned reports per URL. New `event-collaboration` backend.
**Specs:** `owner-portal`, `employee-portal`, `customer-portal`, `event-collaboration` (new),
`identity-access`, `reporting-bi`, `notifications`.
**Depends on:** phase-20 shells, phase-1/2/5/15 APIs.
**Folder:** [`archive/2026-09-02-phase-25-experience-os/`](archive/2026-09-02-phase-25-experience-os/)

## Phase 26 — Core Completeness (usable revenue + planning loops) ✅ archived 2026-09-01
**Goal:** Make the shells usable without Desk: interactive Proposal (packages + contract + deposit) in
`/owner` and `/client`; working Pay / Documents / Planning (not empty states); event-type workflow
checklists; potential vs actual quote conflicts; clone job; public catalog/wishlist; warehouse-only
lines on pull sheets. Explicitly **not** Eventsquid ticketing/CEU, eventplanner.net marketplace, or
EventPlanner.ai decks.
**Specs:** `crm`, `customer-portal`, `owner-portal`, `employee-portal`, `booking-availability`,
`service-catalog`, `equipment-inventory-fleet`, `event-planning-forms`, `event-timeline`,
`music-planning`, `event-collaboration`, `billing-payments`, `notifications`, `identity-access`.
**Depends on:** phase-1 quotes/contracts, phase-5 payments, phase-15 planning, phase-25 OS.
**Folder:** [`archive/2026-09-01-phase-26-core-completeness/`](archive/2026-09-01-phase-26-core-completeness/)

## Phase 20 — Role-Based Portals ✅ archived 2026-09-02
**Goal:** Modernize the experience layer by giving each audience its own purpose-built portal over the **one**
existing backend, and reserve the operator Desk for the platform operator: `/app` → `System Manager`/
`SaaS Operator` only; `/owner` → `EE Tenant Admin` business cockpit; `/employee` → role-adaptive staff/field
operations workspace; `/client` → customers (unchanged). Two new React+Vite+TS SPAs (matching the existing
customer/dispatch portals) served by role-guarded Frappe `www` host pages, a shared portal UI kit, a small set
of read-optimized aggregate APIs, one optional `EE Portal Settings` Single, and a **staged, reversible**
enforcement flag (`off → warn → enforce`) so no owner/employee is locked out before parity. No new backend,
DB, service, or namespace.
**Specs:** `owner-portal`, `employee-portal`, `identity-access` (tiered boundary + role-based landing),
`customer-portal` (alignment only). **Depends on:** phase-1 (identity/roles, provisioning, `/client`); reuses
phase-2 dispatch and the phase-4/9 mobile API. Enhanced later by phase-10 (BI feeds the cockpit) and phase-12
(full control plane).
**Folder:** [`archive/2026-09-02-phase-20-role-based-portals/`](archive/2026-09-02-phase-20-role-based-portals/)

---

## Competitive gap track (post phase-26) — parity + differentiators

Research: top mobile-entertainment operators + SaaS/PaaS rivals (IO, ERS, BCN, Goodshuffle, HoneyBook,
Rentman, TapGoods, DJ Intelligence, DJEP). Mapping in [`COMPETITIVE_GAP_NOTES.md`](COMPETITIVE_GAP_NOTES.md).

## Phase 27 — Weather & Outdoor Risk ✅
**Goal:** Forecast checks, wind/precip/lightning thresholds, booking weather status, rain-date offers,
portal + notification surfaces for outdoor/weather-sensitive jobs.
**Specs:** `weather-outdoor-risk` (new), `booking-availability`, `service-catalog`, `notifications`,
`owner-portal`, `customer-portal`, `scheduling-dispatch`.
**Depends on:** phase-1 bookings, phase-6 notifications, phase-17 venues (geo), phase-25 portals.
**Folder:** [`phase-27-weather-outdoor-risk/`](phase-27-weather-outdoor-risk/)

## Phase 28 — Site Fit, Delivery Windows & Load Planning ✅
**Goal:** Fulfillment modes (attended/drop-off/self-serve), structured site-fit gates, delivery/pickup
windows on dispatch, weight-aware vehicle loads.
**Specs:** `site-fit-logistics` (new), `service-catalog`, `venue-management`, `booking-availability`,
`scheduling-dispatch`, `equipment-inventory-fleet`, portals.
**Depends on:** phase-2 dispatch, phase-4 fleet, phase-17 venues.
**Folder:** [`phase-28-site-fit-delivery-windows/`](phase-28-site-fit-delivery-windows/)

## Phase 29 — Safety Compliance Ops ✅
**Goal:** Asset inspection certificates with booking gates, sanitization logs, attendee waiver QR
(distinct from payer waivers).
**Specs:** `safety-compliance-ops` (new), `insurance-compliance`, `equipment-inventory-fleet`,
`mobile-field-app`, `customer-portal`, `identity-access`, `owner-portal`, `notifications`.
**Depends on:** phase-4, phase-9, phase-17 insurance/waivers.
**Folder:** [`phase-29-safety-compliance-ops/`](phase-29-safety-compliance-ops/)

## Phase 30 — Tenant Website & Embed Widgets ✅
**Goal:** Tenant marketing page CMS plus embeddable availability/catalog/wishlist/book widgets with
public embed keys and rate limits (beat IO/BCN/ERS/DJI website tools).
**Specs:** `tenant-website` (new), `booking-availability`, `service-catalog`, `marketing-engagement`,
`owner-portal`, `identity-access`, `platform-multitenancy`.
**Depends on:** phase-1 booking site, phase-26 catalog/wishlist.
**Folder:** [`phase-30-tenant-website-widgets/`](phase-30-tenant-website-widgets/)

## Phase 31 — Media Delivery Pipeline ✅
**Goal:** Booking media galleries for booths/events — upload, publish, share links, templates, print
counts; client + field + guest (when published).
**Specs:** `media-delivery` (new), `customer-portal`, `mobile-field-app`, `owner-portal`,
`notifications`, `event-collaboration`, `service-catalog`.
**Depends on:** phase-7/9 deliverables + object storage.
**Folder:** [`phase-31-media-delivery-pipeline/`](phase-31-media-delivery-pipeline/)

## Phase 32 — Live Client ETA Tracking ✅
**Goal:** Live tracking sessions from en-route status with client ETA view and privacy stop on complete.
**Specs:** `live-tracking` (new), `scheduling-dispatch`, `mobile-field-app`, `customer-portal`,
`notifications`, `identity-access`, `integrations`.
**Depends on:** phase-2, phase-9, phase-13 maps.
**Folder:** [`archive/2026-09-02-phase-32-live-eta-tracking/`](archive/2026-09-02-phase-32-live-eta-tracking/)

## Phase 33 — Commerce Extensions ✅
**Goal:** Gift cards, store credit, late fees, net-15/30 terms and PO numbers on quotes/invoices.
**Specs:** `commerce-extensions` (new), `billing-payments`, `crm`, portals, `reporting-bi`,
`identity-access`.
**Depends on:** phase-5 billing.
**Folder:** [`archive/2026-09-02-phase-33-commerce-extensions/`](archive/2026-09-02-phase-33-commerce-extensions/)

## Phase 34 — Multi-Brand Tenants ✅
**Goal:** Multiple brands/DBAs under one site/DB with brand-scoped storefronts and notification identity
(Fun Group–style).
**Specs:** `multi-brand` (new), `service-catalog`, `booking-availability`, portals, `notifications`,
`platform-multitenancy`, `ui-design-system`.
**Depends on:** phase-26 storefront, phase-30 optional for pages per brand.
**Folder:** [`archive/2026-09-02-phase-34-multi-brand-tenants/`](archive/2026-09-02-phase-34-multi-brand-tenants/)

## Phase 35 — DJ Software Playlist Export ✅
**Goal:** Export music lists as Serato CSV / Rekordbox XML subset / M3U metadata (no audio binaries).
**Specs:** `music-planning`, `integrations`, `mobile-field-app`, `employee-portal`, `owner-portal`.
**Depends on:** phase-15 music-planning, phase-13 integrations.
**Folder:** [`archive/2026-09-02-phase-35-dj-software-export/`](archive/2026-09-02-phase-35-dj-software-export/)

## Phase 36 — Competitor Migration Presets ✅
**Goal:** Named import presets for Inflatable Office, ERS, BCN, Goodshuffle, DJEP, DJ Intelligence plus
dry-run validation reports.
**Specs:** `data-migration`, `owner-portal`, `service-catalog`, `crm`, `booking-availability`.
**Depends on:** phase-18 data-migration framework.
**Folder:** [`archive/2026-09-02-phase-36-competitor-migration-presets/`](archive/2026-09-02-phase-36-competitor-migration-presets/)

## Phase 37 — Category-Defining Differentiators ✅
**Goal:** Event Day Copilot, demand heatmap nudges, partner overflow exchange, Live Event Page, ops
reliability badge, PaaS developer surface, vertical starter kits, after-action revenue loop.
**Specs:** `category-differentiators` (new), `ai-assistant`, `service-catalog`, `vendor-network`,
`event-collaboration`, `marketing-engagement`, `reporting-bi`, `booking-availability`,
`saas-control-plane`, `owner-portal`, `media-delivery`.
**Depends on:** phases 11, 27–36 as applicable; control plane for overflow mediation.
**Folder:** [`archive/2026-09-02-phase-37-category-defining-differentiators/`](archive/2026-09-02-phase-37-category-defining-differentiators/)

## Phase 38 — White-Label & Custom Domains ✅ archived 2026-09-02
**Goal:** Per-company white-label (logo, color, favicon, hide EE product chrome, email from-name) and
end-to-end custom domains with automated Traefik TLS so `/owner`, `/employee`, `/client`, and public
book run on the tenant’s hostname; canonical URLs in notifications.
**Specs:** `white-label` (new), `platform-multitenancy`, `infrastructure-deployment`, `owner-portal`,
`employee-portal`, `customer-portal`, `notifications`, `identity-access`, `saas-control-plane`,
`ui-design-system`, `multi-brand`, `booking-availability`.
**Depends on:** phase-14 domain APIs, phase-20 portal settings, phase-25 portals, phase-34 brand hosts.
**Folder:** [`archive/2026-09-02-phase-38-white-label-custom-domains/`](archive/2026-09-02-phase-38-white-label-custom-domains/)

## Phase 39 — Full-Site White-Label & Style Matcher ✅ archived 2026-09-02
**Goal:** Entire tenant site white-labeled (public home/book/catalog/login/emails/footers), richer brand
kit (colors/fonts/logos/footer), and an owner **style matcher** that imports look-and-feel from the
company’s current website URL and/or logo with preview + apply.
**Specs:** `white-label`, `brand-style-matcher` (new), `owner-portal`, `booking-availability`,
`customer-portal`, `employee-portal`, `ui-design-system`, `notifications`, `tenant-website`,
`marketing-website`, `multi-brand`.
**Depends on:** phase-38 white-label + custom domains.
**Folder:** [`archive/2026-09-02-phase-39-full-site-white-label/`](archive/2026-09-02-phase-39-full-site-white-label/)

---

## Phase 40 — Portal Premium Experience 📝
**Goal:** Elevate `/owner`, `/employee`, and `/client` from functional scaffolds to enterprise-grade,
sales-ready product surfaces. **North star:** Stripe-minimal. **Stack:** Radix + Tailwind in portal-kit.
**Dark mode:** v1. **Marketing www:** out of scope (portals first; marketing match later).

| Sub-phase | Delivers |
|-----------|----------|
| **40a** | portal-kit v2, Storybook, AppShell v2, PQB + CI gates (Lighthouse, axe, visual regression) |
| **40b** | `/owner` SPA refactor + flagship routes (Today, Pipeline, Money, Brand) |
| **40c** | `/client` + `/employee` flagship routes; staging dogfood; spec sync |

**Specs:** `portal-premium-experience` (new), `ui-design-system`, `owner-portal`, `employee-portal`,
`customer-portal`.
**Depends on:** phases 20–25 (portals + APIs), 21 (tokens), 38–39 (white-label).
**Folder:** [`phase-40-portal-premium-experience/`](phase-40-portal-premium-experience/)

---

## After the roadmap — Production operator readiness ✅ archived 2026-09-02
Operator docs, safe re-apply on the existing cluster, website cache flush on python start, and MariaDB
NetworkPolicy. Not a numbered product phase.
**Specs:** `infrastructure-deployment`.
**Folder:** [`archive/2026-09-02-production-operator-readiness/`](archive/2026-09-02-production-operator-readiness/)

## Traceability
Every phase proposal MUST list the exact baseline spec **Requirement** names it delivers, and every
`tasks.md` MUST map tasks back to those requirements so coverage is verifiable at phase close.
