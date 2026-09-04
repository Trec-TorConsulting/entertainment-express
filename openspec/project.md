# Project Context — Entertainment Express

> **READ THIS FIRST.** This file is the single source of truth for *what we are building*, *how it is
> structured*, and *the rules you must follow*. Every change proposal and every implementation task
> assumes you have read and internalized this document. If a spec and this file disagree, this file wins
> unless a change proposal explicitly overrides it.

---

## 1. What Entertainment Express Is

**Entertainment Express (EE)** is an enterprise-grade, multi-tenant **SaaS** ERP + CRM + operations
platform for **mobile entertainment companies** — businesses that bring entertainment *to* an event
location. It is the "all-in-one" back office and customer-facing system these companies run their entire
business on.

It is built as a **custom Frappe application on top of ERPNext**, deployed on a **K3S Kubernetes cluster**,
using a **site-per-tenant** multi-tenancy model (each customer company gets its own isolated Frappe site
and database).

### Who our customers are (the "tenant")
A tenant is a mobile-entertainment business. The platform must handle any mix of these service verticals
through **one generic, configurable engine** (not hard-coded per vertical):

- Mobile DJs / MCs (sound & lighting rigs)
- Inflatables / bounce houses / party rentals (delivery + setup + teardown)
- Photo booths / 360 booths (booth units + attendants + media delivery)
- Mobile game trucks / VR / arcades (vehicle-based gaming)
- Casino parties / karaoke / trivia (themed event entertainment)
- Face painters / performers / character actors (talent-based)

A single tenant will typically offer **several** of these at once. The domain model must therefore treat
"what we sell" as configurable **service/asset types**, never as fixed columns.

### Who the users are
- **SaaS Operator (us):** manages the control plane — provisions tenants, plans, billing, metering, health.
- **Tenant Admin/Owner:** runs their company on EE.
- **Tenant Staff:** sales, dispatch, accounting, marketing roles inside a tenant.
- **Field Crew / Talent:** W2 or 1099/gig workers who run events; primarily use the mobile app.
- **Customers (end clients):** book/pay via the customer portal and public booking site of a tenant.

---

## 2. Product Principles

1. **Enterprise-grade, best-in-class.** Assume this competes with and beats HoneyBook, Goodshuffle Pro,
   Rentman, Curate, and vertical DJ/rental tools combined. When in doubt, choose the more complete,
   more automated, more polished option.
2. **Generic engine, configurable per tenant.** No vertical is hard-coded. Everything (service types,
   pricing rules, workflows, forms) is data-driven.
3. **Automation-first.** Manual steps that can be automated (reminders, invoicing, dispatch, follow-ups,
   reviews) must be automated with sane defaults and tenant overrides.
4. **Multi-tenant isolation is sacred.** No tenant may ever see another tenant's data. Isolation is
   enforced at the *site/database* boundary (site-per-tenant), not just row-level permissions.
5. **Mobile-first for the field.** Crew workflows must work on a phone, offline-tolerant where practical.
6. **API-first.** Every capability is available via REST so the mobile app, portal, and integrations all
   consume the same contract.
7. **Auditable.** Money, contracts, and schedule changes are logged with who/when/what.

---

## 3. Tech Stack

### Application platform
- **Frappe Framework** (Python 3.11+, MariaDB, Redis, Node/Socket.IO) — the base web framework.
- **ERPNext** — reused for Accounting, Selling (Quotation/Sales Order/Invoice), Buying, Stock/Inventory,
  HR/Payroll primitives, and CRM primitives. We extend, we do not fork.
- **`entertainment_express`** — our **custom Frappe app** (the only app we author). All EE-specific
  DocTypes, controllers, APIs, portal pages, and web forms live here.
- **Frontend:**
  - Tenant desk UI = Frappe Desk (standard) for back-office power users.
  - Public booking site + customer portal + crew mobile app = Frappe web pages / Portal + a **PWA**
    (progressive web app) built with the Frappe web stack (or Frappe UI / Vue where richer UX is needed).
- **Background jobs:** Frappe workers + scheduler (RQ on Redis).
- **Realtime:** Frappe Socket.IO.

### Data & storage
- **MariaDB** — one logical database **per tenant site** (site-per-tenant).
- **Redis** — cache, queue, socketio (shared instances, logically namespaced by site).
- **Object storage (S3-compatible):** MinIO on the homelab (photos, contracts, media, booth galleries,
  backups). Bucket-per-tenant or prefixed keys per site.

### AI
- **Primary LLM backend:** local **Ollama** on the cluster GPU node (node05). Pluggable.
- **Optional providers:** OpenAI / Google Gemini via tenant-supplied API keys (BYO key).
- AI features must degrade gracefully (feature works, "AI suggestion unavailable" if backend is down).

### Integrations (external)
- **Payments:** Stripe (primary — customer payments *and* our SaaS subscription billing), Square, PayPal,
  ACH/bank transfer.
- **Comms:** SMTP/transactional email, **Twilio** (SMS + WhatsApp), **Firebase Cloud Messaging (FCM)**
  (mobile push).
- **Calendars:** Google Calendar / Microsoft 365 (two-way sync for crew & bookings), iCal feeds.
- **Maps/Routing:** Google Maps / Mapbox (dispatch routing, travel time, service-area checks).
- **E-signature:** native in-app e-sign (audit trail) with optional DocuSign.

### Infrastructure
- **Kubernetes:** K3S homelab cluster (see §8). Deployed via `k8s-deployment.yaml` in this repo (`scripts/deploy.sh` on an existing cluster).
- **Ingress:** Traefik (built into K3S) with **LetsEncrypt** wildcard TLS.
- **Storage class:** **Longhorn** (distributed) for all PersistentVolumeClaims.
- **Registry:** private registry `registry.maddscientist.com`.
- **Namespace:** `entertainment-express` (new, isolated — do NOT reuse the existing `frappe` namespace
  that serves www.trector.com).

---

## 4. Multi-Tenancy Model (CRITICAL)

**Model:** **Site-per-tenant** using Frappe's native multi-site bench.

- Each tenant company = one Frappe **site** = one MariaDB database, addressed by hostname.
- **Tenant URL:** `{tenant-slug}.<BASE_DOMAIN>` (wildcard DNS + wildcard TLS).
  - Example: `acmedjs.entx.app` (production `BASE_DOMAIN` = `entx.app`).
- **Control-plane site:** a dedicated site `admin.<BASE_DOMAIN>` runs the **SaaS control plane**
  (tenant provisioning, plans, metering, subscription billing). It is a tenant-like site but restricted to
  the SaaS Operator.
- **Marketing site:** `www.<BASE_DOMAIN>` + apex `<BASE_DOMAIN>` — the public product marketing site that
  sells EE to prospective tenants. Served by the control-plane site, Guest-facing. Spec'd in
  `openspec/specs/marketing-website/`. Tenant white-label kits do **not** apply here.
- **Tenant custom domains:** verified hostnames (phase 38+) map to the same site-per-tenant DB; portals
  and public book run on the company hostname with Traefik TLS.
- **Provisioning flow (automated):** signup on control plane → create site (`bench new-site`) → install
  `erpnext` + `entertainment_express` → run tenant bootstrap (roles, defaults, sample service catalog) →
  map hostname/ingress → send welcome. This must be a repeatable, idempotent job, not manual.
- **Isolation guarantee:** application code MUST NOT cross site boundaries. Any "across all tenants" data
  (usage metrics, billing) lives on the **control-plane site** and is aggregated via explicit, audited
  jobs — never by querying tenant DBs directly from tenant code.

> `<BASE_DOMAIN>` is a **configuration value**, not a literal. Default placeholder used throughout the
> specs: `entx.app`. The operator will point real public DNS at the Traefik ingress.

---

## 5. Repository & Code Layout

This workspace (`EntertainmentExpress/`) holds the **custom Frappe app source**, the **OpenSpec specs**,
the bench **Dockerfile**, and the **Kubernetes manifests** (`k8s-deployment.yaml`, applied with
`scripts/deploy.sh`).

```
EntertainmentExpress/
├─ openspec/                      # THIS spec system (source of truth for behavior)
│  ├─ project.md                  # you are here
│  ├─ specs/                      # baseline capability specs (target state, authoritative WHAT)
│  └─ changes/                    # phased change proposals (ROADMAP + phase-N/)
├─ entertainment_express/         # the custom Frappe app (created in phase-0)
│  └─ entertainment_express/
│     ├─ hooks.py
│     ├─ modules.txt
│     ├─ <module>/doctype/<doctype>/
│     ├─ api/
│     ├─ www/
│     ├─ public/
│     ├─ patches/
│     └─ tests/
├─ k8s-deployment.yaml            # namespace, data services, Frappe, ingress, Jobs
├─ scripts/deploy.sh              # existing-cluster apply (skips Jobs / MariaDB STS)
└─ secrets.example.yaml           # placeholders only
```

---

## 6. Domain Glossary (shared vocabulary — use these exact terms)

| Term | Meaning |
|------|---------|
| **Tenant** | A mobile-entertainment company that subscribes to EE. One Frappe site. |
| **Control Plane** | The SaaS Operator's site: provisioning, plans, metering, subscription billing. |
| **Service Item** | A sellable offering (a DJ package, a bounce-house rental, a 360 booth 3-hr block). Configurable. |
| **Asset** | A physical/bookable resource with finite availability (a specific inflatable unit, a booth, a truck, a DJ rig). Prevents double-booking. |
| **Talent / Crew** | A person who performs/delivers a service (DJ, attendant, performer, driver). W2 or 1099. |
| **Event / Booking** | A confirmed job at a date/time/location combining service items, assets, and crew. |
| **Lead → Opportunity → Quote → Contract → Booking → Invoice** | The core revenue funnel. |
| **Availability** | Whether a given asset/crew/service is bookable for a requested time+location. |
| **Service Area** | Geographic region a tenant serves; drives travel fees & booking eligibility. |
| **Package** | A bundle of service items sold together at a package price. |
| **Add-on** | An optional upsell attached to a booking (extra hour, fog machine, uplighting). |
| **Deposit / Retainer** | Partial upfront payment to confirm a booking. |
| **Dispatch** | Assigning crew + assets + vehicle to an event and issuing the run sheet. |
| **Run Sheet** | The crew's job packet: what/where/when, setup notes, client contacts, checklist. |
| **Planning Form** | A configurable, conditional questionnaire a client completes per event type (must-play/do-not-play, pronunciations, ceremony details). |
| **Timeline / Run-of-Show** | The client-facing event-day program/itinerary (grand entrance, first dance, toasts). Distinct from the crew Run Sheet. |
| **Music Selection** | A client/guest song choice for a booking (must-play, do-not-play, special moment, request). |
| **Venue** | A reusable location record with logistics (access/load-in, parking, power, curfew, contacts, COI requirement). |
| **Vendor / Partner** | An external vendor (photographer, planner, caterer, subcontractor DJ) for referrals/coordination/sub-rentals. |
| **Appointment** | A consultation/planning meeting self-booked against staff availability (distinct from an Event/Booking). |
| **Proposal** | A unified client flow combining package selection + quote + contract + deposit. |
| **COI** | Certificate of Insurance required by some venues; tracked per booking. |
| **White-label kit** | Company brand tokens (colors, fonts, logos, footer, mode) applied to tenant portals and public pages. |
| **Custom domain** | Verified tenant hostname served with Traefik TLS; canonical base for notification links. |
| **Style matcher** | Owner tool that suggests a white-label kit from a public website URL and/or logo (no HTML stored). |

---

## 7. Frappe Development Conventions (the implementing model MUST follow)

- **DocTypes** are the data model. Prefer DocTypes over ad-hoc tables. One DocType per entity; child tables
  for line items. Every DocType must declare an owning **module** inside `entertainment_express`.
- **Reuse ERPNext, don't reinvent.** Quotation, Sales Order, Sales Invoice, Payment Entry, Item, Customer,
  Contact, Employee, Stock/Warehouse, Timesheet already exist in ERPNext — extend them with **Custom
  Fields** (via fixtures) and controllers. Only create new DocTypes for genuinely EE-specific concepts
  (Asset availability, Event/Booking, Crew Assignment, Service Area, Booking Portal config, etc.).
- **Naming:**
  - DocType names: Title Case singular ("Event Booking", "Service Asset").
  - Fieldnames: `snake_case`.
  - Python modules/files: `snake_case`. App name: `entertainment_express`.
  - Roles: prefixed `EE ` (e.g., `EE Tenant Admin`, `EE Dispatcher`, `EE Crew`).
- **APIs:** whitelisted methods under `entertainment_express/api/`. Follow ERPNext REST conventions.
  Every resource exposes full CRUD unless it is a computed/read-only view or append-only log. Single-record
  reads/updates/deletes MUST 404 (or Frappe `DoesNotExistError`) on missing records.
- **Permissions:** enforce via Role Permissions + `permission_query_conditions` / `has_permission` hooks.
  Never rely on the UI hiding data.
- **Money:** use Frappe Currency fields and ERPNext accounting entries. Never float-math money in Python;
  use `frappe.utils.flt` with precision. All financial mutations go through ERPNext documents so ledgers
  stay correct.
- **Background work:** long/slow/external-IO tasks (emails, SMS, payment webhooks, provisioning, media
  processing) run via `frappe.enqueue` / scheduler, never inline in web requests.
- **Idempotency:** provisioning jobs, webhook handlers, and scheduled tasks must be idempotent (safe to
  re-run). Webhooks must dedupe by provider event id.
- **Secrets:** never hard-code. Read from site config / K8s secrets. Repo secret files are templates with
  placeholders only.
- **Migrations:** schema/data changes ship as Frappe **patches** listed in `patches.txt`, plus fixtures for
  roles/custom-fields/defaults so `bench migrate` reproduces state.
- **Tests:** each new DocType/controller/API gets at least a happy-path + one failure-path test under
  `tests/`. Multi-tenant isolation tests are mandatory for any cross-cutting feature.
- **Feature flags / plans:** gate premium capabilities behind the tenant's **Plan** (from control plane).
  Check entitlement server-side.

---

## 8. Infrastructure & Deployment Conventions (K3S)

Manifests live in this repo: `k8s-deployment.yaml`, applied with `scripts/deploy.sh` on an existing
cluster (skips one-shot Jobs and the live MariaDB StatefulSet). Fresh bootstrap can still apply the
full file after deleting completed Jobs.

- **YAML:** 2-space indent; order `apiVersion → kind → metadata → spec`; filenames `lowercase-hyphen.yaml`.
- **Namespace:** everything in `entertainment-express`. Dedicated namespace, isolated.
- **Resources:** every container declares CPU/memory **requests and limits**.
- **Labels:** `app.kubernetes.io/name`, `app.kubernetes.io/component`, `app.kubernetes.io/part-of: entertainment-express`.
- **Storage:** all PVCs use the **Longhorn** StorageClass.
- **Node scheduling (CRITICAL):**
  - **node05** is GPU-only, tainted `gpu-only:NoSchedule`. Only AI/GPU inference workloads target it
    (with the toleration + `runtimeClassName: nvidia`).
  - All other EE workloads MUST exclude node05 via node affinity. General workloads schedule on
    node01–04 (ARM64) and node06–07 (x86_64).
  - **Multi-arch images required** unless a workload is pinned to a specific arch/node.
- **Ingress:** Traefik, `ingressClassName: traefik`, entrypoints `web,websecure`, cert resolver
  `letsencrypt`. Use a **wildcard host** `*.app.<BASE_DOMAIN>` (+ `admin.<BASE_DOMAIN>`) routed to the
  Frappe python service (port 8000) and `/socket.io` to the socketio service (port 9000). Reuse the shared
  Traefik middlewares (redirect-https, gzip, security-headers).
- **Images:** built for Frappe bench (ERPNext + `entertainment_express`), pushed to `registry.maddscientist.com`.
- **Backups:** per-site MariaDB backups (Frappe `bench backup`) on a CronJob to MinIO; retain per policy.
- **Validation approach:** `kubectl describe` / `kubectl logs` / `kubectl exec` for manual validation, plus
  Frappe unit tests in CI where available.

---

## 9. Security & Compliance Baseline

- **AuthN:** Frappe session auth; enforce strong passwords, optional TOTP 2FA; API keys/tokens for
  integrations and mobile.
- **AuthZ:** least-privilege roles; server-side permission checks on every endpoint.
- **PII/PCI:** never store raw card data — tokenize via Stripe/Square/PayPal. Store only processor tokens.
- **Transport:** TLS everywhere (LetsEncrypt). No plaintext service exposure outside the cluster.
- **Tenant isolation:** verified by tests; no cross-site queries from tenant code.
- **Audit:** money movements, contract signatures, permission/role changes, and schedule changes are logged
  (who/when/what/before/after).
- **Webhooks:** verify provider signatures; dedupe by event id; process idempotently in the background.
- **OWASP Top 10:** validate/escape all input; parameterized queries only; CSRF protection on web forms;
  rate-limit auth and public booking endpoints.

---

## 10. How To Use These Specs (for the implementing model)

1. **Read this `project.md` fully.**
2. **Read `openspec/specs/`** — these are the authoritative capability specifications (the WHAT). Each
   capability = one folder with `spec.md` containing `Requirement` + `Scenario` blocks.
3. **Work phase by phase from `openspec/changes/ROADMAP.md`.** Phases **0–39** are archived. New work
   should start as a new change proposal (do not invent scope). Each archived `phase-N/` folder contains:
   - `proposal.md` — why + scope + which spec requirements this phase delivers.
   - `design.md` — the concrete technical approach (DocTypes, fields, APIs, manifests, file paths).
   - `tasks.md` — an ordered, checkable implementation checklist with acceptance criteria.
4. **Implement one task at a time.** Check it off. Run the acceptance check. Keep context clean.
5. **Never invent scope.** If a task is ambiguous, prefer the behavior described in the matching baseline
   spec requirement. If still unclear, stop and ask — do not guess on money, contracts, or tenant isolation.
6. **Definition of done for a phase:** all tasks checked, all referenced spec requirements demonstrably met
   (tests/manual validation), deployed to the `entertainment-express` namespace, and no cross-tenant leak.

---

## 11. Owner

**Tobey Rector** — Senior Business Technology Consultant, Trec-Tor Consulting. Homelab operator.
