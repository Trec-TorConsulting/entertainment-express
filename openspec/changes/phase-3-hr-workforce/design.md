# Design: Phase 3 — HR & Workforce

> Prereq: Phase 1 & 2 complete. Read `openspec/specs/hr-workforce/spec.md`.

---

## A. Data Model

### New DocTypes

| DocType | Module | Key fields |
|---------|--------|-----------|
| **Worker Availability** | HR Workforce | employee (Link: Employee), monday_start_time (Time), monday_end_time, ..., sunday_start_time, sunday_end_time (full week), notes |
| **Timesheet** (ERPNext extended) | HR Workforce | employee (Link), start_date (Date), end_date, timesheets_detail (child: docname, project, task, booking (Link: Event Booking), working_hours (Float), role (EE Crew Role), bill_rate (Currency), approved (Check)) |
| **Pay Run** | HR Workforce | period_from (Date), period_to (Date), status (Select: draft\|finalized\|submitted\|pending_payout\|paid\|failed), payout_processor (Select: stripe_connect\|manual\|payroll), workers (child: Pay Run Detail), total_amount (Currency), notes |
| **Pay Run Detail** (child) | HR Workforce | worker (Link: Employee), event_fees (Currency), hourly_pay (Currency), tips (Currency), gross_amount (Currency), payout_method (Data: stripe_account_id or bank_details), txn_id (Data: stripe txn id) |
| **Compliance Document** | HR Workforce | employee (Link: Employee), doc_type (Select: w9\|contract\|background_check\|driver_license\|insurance), file (Attach), expiry_date (Date), status (Select: pending\|verified\|expired\|rejected), verified_by (Link: User), verified_date (Datetime), notes |

### ERPNext Employee custom fields (phase-2, used here)
- `ee_employment_type` (Select: w2/1099/volunteer)
- `ee_crew_roles` (Small Text: comma-separated role names)
- `ee_home_base`, `ee_service_areas`, `ee_pay_basis`, `ee_default_pay_rate`

---

## B. Availability & Time-off

**Worker Availability** captures:
- Monday–Sunday: start_time, end_time (recurring weekly pattern, e.g., 9 AM–9 PM)
- Used in dispatch: when searching for available crew for a booking, check if the booking time window overlaps with the employee's availability AND there are no blackout periods.

**Time-off / Blackout**: stored as **negative booking holds** or separate entries. Alternative: just check if an employee has a "blocked" flag or time-off entry for a date.

For phase-3, simpler approach: add a **blocklist check** in availability logic — if an employee has any Event Booking with status `time_off_requested` or a dedicated time-off document, exclude them from dispatch suggestions.

---

## C. Timesheets

**ERPNext Timesheet** extended with EE fields on detail rows:
- `booking` (Link: Event Booking) — which event this time was worked for
- `role` (Link: EE Crew Role) — what role they performed
- `bill_rate` (Currency) — override default rate for this shift
- `approved` (Check) — manager approval

**Workflow:**
1. Crew checks in/out at event via mobile → `Crew Assignment.check_in/out` timestamps set
2. After event, timesheet auto-created (or manually entered) with hours = checkout - checkin
3. Manager reviews & approves timesheet
4. Approved timesheets feed into Pay Run

---

## D. Pay Runs & Payouts

**Pay Run** aggregates worker pay over a period (e.g., weekly, bi-weekly):
- List of workers to include
- Per-worker detail rows: event fees (sum of gig booking amounts), hourly pay (from timesheets), tips
- Total gross
- payout_processor: stripe_connect (1099 via Stripe Connect) or manual (W2 via payroll/direct bank)

**Payout flow:**
1. Finalize Pay Run (sum all approved timesheets + event fees + tips)
2. Submit (locks for payout)
3. Process payout (call Stripe Connect API per 1099 worker, or export for payroll per W2)
4. Reconcile: txn_id stored, status → `paid` or `failed`

---

## E. Compliance Documents

**Compliance Document** tracks:
- `doc_type`: w9 (1099), contract, background check, driver license, insurance
- `file`: uploaded PDF/image
- `expiry_date`: when cert expires (optional)
- `status`: pending → verified (by admin) → expired (auto-check if past expiry)
- `verified_by` / `verified_date`: audit trail

**Policy enforcement:** Before assigning a crew member or processing payout, check compliance status. E.g., block assignment if W9 is missing or expired.

---

## F. Availability check in dispatch (phase-2 extension)

Current `api/dispatch.py` checks asset conflicts. Phase-3 adds: **also check Worker Availability + time-off**.

In `assign_crew()`, after conflict check, add:
```
- Get employee's Worker Availability record
- Check if booking's event_start/end falls within employee's weekly availability
- If employee has any time-off flag for that date, block
```

---

## G. Scheduler

`hr_workforce/scheduler.py` → `flag_overdue_payouts()`:
- Called daily.
- Find Pay Runs with status `pending_payout` and last-updated > SLA (e.g., 7 days).
- Create a Frappe Todo for finance/admin: "Payout overdue, mark as failed or reprocess."

---

## H. Notification templates

| key | trigger |
|-----|---------|
| `timesheet_approved` | Timesheet approved by manager |
| `payout_processed` | Pay Run marked as paid |

---

## I. API surface (`api/hr_workforce.py`)

| Function | Description |
|----------|-------------|
| `check_worker_availability(employee, event_start, event_end)` | Return (available: bool, reason: str) |
| `get_or_create_timesheet(employee, start_date)` | Return Timesheet for the week |
| `add_timesheet_detail(timesheet, booking, hours, role, bill_rate)` | Add a detail row |
| `approve_timesheet(timesheet_name)` | Mark approved; notify worker + manager |
| `create_pay_run(period_from, period_to, worker_list)` | Build Pay Run with computed totals |
| `finalize_pay_run(pay_run_name)` | Calculate final gross, lock for payout |
| `process_payout(pay_run_name)` | Call Stripe or payroll processor |
| `get_compliance_status(employee)` | Return list of required docs + expiry status |
| `upload_compliance_document(employee, doc_type, file)` | Create/update Compliance Document |

---

## J. File paths

```
entertainment_express/
├── hr_workforce/
│   ├── doctype/
│   │   ├── worker_availability/
│   │   │   ├── worker_availability.json
│   │   │   └── worker_availability.py
│   │   ├── pay_run/
│   │   │   ├── pay_run.json
│   │   │   └── pay_run.py
│   │   ├── pay_run_detail/
│   │   │   └── pay_run_detail.json
│   │   ├── compliance_document/
│   │   │   ├── compliance_document.json
│   │   │   └── compliance_document.py
│   │   └── timesheet (ERPNext extension — custom fields in setup/custom_fields.py)
│   └── scheduler.py
└── api/
    └── hr_workforce.py
```
