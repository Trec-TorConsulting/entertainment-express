# Tasks: Phase 2 — Scheduling & Dispatch

> Prereq: **Phase 1 Definition of Done met.**
> Do tasks in order; check a box only when its **acceptance** passes.
> Reference `design.md` sections (A–H) and `openspec/specs/scheduling-dispatch/spec.md`.

## 1. DocTypes (design §A)
- [x] 1.1 Create `Crew Assignment` DocType JSON + controller.
      **Accept:** `bench migrate` clean; CRUD works; status options correct.
- [x] 1.2 Create `Run Sheet` DocType JSON + controller (with child tables).
      **Accept:** `bench migrate` clean; run sheet can be created per booking.
- [x] 1.3 Create child DocTypes `Run Sheet Equipment Item`, `Run Sheet Checklist Item`.
      **Accept:** child tables render in parent Run Sheet.

## 2. Employee custom fields (design §A)
- [x] 2.1 Add EE Employee custom fields to `setup/custom_fields.py` CUSTOM_FIELDS dict.
      **Accept:** `after_install` / migrate adds all 6 fields to Employee; fields visible in desk.
- [x] 2.2 Add `ee_dispatch_status` field to Event Booking.
      **Accept:** field present after migrate; defaults to `draft`.

## 3. Dispatch API (design §G, `api/dispatch.py`)
- [x] 3.1 Implement `assign_crew(booking, employee, role)`.
      **Accept:** creates Crew Assignment (status `offered`); conflict check blocks double-assignment;
      notifies crew via `shift_offered` template.
- [x] 3.2 Implement `accept_shift(assignment_name, token)` + `decline_shift`.
      **Accept:** accept → status `accepted`, notify dispatcher; decline → status `declined`, notify;
      token verified.
- [x] 3.3 Implement `crew_check_in` + `crew_check_out`.
      **Accept:** check-in timestamps; check-out timestamps + sets booking `in_progress`/`completed`.
- [x] 3.4 Implement `generate_run_sheet(booking_name)`.
      **Accept:** run sheet created/updated with venue, times, equipment list, and default checklist items.
- [x] 3.5 Implement `publish_run_sheet(booking_name)`.
      **Accept:** published flag set; all accepted crew receive `run_sheet_published` email.
- [x] 3.6 Implement `get_dispatch_board(date)`.
      **Accept:** returns all bookings for the date with crew assignment status and `at_risk` flag.
- [x] 3.7 Implement `get_run_sheet(booking_name)`.
      **Accept:** returns full run sheet including equipment and checklist (used by mobile app).

## 4. At-risk scheduler (design §E)
- [x] 4.1 Create `scheduling_dispatch/scheduler.py` with `flag_at_risk_events()`.
      **Accept:** function runs without error; creates Frappe Todos for at-risk bookings within 48 h.
- [x] 4.2 Wire to `hooks.py scheduler_events` (hourly).
      **Accept:** scheduler event registered; function callable via bench execute.

## 5. Notification templates
- [x] 5.1 Add `shift_offered`, `shift_accepted`, `shift_declined`, `run_sheet_published` to
      `fixtures/notification_templates.json`.
      **Accept:** templates load on migrate; render correctly with assignment/booking variables.

## 6. Tests
- [x] 6.1 Test crew conflict detection (double-assignment blocked).
      **Accept:** assigning same crew member to two overlapping bookings raises ValidationError.
- [x] 6.2 Test run sheet generation (fields populated from booking).
      **Accept:** run sheet includes venue, equipment items from assigned assets, default checklist items.
- [x] 6.3 Test accept-shift token verification (bad token rejected).
      **Accept:** accept_shift with wrong token raises PermissionError.
      **Accept:** `bench migrate` clean; CRUD works; status options correct.
- [ ] 1.2 Create `Run Sheet` DocType JSON + controller (with child tables).
      **Accept:** `bench migrate` clean; run sheet can be created per booking.
- [ ] 1.3 Create child DocTypes `Run Sheet Equipment Item`, `Run Sheet Checklist Item`.
      **Accept:** child tables render in parent Run Sheet.

## 2. Employee custom fields (design §A)
- [ ] 2.1 Add EE Employee custom fields to `setup/custom_fields.py` CUSTOM_FIELDS dict.
      **Accept:** `after_install` / migrate adds all 6 fields to Employee; fields visible in desk.
- [ ] 2.2 Add `ee_dispatch_status` field to Event Booking.
      **Accept:** field present after migrate; defaults to `draft`.

## 3. Dispatch API (design §G, `api/dispatch.py`)
- [ ] 3.1 Implement `assign_crew(booking, employee, role)`.
      **Accept:** creates Crew Assignment (status `offered`); conflict check blocks double-assignment;
      notifies crew via `shift_offered` template.
- [ ] 3.2 Implement `accept_shift(assignment_name, token)` + `decline_shift`.
      **Accept:** accept → status `accepted`, notify dispatcher; decline → status `declined`, notify;
      token verified.
- [ ] 3.3 Implement `crew_check_in` + `crew_check_out`.
      **Accept:** check-in timestamps; check-out timestamps + sets booking `in_progress`/`completed`.
- [ ] 3.4 Implement `generate_run_sheet(booking_name)`.
      **Accept:** run sheet created/updated with venue, times, equipment list, and default checklist items.
- [ ] 3.5 Implement `publish_run_sheet(booking_name)`.
      **Accept:** published flag set; all accepted crew receive `run_sheet_published` email.
- [ ] 3.6 Implement `get_dispatch_board(date)`.
      **Accept:** returns all bookings for the date with crew assignment status and `at_risk` flag.
- [ ] 3.7 Implement `get_run_sheet(booking_name)`.
      **Accept:** returns full run sheet including equipment and checklist (used by mobile app).

## 4. At-risk scheduler (design §E)
- [ ] 4.1 Create `scheduling_dispatch/scheduler.py` with `flag_at_risk_events()`.
      **Accept:** function runs without error; creates Frappe Todos for at-risk bookings within 48 h.
- [ ] 4.2 Wire to `hooks.py scheduler_events` (hourly).
      **Accept:** scheduler event registered; function callable via bench execute.

## 5. Notification templates
- [ ] 5.1 Add `shift_offered`, `shift_accepted`, `shift_declined`, `run_sheet_published` to
      `fixtures/notification_templates.json`.
      **Accept:** templates load on migrate; render correctly with assignment/booking variables.

## 6. Tests
- [ ] 6.1 Test crew conflict detection (double-assignment blocked).
      **Accept:** assigning same crew member to two overlapping bookings raises ValidationError.
- [ ] 6.2 Test run sheet generation (fields populated from booking).
      **Accept:** run sheet includes venue, equipment items from assigned assets, default checklist items.
- [ ] 6.3 Test accept-shift token verification (bad token rejected).
      **Accept:** accept_shift with wrong token raises PermissionError.

## Definition of Done (phase gate)
All boxes checked; dispatching a crew member to a confirmed booking produces a run sheet and the crew member
receives a shift offer notification; at-risk sweep flags an unassigned booking; all tests pass.
Then proceed to **phase-3-hr-workforce**.
