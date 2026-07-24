## Why

Phase 2 assigns crew to bookings, but the system has no way to onboard, profile, or pay workers. Phase 3
builds the full worker lifecycle: onboard W2 employees and 1099 contractors with skills/certifications,
track their availability and time-off, record timesheets from mobile check-in/out, and compute + process
payouts. This closes the loop from booking → crew assignment → execution → payment.

## What Changes

- New `Worker Availability` DocType: captures recurring weekly availability + blackouts/time-off for a
  worker, enforced during dispatch.
- New `Timesheet` (Frappe built-in extended) with EE fields: booking (link), check_in, check_out, hours,
  role, approved (bool), pay_rate override.
- New `Pay Run` DocType: period (date range), list of workers, computed total pay (event fees + hourly
  hours + tips), status, payout_processor (stripe_connect or manual).
- New `Compliance Document` DocType: worker (link), doc_type (w9/contract/background_check/license), file,
  expiry, status (verified/expired/pending).
- Extend `Employee` with 6 fields (already phase-2): ee_employment_type, ee_crew_roles, ee_home_base,
  ee_service_areas, ee_pay_basis, ee_default_pay_rate (already in setup/custom_fields.py).
- New fields on Crew Assignment: pay_rate_override (for per-gig rate adjustments).
- New `api/hr_workforce.py`: availability check, timesheet CRUD, pay run generation, payout processing.
- Extend dispatch availability check to respect Worker Availability + time-off.
- Notification templates: timesheet_approved, payout_processed.
- Scheduler: mark overdue payouts as unpaid if not processed within SLA.

## Capabilities

### New Capabilities
- `worker-onboarding`: Worker profiles (W2/1099), skills/roles, certifications, compliance docs (w9,
  background check, etc.), pay tracking.
- `worker-availability`: Recurring weekly availability, blackouts/time-off, enforced in dispatch.
- `timesheets`: Check-in/out via mobile, hours approval, tied to bookings and roles.
- `payroll-contractor-payouts`: Compute pay (event fees + hours + tips), process payouts via Stripe
  Connect (1099) or payroll (W2), audit trail.

### Modified Capabilities
- `scheduling-dispatch`: Dispatch availability extended to check Worker Availability + time-off (not just
  asset availability).
- `booking-availability`: Implied extension to respect crew availability during booking hold/checkout.

## Impact

- New DocTypes: `Worker Availability`, `Timesheet` (ERPNext built-in extended), `Pay Run`, `Compliance Document`.
- Custom fields on ERPNext Employee: all 6 EE fields (added phase-2) now used in full.
- New `api/hr_workforce.py` module.
- Notification templates: `timesheet_approved`, `payout_processed`.
- Scheduler: `flag_overdue_payouts()` (daily).
- Depends on: phase-1 (Event Booking, notifications), phase-2 (Crew Assignment, dispatch).
