## Context

Event Booking stores `venue_address` / `venue_geo` as free text. Run sheets copy those strings. Stripe preauth already exists as `billing.create_damage_hold` / `capture_hold` / `release_hold` (staff-only). Contracts e-sign exists for service agreements, not liability waivers. There is no Venue, Vendor, COI, or Policy DocType. Isolation is site-per-tenant. Money must stay `flt` plus backend-formatted strings.

Stakeholders: owner, dispatcher, crew, EE Customer, EE Event Guest. Guests never become payers.

## Goals / Non-Goals

**Goals:**
- Owner saves venues and vendors without Desk; picking a venue fills the job and run sheet.
- COI-required venues flag the job until a certificate file is attached.
- Client signs a required waiver with the same audit style as contracts.
- Damage holds reuse existing Stripe preauth; owner sees held/captured/released as strings.
- Referrals and overflow vendor assignments live on this tenant only.

**Non-Goals:**
- Maps/routing OAuth (phase 13).
- External per-event insurance carrier (insure.events).
- Paying subcontractors through payroll / Stripe Connect (phase 3/5 payouts).
- Importing venue CSV (phase 18).
- Desk as the primary UI.

## Decisions

### D1 — New DocTypes; snapshot address on the booking
**EE Venue**: `venue_name`, `venue_type`, `address`, `geo`, `capacity`, `load_in_notes`, `parking_notes`, `power_notes`, `noise_curfew`, `setup_restrictions`, `wifi`, `preferred`, `coi_required`, `maps_link`, `service_area` (Link), `notes`; child **EE Venue Contact** (name, role, phone, email).
**Event Booking**: Link `venue`; keep `venue_address` / `venue_geo` as snapshots copied on save so history does not rewrite when the venue later changes. Copy logistics fields onto the booking (`load_in_notes`, `parking_notes`, `power_notes`, `noise_curfew`) for run sheet even if the venue row is later edited.
**Alt:** only store address on booking. **Rejected** — no reuse, no COI flag.

### D2 — Vendors are not ERPNext Supplier
**EE Vendor**: `vendor_name`, `category`, `preferred`, `rating`, `notes`, `w9_on_file`, `coi_on_file`, `subcontractor`, `default_pay_terms`; child **EE Vendor Contact**.
**EE Referral**: `direction` (`received|sent`), `vendor`, `lead` / `booking`, `status`, `commission` (Currency, `flt`), `notes`.
**EE Vendor Assignment**: `booking`, `vendor`, `role`, `agreed_cost` (Currency), `status` (`planned|confirmed|canceled`).
**Alt:** reuse Supplier. **Rejected** — buying/stock vs partner coordination; UI labels would leak accounting.

### D3 — Compliance DocTypes; wrap billing holds
**EE Insurance Policy**: `provider`, `policy_number`, `coverage`, `effective_on`, `expires_on`, `file` (Attach), `active`.
**EE Certificate of Insurance**: `booking`, `venue`, `status` (`requested|issued|delivered`), `additional_insured`, `file`, `issued_on`.
**EE Waiver Template**: `title`, `body` (Text Editor), `event_types` (Data, comma or empty = all), `active`.
**EE Waiver**: `booking`, `template`, `status` (`pending|signed`), `signer_name`, `signer_email`, `signed_at`, `signature_hash`, `signer_ip`.
Damage deposit: do **not** add a second processor path. Staff call existing `create_damage_hold` / `capture_hold` / `release_hold`. Store `ee_damage_hold_invoice` + `ee_damage_hold_status` (`none|held|captured|released|forfeited`) on Event Booking. Amounts never computed in the SPA.

### D4 — Per-event insurance is a booking flag
`ee_event_insurance` Check + `ee_event_insurance_amount` Currency on Event Booking / quote extras. Owner can toggle; client can opt in from pay/proposal only as a recorded choice. No carrier API this phase.

### D5 — Portals
| Surface | Route | Who |
|---|---|---|
| Places | `/owner/places` | owner CRUD venues |
| Partners | `/owner/partners` | vendors + referrals |
| Coverage | `/owner/coverage` | policies, COI list, waiver templates, expiry |
| Job | existing job editor | pick venue, vendors, COI, waiver, hold |
| Run sheet | employee field | logistics + other vendors |
| Documents | `/client/documents` | pending waivers next to contracts |

No DocType names in copy. Guests 403 on waiver sign, holds, and vendor pay.

### D6 — Notifications
Templates: `coi_required`, `policy_expiring`, `waiver_needed`. Daily job like appointments, gated by automations toggles. `notifications.send`; missing Twilio returns.

### D7 — Files
| Area | Path |
|---|---|
| APIs | `api/venues.py`, `api/vendors.py`, `api/compliance.py` |
| DocTypes | `entertainment_express_core/doctype/ee_venue`, `ee_venue_contact`, `ee_vendor`, `ee_vendor_contact`, `ee_referral`, `ee_vendor_assignment`, `ee_insurance_policy`, `ee_certificate_of_insurance`, `ee_waiver_template`, `ee_waiver` |
| Booking | Event Booking fields + patch `patches/v0_0_3/phase17_venue_compliance.py` |
| Portals | owner/employee/customer `App.tsx` |
| Tests | `tests/test_phase17_venues_vendors.py` |

## Risks / Trade-offs

- [Venue edit rewrites past jobs] → snapshot address + logistics on booking at link time.
- [Hold without Stripe] → existing throw “Connect Stripe”; do not fake money.
- [Waiver vs contract confusion] → separate DocType; client copy says “waiver”, not “contract”.
- [Commission stored as currency] → `flt` only; display via `fmt_money`.

## Migration Plan

1. DocTypes + Event Booking fields + patch; migrate tenant sites.
2. APIs + SPA rebuild; bump bench image (`0.0.61-ee` → `0.0.62-ee`).
3. Rollback: hide Places/Partners/Coverage nav; rows remain; jobs keep snapshots.

## Open Questions

- None blocking. Maps stay a pasted `maps_link`. Carrier insurance waits for a later integrations slice.
