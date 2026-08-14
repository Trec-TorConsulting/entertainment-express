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
> 5. Fully-detailed proposals exist for **phase-0**, **phase-1**, and **phase-19**. Phases 2–18 are
>    scoped here as summaries; before starting one, generate its `proposal.md`/`design.md`/`tasks.md`
>    following the same pattern as phase-0/phase-1/phase-19, using the matching baseline spec as the
>    source of truth. You can also ask Cursor to propose a change (openspec-propose skill) to scaffold them.

> **Commands & workflow (spec-first model — important):**
> - The **source of truth is the baseline specs** in [`openspec/specs/`](../specs). Changes
>   (`phase-N-*/`) intentionally carry only `proposal.md` / `design.md` / `tasks.md` — they do **not**
>   contain delta specs.
> - **To start / continue building a phase:** `openspec status --change <phase-id> --json`, then work
>   its `tasks.md` (or ask Cursor to apply the change via openspec-apply-change). `applyRequires` is `["tasks"]`, which is satisfied.
> - **To validate:** use `openspec validate --specs` (validates all baseline specs). Do **not** expect
>   `openspec validate <phase-id>` to pass — it reports "no deltas" by design, which is expected and is
>   **not** an error to fix.
> - **To see phases/tasks:** `openspec list`.

## Phase status legend
- ✅ detailed change proposal exists (proposal + design + tasks)
- 📝 summarized here; expand into a full proposal before implementing

---

## Phase 0 — Foundation & Deployment ✅
**Goal:** A running, empty EE platform: the `entertainment_express` Frappe app scaffolded, ERPNext + EE
bench containerized, deployed to K3S namespace `entertainment-express`, MariaDB/Redis/ingress/TLS working,
one base tenant site reachable over its subdomain, backups scheduled.
**Specs:** `infrastructure-deployment`, `platform-multitenancy` (runtime pieces only).
**Folder:** [`phase-0-foundation/`](phase-0-foundation/)

## Phase 1 — Revenue Loop (MVP) ✅
**Goal:** The first end-to-end money-making slice: automated tenant provisioning + auth/roles, CRM
(lead→opportunity→quote→e-sign contract), configurable service catalog + assets, online booking +
availability, and quote-to-invoice with a Stripe deposit payment.
**Specs:** `platform-multitenancy`, `identity-access`, `saas-control-plane` (provisioning + minimal plans),
`crm`, `service-catalog`, `booking-availability`, `billing-payments` (deposit/invoice/Stripe subset),
`notifications` (transactional email subset).
**Folder:** [`phase-1-revenue-loop/`](phase-1-revenue-loop/)

## Phase 2 — Scheduling & Dispatch 📝
Crew/asset assignment, offer/accept for gig crew, dispatch board, run sheets, field status states.
**Spec:** `scheduling-dispatch`. **Depends on:** phase-1 bookings, phase-3 workers can precede if needed.

## Phase 3 — HR & Workforce 📝
Worker (W2/1099) onboarding, skills/roles, availability, timesheets, compliance docs. Enables real
dispatch matching and payouts.
**Spec:** `hr-workforce`. **Depends on:** phase-1.

## Phase 4 — Equipment, Inventory & Fleet 📝
Asset registry/condition/utilization, consumable stock, vehicles, maintenance, check-in/out & damage,
barcode/QR scan check-in/out, packing lists/pull sheets, multi-location stock, sub-rentals.
**Spec:** `equipment-inventory-fleet`. **Depends on:** phase-1 service-catalog assets.

## Phase 5 — Full Billing & Multi-Processor Payments 📝
Complete deposits/payment schedules, Square + PayPal + ACH + Authorize.Net, security/damage deposits & card
pre-authorization, installment payment plans, refunds, tips, webhook reconciliation, full accounting
integrity beyond the phase-1 Stripe subset.
**Spec:** `billing-payments`, `integrations` (payments). **Depends on:** phase-1.

## Phase 6 — Notifications (Full Multi-Channel) 📝
SMS/WhatsApp (Twilio), FCM push, templates, preferences/opt-out/quiet hours, delivery tracking, retries,
beyond the phase-1 email subset.
**Spec:** `notifications`, `integrations` (comms). **Depends on:** phase-1.

## Phase 7 — Customer Portal 📝
Authenticated self-service: dashboard, booking self-management, portal sign & pay, event questionnaires,
messaging, deliverables access. Surfaces planning forms, timeline, and music planning (delivered in
phase-15).
**Spec:** `customer-portal`. **Depends on:** phase-1, phase-5, phase-6.

## Phase 8 — Marketing & Engagement 📝
Segmentation, email/SMS/WhatsApp campaigns, lifecycle journeys, review generation, referrals/promotions,
campaign analytics.
**Spec:** `marketing-engagement`. **Depends on:** phase-6.

## Phase 9 — Mobile Field App (PWA) 📝
Crew PWA: job list/details, navigation, check-in/out, on-site workflows, media/signature capture, offline
tolerance, push, issue reporting.
**Spec:** `mobile-field-app`. **Depends on:** phase-2, phase-3, phase-6.

## Phase 10 — Reporting & BI 📝
Operational dashboards, financial reports, utilization/ops KPIs, custom reports/exports, scheduled delivery,
control-plane analytics.
**Spec:** `reporting-bi`. **Depends on:** data from phases 1–9.

## Phase 11 — AI Assistant & Intelligence 📝
Pluggable Ollama backend, conversational assistant, smart quoting, forecasting, dispatch/route suggestions,
content drafting, lead scoring, guardrails.
**Spec:** `ai-assistant`. **Depends on:** phases 1–10 data; Ollama on node05.

## Phase 12 — SaaS Control Plane (Full) 📝
Complete self-service signup, plans/entitlements, usage metering, Stripe subscription billing + dunning,
fleet health dashboard, lifecycle (suspend/resume/deprovision) beyond phase-1 provisioning subset.
**Spec:** `saas-control-plane`, `platform-multitenancy` (lifecycle). **Depends on:** phase-1.

## Phase 13 — Integrations Expansion 📝
Calendar two-way sync (Google/M365/iCal), maps/routing provider, DocuSign, accounting sync (QuickBooks/Xero),
music streaming (Spotify/Apple/YouTube), integration observability framework hardening.
**Spec:** `integrations`. **Depends on:** phases that consume each integration.

## Phase 14 — Hardening & Enterprise Readiness 📝
Performance/scale testing per-site and multi-site, security review (OWASP), backup/restore drills, 2FA/SSO,
audit completeness, per-tenant custom domains, observability/alerting, documentation.
**Specs:** all. **Depends on:** everything.

## Phase 15 — Event Planning Suite 📝
The DJ/entertainment client-planning engine: configurable conditional **planning forms/questionnaires** per
event type with reminders, collaborative **event timeline/run-of-show** builder with templates, and
**music planning** (client + guest song requests, must-play/do-not-play, curated suggestion lists, streaming
import/preview, music library & availability check). Surfaces to crew on run sheets and the mobile app.
**Specs:** `event-planning-forms`, `event-timeline`, `music-planning`. **Depends on:** phase-1, phase-7
(portal), phase-13 (streaming integrations), phase-9 (mobile crew view).

## Phase 16 — Appointments & Consultation Scheduling 📝
Calendly-style self-service scheduler for consultations/planning meetings: bookable meeting types,
availability/conflict prevention, calendar sync, reminders, reschedule/cancel, video links, meeting
confirmations.
**Spec:** `appointments-scheduling`. **Depends on:** phase-1, phase-6 (reminders), phase-13 (calendar sync).

## Phase 17 — Venues, Vendors & Insurance/Compliance 📝
Reusable **venue database** (logistics, access, COI flags), **vendor/partner network** (referrals,
subcontracting/overflow), and **insurance & compliance** (COI tracking, liability/damage waivers, security/
damage deposits & pre-auth, per-event insurance, policy expiry).
**Specs:** `venue-management`, `vendor-network`, `insurance-compliance`. **Depends on:** phase-1, phase-4
(equipment/sub-rentals), phase-5 (deposits/pre-auth).

## Phase 18 — Data Migration & Onboarding 📝
Guided CSV/Excel import with mapping/validation, competitor-export mapping presets, idempotent resumable
import jobs, data export, and a new-tenant onboarding checklist. Reduces tenant switching cost.
**Spec:** `data-migration`. **Depends on:** phase-1 (core entities exist); can run in parallel with later
phases as those entities become importable.

## Phase 19 — SaaS Marketing Website & Lead Capture ✅
**Goal:** The public product front door at `www.{base_domain}` (served by the control-plane site) that sells
EE to prospective tenants: CMS-editable marketing pages + blog, a pricing page synced to control-plane
`Plan` records, public demo/contact/newsletter lead capture with spam protection, a "start free trial" CTA
that creates a control-plane Signup Application (with UTM attribution) and hands off to provisioning, plus
SEO (sitemap/robots/meta/JSON-LD), analytics + cookie consent, and one new `Marketing Settings` DocType.
Frappe-native (no new frontend stack); strictly isolated from tenant sites.
**Spec:** `marketing-website`. **Depends on:** phase-1 (control-plane site, `Plan`, `Signup Application`,
provisioning, email notifications). Enhanced later by phase-8 (marketing-engagement) and phase-12 (full
control plane).
**Folder:** [`phase-19-marketing-website/`](phase-19-marketing-website/)

## Phase 21 — Front Page UI ✅
**Goal:** Shared visual system (portal-kit tokens + marketing CSS) and a designed SaaS home + tenant
public home. Frappe-native public pages; no new backend.
**Specs:** `ui-design-system` (new), `marketing-website` (UX). **Depends on:** phase-19, phase-20.
**Folder:** [`phase-21-front-page-ui/`](phase-21-front-page-ui/)

## Phase 22 — /client UI ✅
**Goal:** Designed customer portal IA and consumer-density UI over existing `/client` APIs.
**Specs:** `customer-portal`. **Depends on:** phase-21.
**Folder:** [`phase-22-client-ui/`](phase-22-client-ui/)

## Phase 23 — /employee UI ✅
**Goal:** Designed ops-density employee shell (My Day, workspaces, field bottom nav).
**Specs:** `employee-portal`. **Depends on:** phase-21, phase-20, phase-2.
**Folder:** [`phase-23-employee-ui/`](phase-23-employee-ui/)

## Phase 24 — Owner UI (`/owner`) ✅
**Goal:** Designed tenant-owner cockpit at `/owner`. Operator Desk stays `/app`.
**Specs:** `owner-portal`. **Depends on:** phase-21, phase-20.
**Folder:** [`phase-24-owner-ui/`](phase-24-owner-ui/)

## Phase 20 — Role-Based Portals ✅
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
**Folder:** [`phase-20-role-based-portals/`](phase-20-role-based-portals/)

---

## Traceability
Every phase proposal MUST list the exact baseline spec **Requirement** names it delivers, and every
`tasks.md` MUST map tasks back to those requirements so coverage is verifiable at phase close.
