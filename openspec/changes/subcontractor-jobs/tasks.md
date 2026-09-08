## 1. DocType & Data Model

- [ ] 1.1 Create `EE Subcontract Job` DocType schema in `entertainment_express_core/doctype/ee_subcontract_job/ee_subcontract_job.json` with fields for booking, vendor, status, agreed_cost, client_price, expected_margin, margin_percent, pay_terms, white_label, offer_token, and timestamps.
- [ ] 1.2 Implement Python controller `ee_subcontract_job.py` computing expected margin and margin percentage via `flt` on validate.
- [ ] 1.3 Add `EE Subcontract Job` to modules list / fixtures and verify permissions for `EE Tenant Admin`, `EE Dispatcher`, and `System Manager`.

## 2. Backend APIs & Workflow Engine

- [ ] 2.1 Implement `entertainment_express/api/subcontractors.py` with `list_subcontractors` returning active subcontractor partner companies, rating, and COI/W-9 status.
- [ ] 2.2 Implement `list_subcontract_jobs` supporting status, vendor, and booking filters with backend-formatted money values (`fmt_money`).
- [ ] 2.3 Implement `create_subcontract_job` with compliance check (warning if COI expired), auto-populating client price from the booking and calculating expected profit margin.
- [ ] 2.4 Implement `send_subcontract_offer` generating a secure UUID token and dispatching offer notification to the partner company.
- [ ] 2.5 Implement `complete_subcontract_job` and payout tracking hooks.

## 3. External Offer Review & Acceptance Flow

- [ ] 3.1 Implement guest-safe API `get_subcontract_offer(token)` returning sanitized event schedule, venue access notes, payout amount, and payment terms (respecting white_label masking).
- [ ] 3.2 Implement guest-safe API `respond_subcontract_offer(token, action, decline_reason)` allowing partner companies to accept or decline the offer.
- [ ] 3.3 Add owner notification alert (email/SMS/inbox) triggered upon partner company acceptance or decline.

## 4. Owner Portal Subcontractor Workspace

- [ ] 4.1 Create `/owner/subcontractors` route in `frontend/owner-portal/src/app/routes/subcontractors/` with tabs for Overview/Active Jobs, Partner Directory, and Margin Analytics.
- [ ] 4.2 Build Subcontractor Directory component displaying company cards with W-9/COI compliance badges, contact info, and "Sub Out Job" action.
- [ ] 4.3 Build Active Subcontracts table with status chips (`draft`, `offered`, `accepted`, `in_progress`, `completed`), client revenue vs cost, and profit margin pill.
- [ ] 4.4 Add Subcontractors to the Owner Portal navigation sidebar and global command palette (⌘K).

## 5. Booking & Dispatch Integration

- [ ] 5.1 Add "Sub Out Job" modal dialog accessible from the Booking Drawer in `/owner/pipeline` and `/owner/dispatch`.
- [ ] 5.2 Pre-fill booking date, venue, and client price in the sub-out modal, with partner vendor selection and agreed cost inputs.
- [ ] 5.3 Show subcontractor assignment badge and quick link on the Event Booking detail view.

## 6. Automated Testing & Isolation Verification

- [ ] 6.1 Write unit tests in `entertainment_express/tests/test_subcontractors.py` covering sub-out creation, margin calculation, offer token generation, and accept/decline state transitions.
- [ ] 6.2 Write multi-tenant isolation test verifying that subcontractor directories and subbed jobs are strictly confined to their own Frappe tenant site.
- [ ] 6.3 Run smoke test suite and baseline spec validation (`openspec validate --specs`).
