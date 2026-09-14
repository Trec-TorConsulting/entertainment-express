## 1. Data Model & DocTypes

- [x] 1.1 Create `Event Cost Sheet` DocType (`entertainment_express/doctype/event_cost_sheet/`) with fields: `event_booking`, `cost_center`, `project`, `gross_revenue`, `labor_cost`, `subcontractor_cost`, `consumable_cost`, `equipment_wear_cost`, `gateway_fees`, `total_cogs`, `net_profit`, `margin_percent`, `margin_status`.
- [x] 1.2 Add Custom Fields to `Event Booking`: `cost_center` (Link to Cost Center), `project` (Link to Project), `cost_sheet` (Link to Event Cost Sheet), `target_margin_percent` (Percent).
- [x] 1.3 Add tenant-level default margin targets to `EE Portal Settings` (`default_target_margin_percent`, `low_margin_warning_threshold`).

## 2. ERPNext Cost Center & Project Provisioning

- [x] 2.1 Implement `ensure_event_cost_center_and_project(booking)` in `entertainment_express/job_costing/provisioning.py` to auto-create ERPNext `Cost Center` and `Project` records upon booking confirmation.
- [x] 2.2 Wire booking lifecycle hooks (`on_submit` and `validate`) in `Event Booking` controller to call provisioning and link references.

## 3. Cost Rollup Engine & Ledger Synchronization

- [x] 3.1 Implement `recompute_event_cost_sheet(booking_name)` in `entertainment_express/job_costing/cost_engine.py` calculating revenue from submitted `Sales Invoice` records.
- [x] 3.2 Aggregate direct labor costs from approved `Timesheet` records and `Crew Assignment` gig fees linked to the booking project.
- [x] 3.3 Aggregate subcontractor expenses from `Purchase Invoice` and `Purchase Order` documents matching the booking project.
- [x] 3.4 Aggregate consumable stock costs from `Stock Entry` (Material Issue) records charged to the booking cost center.
- [x] 3.5 Calculate equipment wear amortization based on booked asset hourly/flat wear rates.
- [x] 3.6 Capture gateway processing fee deductions from `Payment Entry` and Stripe/Square webhook payloads.
- [x] 3.7 Compute `net_profit` and `margin_percent`, assigning `margin_status` (`healthy`, `warning`, `critical`).

## 4. API Endpoints

- [x] 4.1 Implement `get_event_pl(booking_name)` in `entertainment_express/api/job_costing.py` returning structured revenue, categorized expenses, profit, and margin breakdown.
- [x] 4.2 Implement `list_events_margin_summary()` in `entertainment_express/api/job_costing.py` supporting date filters, status filters, and low-margin sort.
- [x] 4.3 Implement `set_event_margin_target(booking_name, target_percent)` with permission validation for `EE Tenant Admin`.

## 5. Owner Portal UI Integration

- [x] 5.1 Build `EventPLDrawer` component in `frontend/owner-portal/src/app/routes/money/components/EventPLDrawer.tsx` displaying interactive breakdown bars, revenue vs COGS pie/donut, and itemized ledger lines.
- [x] 5.2 Build `MarginHealthBadge` in `frontend/portal-kit/src/components/MarginHealthBadge.tsx` with color-coded status pills.
- [x] 5.3 Integrate `MarginHealthBadge` and "Inspect P&L" action drawer triggers into `/owner/money` and `/owner/pipeline` booking tables.

## 6. Testing & Multi-Tenant Verification

- [x] 6.1 Add unit tests in `entertainment_express/tests/test_job_costing.py` covering cost rollup math, zero-division safeguards, and margin status transitions.
- [x] 6.2 Add multi-tenant isolation tests confirming that Cost Centers, Projects, and Cost Sheets are strictly isolated per site database.
- [x] 6.3 Run `python3 smoke_test.py` to confirm all syntax, DocTypes, and OpenSpec checks pass.
