## Why

Dispatch can offer shifts, but People is still invite-and-roles. Owners cannot onboard W2 vs 1099, set hours, collect a W9, approve hours, or pay crew without Desk. Consult scheduling already looks at Event Booking `time_off` and `EE Staff Hours`; event hours live on a separate Worker Availability record that never reaches `/owner`. That split breaks matching, consults, and payouts.

## What Changes

- Keep existing DocTypes (`Worker Availability`, `Pay Run`, `Compliance Document`, Timesheet EE fields). Add `Worker Time Off` (employee + dates) so time-off is not a fake Event Booking.
- Owner `/owner/people`: worker type, skills, pay, weekly hours, time-off, compliance files, timesheets, pay runs — no Desk.
- Staff `/employee/me`: own hours and time-off. `/employee/accounting`: approve timesheets and run payouts (`EE Accounting` / owner).
- `assign_crew` / suggest: skip people outside weekly hours, on time-off, or missing/expired required docs (W9 for 1099, contract, background check, expired license).
- Consult slots reuse the same weekly hours and time-off (`Hours Feed Consult Slots`).
- Check-out writes timesheet hours against the job. Pay run sums event fees + approved hours + tips from invoices on those jobs. Stripe Connect when configured; otherwise mark paid with a manual txn id.
- Guests 403. No `frappe.connect` / `frappe.init`. Copy never says DocType.

## Impact

- Backend: `api/hr_workforce.py`, new `api/portal_hr.py`, `api/dispatch.py`, `api/appointments.py`, `Worker Time Off`.
- Frontends: `frontend/owner-portal`, `frontend/employee-portal`; rebuild `public/{owner,employee}/`.
- Tests: stub `tests/test_phase3_surfaces.py`; live `tests/test_phase3.py` skips without migrate.
- Image `0.0.75-ee` → `0.0.76-ee`. Patch `v0_0_3.phase3_hr_workforce`.
- Depends on: phase-1 Employee/bookings, phase-2 dispatch, phase-16 consult hours/time-off, phase-5 invoice tips.

## Non-Goals

- ADP / tax withholding / 1099-NEC e-file.
- Stripe Connect Express onboarding UI (use stored account id when present).
- Background-check vendor APIs.
- Desk HR workspace work.

## Requirements delivered

- `hr-workforce`: Worker Onboarding & Profiles, Skills & Role Matching, Availability & Time-Off, Timesheets, Payroll & Contractor Payouts, Compliance & Documents, Hours Feed Consult Slots, Workforce Without Desk.
- `scheduling-dispatch`: assignment respects hours, time-off, and required docs.
- `owner-portal`: People workforce (profile, hours, docs, timesheets, pay runs).
- `employee-portal`: own hours/time-off; accounting timesheets and payouts.
- `appointments-scheduling`: consult slots use the same hours and time-off as dispatch.
