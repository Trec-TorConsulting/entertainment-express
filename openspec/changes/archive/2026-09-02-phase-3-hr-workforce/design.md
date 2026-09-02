# Design: Phase 3 — HR & Workforce (portals)

## Context

DocTypes and `api/hr_workforce.py` already exist from an earlier Desk-oriented pass. `/owner/people` only invites users. Time-off is an Event Booking with `status=time_off` and `customer=employee`. Consult hours live on `Employee.ee_consult_hours`. Worker Availability is unused in the UI. Tips in pay runs are always 0. Check-in opens an empty Timesheet; check-out does not write hours. Missing Worker Availability currently **blocks** assign — that must flip so people without a schedule stay assignable.

## Goals / Non-Goals

**Goals:** onboard and pay crew from `/owner` and `/employee` without Desk; one hours + time-off source for dispatch and consults; compliance expiry and missing required docs block assignment; timesheets from check-out; pay runs include tips.

**Non-Goals:** tax filing, Stripe Connect onboarding screens, Desk HR, cross-site queries.

## Decisions

1. **Reuse Employee.** W2/1099, skills (`ee_crew_roles`), pay basis/rate, service areas stay custom fields. Invite still creates Employee for field roles.

2. **Weekly hours = Worker Availability.** One row per employee, Mon–Sun start/end. Missing row = available for events (do not lock existing crew). If a day has start+end, the job window must fit. `appointments._hours_for_day` uses `ee_consult_hours` first, else Worker Availability for that weekday.

3. **Time-off = Worker Time Off.** New DocType: `employee`, `start_date`, `end_date`, `reason`. Dispatch and consults treat any overlap as busy. Still honor legacy Event Booking `status=time_off` + `customer=employee` so phase-16 rows keep working.

4. **Compliance.** Required: `contract` + `background_check`; plus `w9` when `ee_employment_type=1099`. Missing or `expired`/`rejected` blocks `assign_crew` and drops the person from suggest. `driver_license` / `insurance` only block when a verified row is past expiry (scheduler already flips status).

5. **Timesheets.** On check-out, hours = check_out − check_in (min 0.25h). Append Timesheet Detail with `ee_booking`, role, `ee_bill_rate` from assignment or employee default, `ee_approved=0`. Owner/accounting `approve_timesheet` sets approved and notifies.

6. **Pay run math.** For each worker in the period: event fees = completed Crew Assignment `pay_rate` whose booking date is in range; hourly = approved detail hours × `ee_bill_rate`; tips = that worker’s share of `Sales Invoice.ee_tip_amount` for invoices whose `ee_booking` they completed (split equally among completed crew on that job). `flt` only. Stripe Connect transfer if `payout_method` looks like an acct id and keys exist; else `txn_id` `MANUAL-…` / `STRIPE-…` stub and status `paid`.

7. **Portal API `api/portal_hr.py`.** Owner: list workers (user + employee + compliance flags), save profile, save hours, save time-off, upload/verify doc, list/approve timesheets, create/finalize/process pay run. Employee: `my_hours`, `save_my_hours`, `my_time_off` (self only). Accounting/owner: timesheet queue + pay runs. Guests 403. Payloads use person/job language, never DocType names.

8. **UI.** `/owner/people` selected person: type, skills, pay, hours, time-off, docs, pending hours. `/owner/money` keeps invoices; add a Pay crew panel listing pay runs. `/employee/me` hours + time-off. `/employee/accounting` pending timesheets + pay runs. No “DocType”, `/app`, or Frappe module names.

9. **Image** `0.0.75-ee` → `0.0.76-ee`. Patch `phase3_hr_workforce` is `create_all()` no-op (JSON DocTypes).

## Risks / Trade-offs

- [No hours row] → event assign allowed; consults still need hours or Worker Availability fallback.
- [Stripe Connect missing] → pay run still records amounts and a manual txn id.
- [Equal tip split] → no per-role tip rules this phase.

## Migration Plan

Migrate new `Worker Time Off`. Existing Worker Availability / Pay Run / Compliance Document unchanged. Rollback: previous bench tag.

## Open Questions

None blocking.
