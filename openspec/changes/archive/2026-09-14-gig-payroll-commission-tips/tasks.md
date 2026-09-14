## 1. DocTypes & Payroll Foundation

- [x] 1.1 Create `Gig Rate Card` DocType (`entertainment_express/doctype/gig_rate_card/`) with fields: `rate_card_name`, `role`, `event_type`, `calculation_type` (`flat_fee`, `hourly`, `flat_plus_hourly`), `base_rate`, `overtime_rate`, `standard_duration_hours`.
- [x] 1.2 Create `Commission Rule` DocType with fields: `rule_name`, `agent`, `commission_type` (`percent_gross`, `percent_profit`, `flat_per_booking`), `rate_value`.
- [x] 1.3 Create `Tip Distribution` DocType with fields: `event_booking`, `total_tip_pool`, `allocation_policy` (`equal`, `hours_weighted`, `lead_weighted`), `status` (`accruing`, `locked`, `paid`), and child table `Tip Allocation Line`.
- [x] 1.4 Seed default ERPNext `Salary Component` records: `Gig Base Pay`, `Gig Overtime`, `Booking Commission`, `Client Tip Share`.

## 2. Calculation Engines

- [x] 2.1 Implement `calculate_gig_earnings(assignment, timesheet)` in `entertainment_express/payroll/rate_engine.py` evaluating rate cards and overtime rules.
- [x] 2.2 Implement `accrue_booking_commission(invoice)` in `entertainment_express/payroll/commissions.py` triggered when a client invoice transitions to `Paid`.
- [x] 2.3 Implement `distribute_booking_tips(booking_id)` in `entertainment_express/payroll/tip_splitter.py` calculating individual shares based on policy.

## 3. Payroll Batch Compiler

- [x] 3.1 Implement `compile_payroll_batch(start_date, end_date)` in `entertainment_express/payroll/payroll_compiler.py` gathering verified timesheets, commissions, and tip lines into ERPNext `Salary Slip` drafts.
- [x] 3.2 Add validation preventing double-inclusion of timesheets or tips across overlapping payroll runs.

## 4. API Endpoints

- [x] 4.1 Implement `preview_payroll_batch(start_date, end_date)` in `entertainment_express/api/payroll.py` returning gross payout estimates by worker.
- [x] 4.2 Implement `submit_payroll_batch(start_date, end_date)` generating submitted ERPNext `Payroll Entry` and linked `Salary Slip` records.
- [x] 4.3 Implement `get_my_earnings(start_date, end_date)` returning itemized earnings for the logged-in employee.

## 5. UI Surfaces

- [x] 5.1 Build `PayrollSettlementPage` in `frontend/owner-portal/src/app/routes/money/PayrollSettlementPage.tsx` with pay period selector, unbilled timesheets count, and "Process Payroll" workflow.
- [x] 5.2 Build `PayrollBatchModal` displaying breakdown by worker with approve/adjust controls.
- [x] 5.3 Build `MyEarningsPage` in `frontend/employee-portal/src/app/routes/earnings/MyEarningsPage.tsx` showing past pay slips and itemized gig pay/tips.

## 6. Verification & Tests

- [x] 6.1 Add unit tests in `entertainment_express/tests/test_gig_payroll.py` verifying rate card calculations, tip splits (equal vs hours-weighted), and commission clawback on refund.
- [x] 6.2 Add test for payroll compiler verifying that draft Salary Slips match expected salary component totals and are idempotent.
- [x] 6.3 Run `python3 smoke_test.py` to confirm all syntax, DocTypes, and OpenSpec checks pass.
