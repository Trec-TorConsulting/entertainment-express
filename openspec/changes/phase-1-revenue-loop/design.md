# Design: Phase 1 — Revenue Loop (MVP)

> Prereq: phase-0 complete. Read `openspec/project.md` §4 (multi-tenancy), §7 (Frappe conventions), and the
> baseline specs for each capability below. Reuse ERPNext DocTypes; only create new DocTypes for
> EE-specific concepts. All money flows through ERPNext documents.

---

## A. Data model (DocTypes)

### Reused ERPNext DocTypes (extend with Custom Fields via fixtures)
- **Item** → Service Item fields: `ee_item_type` (Select: service/rental/package/addon), `ee_vertical_tag`,
  `ee_duration_minutes`, `ee_unit` (event/hour/day/unit), `ee_requires_asset` (Check),
  `ee_requires_crew_role` (Link: EE Crew Role), `ee_setup_minutes`, `ee_teardown_minutes`.
- **Quotation** → EE Quote fields: `ee_event_date`, `ee_event_start`, `ee_event_end`, `ee_venue_address`,
  `ee_venue_geo`, `ee_service_area` (Link), `ee_travel_fee`, `ee_deposit_percent`, `ee_booking` (Link).
- **Sales Invoice** → `ee_booking` (Link), `ee_is_deposit` (Check), `ee_event_date`.
- **Customer/Contact** → `ee_source`, `ee_lead` (Link).

### New EE DocTypes
| DocType | Module | Key fields |
|---------|--------|-----------|
| **EE Crew Role** | Entertainment Express Core | role_name (DJ, Attendant, Driver, Performer...), description |
| **Service Package** | Service Catalog | package_name, items (child: item, qty), package_price, active |
| **Service Asset** | Service Catalog | asset_name, asset_type(Select), identifier, status(available/maintenance/retired), quantity(Int, for pools), home_location, linked_items(child), images(attach) |
| **Service Area** | Service Catalog | area_name, match_type(zip_list/radius/polygon), zips(Small Text)/center_geo+radius_km, travel_fee(Currency), min_order(Currency), active |
| **Event Booking** | Booking | booking_no(naming), customer(Link), contact(Link), status(Select: inquiry/quoted/tentative/confirmed/in_progress/completed/canceled), event_date, start_time, end_time, timezone, venue_address, venue_geo, service_items(child), assigned_assets(child: asset), addons(child), grand_total, deposit_amount, deposit_status(Select: none/invoiced/paid), balance_due, contract(Link), quotation(Link), source(Select: portal/staff/import), notes |
| **Event Booking Hold** | Booking | resources(child: asset), event_window(start,end), expires_at(Datetime), token, converted(Check) |
| **EE Contract** | Entertainment Express Core | quotation(Link), booking(Link), template(Link: EE Contract Template), rendered_html(Text Editor), signer_name, signer_email, signature_image(Attach)/signature_typed, signed_ip, signed_at, content_hash, status(Select: draft/sent/viewed/signed/declined/expired), expires_at |
| **EE Contract Template** | Entertainment Express Core | template_name, body(Jinja HTML), active |
| **Tenant** (control plane) | Control Plane | tenant_slug(unique), company_name, status(pending/provisioning/active/suspended/deprovisioning/deleted), site_name, plan(Link), primary_contact, activated_on |
| **Provisioning Job** (control plane) | Control Plane | tenant(Link), action(create/suspend/resume/deprovision), state(queued/running/succeeded/failed), log(Long Text), attempts(Int), provider_ref |
| **Plan** (control plane) | Control Plane | plan_name, code, price_monthly, currency, trial_days, entitlements(child: feature_key, limit_value), status |
| **Signup Application** (control plane) | Control Plane | company_name, requested_slug, contact_email, plan(Link), status(new/approved/rejected/provisioned) |

> Child DocTypes (e.g., `Event Booking Item`, `Event Booking Asset`, `Service Package Item`,
> `Plan Entitlement`, `Service Asset Linked Item`) are created alongside their parents.

---

## B. Tenant provisioning (control plane)

Runs on `admin.{base_domain}`. Flow:
1. **Signup Application** created (public signup form in `www/signup.html` or operator-created).
2. On **approve**, create a `Tenant` (status `provisioning`) + a `Provisioning Job` (action `create`,
   state `queued`) and `frappe.enqueue` the provisioner.
3. **Provisioner** (background) executes idempotently:
   - Validate slug (DNS-safe, not reserved `admin|www|api`, unique). Reject early.
   - Create site: `bench new-site {slug}.app.{base_domain} --db-host mariadb ...` (skip if exists).
   - `bench --site ... install-app erpnext entertainment_express` (skip installed).
   - **Tenant bootstrap** (`entertainment_express.control_plane.bootstrap.run(site)`): create/ensure EE
     roles + permissions, an ERPNext Company, default Service Area, a **starter service catalog** (a few
     example Service Items + one Package per common vertical), an admin user for the tenant, email defaults.
   - Set `host_name`; ensure ingress wildcard already covers it (no per-site ingress needed).
   - Mark `Provisioning Job` `succeeded`, `Tenant` `active`, send welcome email.
   - Any step failure → `state=failed` with log; retry re-runs and skips completed steps (idempotent).

> **Isolation rule:** the provisioner is the ONLY control-plane code that touches tenant sites, and only
> via `bench`/`frappe.init(site=...)` in an isolated context. No tenant feature code ever crosses sites.

---

## C. Service catalog

- Service Items are ERPNext Items with EE custom fields; expose via `api/catalog.py`
  (`list_service_items`, CRUD wrappers). Packages/Assets/Areas are EE DocTypes with standard Frappe CRUD.
- **Availability check** (`entertainment_express.booking.availability.check(asset, start, end)`):
  - Unique asset (quantity ≤ 1): conflict if any `Event Booking` (status in tentative/confirmed/in_progress)
    or active `Event Booking Hold` overlaps `[start - setup - travel, end + teardown + travel]`.
  - Pool asset (quantity > 1): count overlapping commitments; available if `< quantity`.
- **Travel fee**: resolve `Service Area` by venue (zip match for MVP; radius/polygon optional), add its
  `travel_fee` to the quote; block or flag if venue matches no area (tenant policy flag).

---

## D. CRM → quote → contract → booking

- **Lead:** ERPNext Lead + public form `www/request-quote.html` → creates Lead (source `booking_site`),
  notifies assigned Sales user (email). Convert Lead → Opportunity → Customer/Contact (ERPNext flow).
- **EE Quote:** ERPNext Quotation + EE fields. `api/quote.py`:
  - `build_quote(...)` adds service items/packages/add-ons, computes travel fee + taxes + total + deposit
    (`ee_deposit_percent` of total). Money via `frappe.utils.flt`.
  - `render_quote_pdf(quote)` → branded PDF (Frappe Print Format).
  - `send_quote(quote)` → email a view/accept link; status `sent`; schedule a follow-up reminder if no
    response in N days (scheduler).
  - At build/accept, call availability check for any specific asset referenced; flag conflicts.
- **EE Contract:** generated from `EE Contract Template` (Jinja) for an accepted quote.
  - `send_contract` emails a secure signing link (tokenized web page `www/sign.html?token=...`).
  - Signing page captures typed/drawn signature; `sign_contract` stores signature, `signer_ip`, `signed_at`,
    and `content_hash = sha256(rendered_html + signer + timestamp)`; status `signed`; email executed PDF to
    both parties.
  - Expiry/decline handled by status + scheduler.
- **Convert to booking:** on contract `signed` (or accepted quote per tenant policy),
  `convert_to_booking(quote/contract)` creates an `Event Booking` (status `confirmed` after deposit, or
  `tentative` before) copying event fields, service items, and referenced assets; then triggers deposit
  invoicing (§F).

---

## E. Booking & availability + public site

- **Public booking site** (`www/book.html` + `www/request-quote.html`): tenant-branded (reads tenant
  company/logo/service catalog/areas/policies). Two flows:
  - *Quote-only / custom:* creates Lead + `tentative` Event Booking, routes to Sales.
  - *Self-book (if item flagged self-bookable):* pick date → availability check → create **Event Booking
    Hold** (TTL, e.g., 15 min) → collect deposit (Stripe, §F) → on payment success convert hold to
    `confirmed` Event Booking; on hold expiry release resources.
- **Holds (race safety):** creating a hold reserves resources; availability check counts active holds.
  Concurrency: use a DB row lock / `frappe.db.get_value(..., for_update=True)` when creating a hold against
  a unique asset so only one checkout wins.
- **Calendar view:** a Frappe Calendar/report view of Event Bookings by date and by asset.

---

## F. Billing & payments (Stripe deposit)

- On booking confirmation (or during self-book checkout), create a **deposit Sales Invoice**
  (`ee_is_deposit=1`, amount = `deposit_amount`) via ERPNext so the GL is correct.
- **Stripe:** `api/payments_stripe.py`:
  - `create_checkout(invoice)` → Stripe Checkout Session / PaymentIntent for the deposit; return client URL/
    secret. Store `provider_txn_id`.
  - **Webhook** `www/api/stripe_webhook` (or whitelisted endpoint): verify signature, **dedupe by Stripe
    event id** (store processed event ids), and on `checkout.session.completed`/`payment_intent.succeeded`
    create an ERPNext **Payment Entry** against the invoice, set `deposit_status=paid`, set Event Booking
    `confirmed`, and enqueue confirmation + receipt emails. Idempotent: repeated events are no-ops.
- Credentials from K8s secret (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) per tenant (tenant BYO keys
  stored encrypted in an `Integration Config` — minimal version here).

---

## G. Notifications (email only)

- `entertainment_express.notifications.send(template_key, recipient, context)` renders a
  `Notification Template` and enqueues an email via Frappe email (SMTP from secret). Templates: `quote_sent`,
  `contract_sent`, `contract_signed`, `booking_confirmed`, `deposit_receipt`, `lead_assigned`.
- All sends are `frappe.enqueue`d (never block web requests).

---

## H. APIs (whitelisted, under `entertainment_express/api/`)

| Module | Endpoints (illustrative) |
|--------|--------------------------|
| `catalog.py` | CRUD service items/packages/assets/areas; `check_availability` |
| `quote.py` | `build_quote`, `render_quote_pdf`, `send_quote`, `accept_quote` |
| `contract.py` | `create_contract`, `send_contract`, `sign_contract` |
| `booking.py` | CRUD Event Booking; `create_hold`; `convert_to_booking`; `reschedule`; `cancel` |
| `payments_stripe.py` | `create_checkout`; `stripe_webhook` |
| `public.py` (in `www/`) | `submit_lead`; `submit_booking_request`; public catalog/availability |
| control plane `provision.py` | `submit_signup`; `approve_signup`; provisioning status |

Follow ERPNext REST conventions; 404/`DoesNotExistError` on missing; enforce role permissions server-side.

---

## I. Testing (mandatory)

- **Multi-tenant isolation test:** provision two test tenants; create a booking in each; assert tenant A's
  API/portal cannot read tenant B's booking/quote/invoice.
- **Availability test:** unique asset double-book blocked; pool asset blocks beyond quantity; buffer gap
  enforced.
- **Money test:** quote totals + deposit computed correctly; deposit invoice + payment entry balance the GL;
  Stripe webhook is idempotent (double delivery → one payment entry).
- **Contract test:** signature stored with audit fields + hash; status transitions correct.
- **Provisioning idempotency test:** re-running a partially-failed job converges without duplicates.

## J. Deployment additions
- Add a provisioning worker (reuse phase-0 workers or a dedicated `frappe-provisioner` deployment with
  `bench` privileges) + `stripe-secret.yaml` (template) + SMTP config in the ConfigMap/Secret.
- Create the control-plane site `admin.{base_domain}` (install erpnext + entertainment_express) via a Job.
