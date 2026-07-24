# Tasks: Phase 3 — HR & Workforce

> Prereq: **Phase 1 & 2 Definition of Done met.**
> Do tasks in order. Reference `design.md` sections (A–J).

## 1. DocTypes (design §A)
- [x] 1.1 Create `Worker Availability` DocType JSON + controller.
      **Accept:** migrate clean; CRUD works; all 7 day start/end times present.
- [x] 1.2 Create `Pay Run` DocType JSON + controller (with child table Pay Run Detail).
      **Accept:** migrate clean; Pay Run Detail child renders; status options correct.
- [x] 1.3 Create `Compliance Document` DocType JSON + controller.
      **Accept:** migrate clean; file field accepts attachment; expiry_date present.
- [x] 1.4 Extend `Timesheet` (ERPNext) with EE custom fields: booking, role, bill_rate, approved.
      **Accept:** fields added to setup/custom_fields.py; migrate applies them; Timesheet desk shows them.

## 2. Worker availability & dispatch integration (design §B, §F)
- [x] 2.1 Implement `check_worker_availability(employee, event_start, event_end)` in `api/hr_workforce.py`.
      **Accept:** checks Worker Availability + time-off; returns (available, reason).
- [x] 2.2 Extend `api/dispatch.assign_crew()` to call `check_worker_availability()`.
      **Accept:** assigning crew outside their availability hours is blocked.

## 3. Timesheets (design §C)
- [x] 3.1 Implement `get_or_create_timesheet(employee, start_date)`.
      **Accept:** creates or returns Timesheet for the week; employee auto-populated.
- [x] 3.2 Implement `add_timesheet_detail(timesheet, booking, hours, role, bill_rate)`.
      **Accept:** appends a detail row; validates hours > 0; booking link works.
- [x] 3.3 Implement `approve_timesheet(timesheet_name)`.
      **Accept:** marks approved; notifies worker + manager; prevents re-approval.

## 4. Payroll & payouts (design §D)
- [x] 4.1 Implement `create_pay_run(period_from, period_to, worker_list)`.
      **Accept:** builds Pay Run with detail rows per worker; sums event fees + hourly + tips.
- [x] 4.2 Implement `finalize_pay_run(pay_run_name)`.
      **Accept:** locks for payout; computes final gross; sets status `finalized`.
- [x] 4.3 Implement `process_payout(pay_run_name)` (stub for Stripe Connect + manual).
      **Accept:** calls payout processor; records txn_id; sets status `paid` or `failed`.

## 5. Compliance documents (design §E)
- [x] 5.1 Implement `get_compliance_status(employee)`.
      **Accept:** returns required docs (W9 for 1099, contract, etc.) + expiry status.
- [x] 5.2 Implement `upload_compliance_document(employee, doc_type, file)`.
      **Accept:** creates/updates Compliance Document; sets verified_date = NULL pending admin.

## 6. Scheduler (design §G)
- [x] 6.1 Create `hr_workforce/scheduler.py` with `flag_overdue_payouts()`.
      **Accept:** function runs; creates Todos for overdue payouts.
- [x] 6.2 Wire to `hooks.py scheduler_events` (daily).
      **Accept:** scheduler event registered; callable via bench execute.

## 7. Notifications & integration
- [x] 7.1 Add `timesheet_approved`, `payout_processed` to `fixtures/notification_templates.json`.
      **Accept:** templates render with worker/payout variables; migrate loads them.
- [x] 7.2 Integrate: when Crew Assignment check_out occurs, auto-create Timesheet detail.
      **Accept:** checking out from an event auto-populates Timesheet with hours.

## 8. Tests
- [x] 8.1 Test worker availability check (time-off blocks assignment).
      **Accept:** assigning crew with time-off flag for that date raises ValidationError.
- [x] 8.2 Test timesheet approval (hours locked, worker notified).
      **Accept:** approving timesheet sets approved=1; prevents editing; sends email.
- [x] 8.3 Test pay run computation (event fees + hourly + tips).
      **Accept:** finalized pay run has correct gross = event fees + (hours * bill_rate) + tips.

## Definition of Done (phase gate)
All boxes checked; onboard a 1099 worker → create availability → assign to booking → check in/out →
create timesheet → approve → create pay run → process payout. All steps pass; worker receives notification.
Then proceed to **phase-4-mobile-app**.
