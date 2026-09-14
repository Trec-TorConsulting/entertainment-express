## Context

Compensation in live mobile entertainment rarely conforms to standard 9-to-5 bi-weekly salary models. Workers range from W2 hourly drivers and warehouse staff to 1099 independent DJs, magicians, photo booth operators, and commission-based event sales reps. Customer gratuities (tips) collected digitally via Stripe or Square checkouts add further complexity, often requiring manual division based on on-site attendance.

ERPNext has an enterprise-grade payroll suite (`Salary Structure`, `Salary Component`, `Salary Slip`, `Payroll Entry`, `Timesheet`). This design bridges the gap between Entertainment Express's live event operations and ERPNext's accounting-backed payroll engine: automatically translating gig assignments, sales closures, and customer tips into verified ERPNext salary components.

## Goals / Non-Goals

**Goals:**
- Provide multi-tiered `Gig Rate Card` logic (flat fee by duration/event type, hourly base, role differential, overtime).
- Automate sales commission calculation upon client invoice payment with configurable percentage rules.
- Implement automated post-event digital tip splitting across assigned crew using configurable algorithms (Equal, Hours-Weighted, Lead-Weighted).
- Support one-click post-gig payroll batch compilation into draft ERPNext `Salary Slip` and `Payroll Entry` records.
- Provide full earnings transparency for crew in `/employee` and the mobile Field PWA.

**Non-Goals:**
- Direct automated banking/NACHA ACH clearing or direct deposit wire execution in this phase (records generate payroll entries for export to QuickBooks, Gusto, ADP, or direct check printing).
- Automatic tax withholding compliance calculations for federal/state jurisdictions (relying on ERPNext's standard tax rule tables or third-party payroll sync).

## Decisions

### 1. Mapping Earnings to ERPNext Salary Components
- **Choice**: Represent gig earnings as standard ERPNext `Salary Component` items:
  - `Gig Base Pay` (Earning)
  - `Gig Overtime` (Earning)
  - `Booking Commission` (Earning)
  - `Client Tip Share` (Earning)
- **Rationale**: Keeps all earnings compliant with ERPNext payroll ledgers, allowing standard tax deductions, journal entries, and payroll expense bank transfers to function natively.

### 2. Digital Tip Pool Lifecycle
- **Choice**: Model tip collection as a separate `Tip Distribution` DocType linked to the `Event Booking`.
- **Rationale**: Clients frequently tip at different stages (during deposit checkout, final balance payment, or via post-event review link). Storing tips in a distinct pool ensures that tip additions dynamically update the pending allocation until payroll is locked.

### 3. Commission Accrual on Payment vs Creation
- **Choice**: Commissions accrue only when the customer's `Sales Invoice` transitions to `Paid` (or upon payment entry submission).
- **Rationale**: Prevents paying sales reps on uncollected bad debt or cancelled events.

## Technical Architecture & File Map

1. **DocTypes**:
   - `entertainment_express/doctype/gig_rate_card/gig_rate_card.json`
   - `entertainment_express/doctype/commission_rule/commission_rule.json`
   - `entertainment_express/doctype/tip_distribution/tip_distribution.json`
   - `entertainment_express/doctype/tip_allocation_line/tip_allocation_line.json` (child table)
2. **Backend Services & API**:
   - `entertainment_express/payroll/rate_engine.py`: Computes worker gig earnings from timesheets and rate cards.
   - `entertainment_express/payroll/commissions.py`: Handles sales commission calculations on invoice payment.
   - `entertainment_express/payroll/tip_splitter.py`: Executes tip pool distribution algorithms.
   - `entertainment_express/payroll/payroll_compiler.py`: Batches event earnings into ERPNext `Payroll Entry` and `Salary Slip`.
   - `entertainment_express/api/payroll.py`: Endpoints:
     - `get_worker_earnings(worker_id, start_date, end_date)`
     - `preview_payroll_batch(start_date, end_date)`
     - `create_payroll_batch(start_date, end_date)`
     - `get_tip_summary(booking_id)`
3. **Frontend Surfaces**:
   - `frontend/owner-portal/src/app/routes/money/PayrollSettlementPage.tsx`
   - `frontend/owner-portal/src/app/routes/money/components/PayrollBatchModal.tsx`
   - `frontend/employee-portal/src/app/routes/earnings/MyEarningsPage.tsx`

## Risks / Trade-offs

- **[Risk] Disputed tip splits when a crew member arrives late**:
  - *Mitigation*: The `Tip Distribution` review screen in `/owner/money` allows the owner to manually adjust tip allocations prior to locking payroll, with an audit log of adjustments.
- **[Risk] Mixed W2 vs 1099 contractor workers**:
  - *Mitigation*: The payroll batch compiler filters and groups employees by employment type (`W2 Employee` vs `1099 Contractor`), generating standard salary slips for W2s and standalone payout ledgers for 1099s.
