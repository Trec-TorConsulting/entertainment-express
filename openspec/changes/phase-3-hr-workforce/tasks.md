# Tasks: Phase 3 — HR & Workforce

> Prereq: Phase 2 on main. Reuse existing Worker Availability / Pay Run / Compliance Document. Portals, not Desk.

## 1. Time-off + hours contract
- [x] 1.1 DocType `Worker Time Off` (employee, start_date, end_date, reason).
      **Accept:** migrate JSON; unique-enough per employee+dates; permissions owner/HR/crew read own.
- [x] 1.2 `check_worker_availability`: no hours row = available; hours constrain the window; Worker Time Off and legacy Event Booking `time_off` block.
      **Accept:** unit/stub tests cover all three.
- [x] 1.3 `appointments._hours_for_day` / `_time_off` use Worker Availability fallback and Worker Time Off.
      **Accept:** consult slots empty on time-off; hours from WA if consult table empty.

## 2. Compliance + dispatch
- [x] 2.1 `assignment_block_reason(employee, start, end)` used by `assign_crew` and `list_available_crew` / `suggest_crew`.
      **Accept:** missing W9 (1099) or expired cert raises ValidationError; person omitted from suggest.
- [x] 2.2 Check-out appends Timesheet Detail hours (check_out − check_in) linked to the job.
      **Accept:** hours > 0 pending approval.

## 3. Pay run
- [x] 3.1 `create_pay_run` sums event fees + approved hours + invoice tips split among completed crew on that job.
      **Accept:** stub test gross = fees + hours*rate + tip share; `flt` only.
- [x] 3.2 `process_payout` records txn id (Stripe Connect or MANUAL) and notifies; guests/crew 403.

## 4. Portal API
- [x] 4.1 `api/portal_hr.py`: owner save profile/hours/time-off/docs/timesheets/pay runs; employee self hours/time-off; accounting approve + pay run.
      **Accept:** guests 403; crew cannot process_payout; no `frappe.connect` / `frappe.init`.

## 5. UI
- [x] 5.1 `/owner/people` worker type, skills, pay, hours, time-off, docs, pending hours; pay run on Money.
      **Accept:** no DocType copy; rebuild `public/owner`.
- [x] 5.2 `/employee/me` hours + time-off; `/employee/accounting` timesheets + pay runs.
      **Accept:** rebuild `public/employee`.

## 6. Tests + ship
- [x] 6.1 `tests/test_phase3_surfaces.py` stub tests (guest, crew payroll, time-off, compliance, tips, isolation). Skip live `test_phase3.py` without migrate.
- [x] 6.2 Patch `v0_0_3.phase3_hr_workforce`; image `0.0.75-ee` → `0.0.76-ee`; ROADMAP folder linked.
      **Accept:** `pytest` + `python smoke_test.py` + `openspec validate --specs`.

## Definition of Done
Owner onboards a 1099 DJ with hours and W9, dispatch will not offer them on time-off, check-out creates hours, owner approves and pays (tips included), consults hide that date. All on `/owner` / `/employee`.
