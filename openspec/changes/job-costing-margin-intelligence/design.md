## Context

Entertainment Express already orchestrates quotes, bookings, crew assignments, timesheets, and invoices. However, financial profitability is currently evaluated only at the macro tenant level (via standard ERPNext General Ledger reports). Operators lack real-time visibility into per-booking margin variance. When an event requires additional crew hours, unexpected sub-rentals, or specialized consumables, the operator does not discover margin erosion until weeks later.

ERPNext has built-in primitives for job costing (`Cost Center`, `Project`, `Sales Invoice`, `Purchase Invoice`, `Timesheet`, `Stock Entry`). By structuring each `Event Booking` as an ERPNext `Project` and `Cost Center`, we enable native double-entry ledger rollup of all revenue and expenses, while providing a modern, cached P&L summary layer for the `/owner` React portal.

## Goals / Non-Goals

**Goals:**
- Automatically provision an ERPNext `Cost Center` and `Project` for each confirmed `Event Booking`.
- Automatically roll up 5 distinct cost pillars:
  1. Direct Labor (crew timesheets, wage rates, gig fees).
  2. Subcontractors & Sub-Rentals (vendor purchase orders / invoices linked to project).
  3. Consumable Depletion (material issue valuation rates).
  4. Equipment Wear & Amortization (per-booking wear charges).
  5. Payment Gateway Fees (Stripe / Square transaction fees recorded from webhooks).
- Compute live Net Profit ($) and Margin Percentage (%) on every financial mutation.
- Expose an interactive Event P&L Drawer and Margin Badge in `/owner/money` and `/owner/pipeline`.
- Maintain strict multi-tenant database isolation.

**Non-Goals:**
- Replacing ERPNext's General Ledger or creating a secondary accounting engine. All financial records must flow through ERPNext's official accounting documents.
- Overriding payroll disbursement. This phase tallies labor costs for job costing; actual payroll batching is addressed in the gig payroll phase.

## Decisions

### 1. Unified Event Cost Sheet DocType
- **Choice**: Introduce `Event Cost Sheet` as a child or linked DocType on `Event Booking`.
- **Rationale**: While ERPNext's `GL Entry` table holds the granular ledger lines, querying `GL Entry` joined across timesheets, purchase invoices, and stock entries on every portal load introduces high latency. The `Event Cost Sheet` DocType stores cached, materialized rollups (gross_revenue, labor_cost, subcontractor_cost, consumable_cost, equipment_wear_cost, gateway_fees, net_profit, margin_percent) updated synchronously or via background hook on relevant document submits.

### 2. Auto-Provisioning Cost Centers & Projects
- **Choice**: Hook `Event Booking` lifecycle (`validate` and `on_submit` / `on_update`).
- **Rationale**: When an event booking is created, ensure an ERPNext `Project` (`{booking.name} - {booking.event_name}`) and a child `Cost Center` under the tenant's primary operating cost center are created if they do not already exist. Tag all downstream invoices, timesheets, and purchase orders with both `project` and `cost_center`.

### 3. Payment Gateway Fee Capture
- **Choice**: Extend webhook handlers (`stripe.py`, `square.py`) to parse fee breakdown objects and write a `Payment Entry` deduction or `Journal Entry` to the Gateway Charges account, tagged with the booking's `Cost Center`.
- **Rationale**: Card fees consume 3–4% of revenue on average. Failing to account for gateway deductions inflates apparent margins.

### 4. Portal UI Architecture
- **Choice**: Add an `EventPLDrawer` component in `@portal-kit` / `/owner-portal` using Tailwind + Radix Dialog, invoked from `/owner/money` and `/owner/pipeline`.
- **Rationale**: Keeps the owner inside the modern React SPA without ever opening ERPNext Desk `/app`.

## Technical Architecture & File Map

1. **DocTypes**:
   - `entertainment_express/doctype/event_cost_sheet/event_cost_sheet.json`
   - `entertainment_express/doctype/event_cost_sheet/event_cost_sheet.py`
   - Custom field fixture on `Event Booking`: `cost_center`, `project`, `cost_sheet_ref`, `estimated_margin`, `actual_margin`.
2. **Backend Services & API**:
   - `entertainment_express/job_costing/cost_engine.py`: Core calculation logic (`recompute_event_cost_sheet(booking_name)`).
   - `entertainment_express/job_costing/hooks.py`: Listeners on `Timesheet`, `Purchase Invoice`, `Stock Entry`, `Payment Entry`.
   - `entertainment_express/api/job_costing.py`: REST endpoints:
     - `get_event_pl(booking_name)`
     - `list_events_margin_summary()`
     - `set_margin_target(target_percent)`
3. **Frontend Components (`frontend/owner-portal/`)**:
   - `src/app/routes/money/components/EventPLDrawer.tsx`
   - `src/app/routes/money/components/MarginHealthBadge.tsx`
   - `src/app/routes/pipeline/components/PipelineMarginColumn.tsx`

## Risks / Trade-offs

- **[Risk] Performance drag on frequent ledger mutations**:
  - *Mitigation*: Calculation is lightweight arithmetic reading indexed totals; updates run via queued jobs (`frappe.enqueue`) when batched timesheets or invoices submit, preventing HTTP request blocking.
- **[Risk] Subcontractor invoice arrives weeks after event conclusion**:
  - *Mitigation*: The Cost Sheet supports `estimated_cost` alongside `actual_cost`. Initial margins display estimated costs from purchase orders until the final vendor bill is submitted and reconciled.
- **[Risk] Multi-tenant data leakage**:
  - *Mitigation*: Strict Frappe site-per-tenant isolation. All queries filter by `frappe.db.get_value` within current site session; automated isolation test verifies cross-site impossibility.
