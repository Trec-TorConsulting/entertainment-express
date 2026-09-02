## Why

Phase 1 produces confirmed bookings. Without Phase 2, those bookings sit idle — no crew is assigned, no
assets are dispatched, and no crew member has the information they need to show up and execute the event.
Phase 2 turns a confirmed booking into an executable field operation: assign and offer shifts to crew,
issue run sheets, and give dispatchers full-day visibility.

## What Changes

- New `Crew Assignment` DocType: links an Employee/contractor to a booking for a specific role with
  offer/accept/decline/check-in status tracking.
- New `Run Sheet` DocType: auto-generated packet per booking (venue, times, equipment list, client contact,
  setup checklist) surfaced to crew on the mobile PWA.
- New `Dispatch Board` Frappe page/API: daily view of events, assignment status, gaps, and readiness flags.
- New `api/dispatch.py`: assign crew, offer shift, accept/decline, generate run sheet, get dispatch board.
- Extend `Event Booking` with `dispatch_status` field (draft/dispatched/in_progress/completed).
- Scheduler: auto-flag at-risk events with open required assignments within 48-hour dispatch horizon.
- ERPNext `Employee` extended with EE skill/role fields via fixtures (ee_crew_roles, ee_home_base,
  ee_employment_type, ee_pay_basis, ee_service_areas) — subset of HR/Workforce (phase-3 completes the rest.
- Notifications: shift offered, shift accepted/declined, run sheet published.

## Capabilities

### New Capabilities
- `crew-assignment`: Crew assignment lifecycle (offer → accept/decline → check-in → complete/no-show)
  per booking, role-matched, conflict-checked.
- `run-sheet`: Auto-generated per-event crew packet; sent on dispatch; surfaced in mobile app.
- `dispatch-board`: Daily dispatcher view — all events, assignment gaps, readiness, at-risk flags.

### Modified Capabilities
- `scheduling-dispatch`: Implementation of the full spec (Crew & Asset Assignment, Crew Offer & Acceptance,
  Dispatch Board, Run Sheets requirements). No spec requirement changes.
- `booking-availability`: `dispatch_status` field added to Event Booking (implementation extension, no
  spec requirement change).

## Impact

- New DocTypes: `Crew Assignment`, `Run Sheet`, `Run Sheet Equipment Item`, `Run Sheet Checklist Item`.
- Custom fields on ERPNext `Employee`: employment_type, crew_roles (child table), home_base,
  service_areas, pay_basis.
- New `api/dispatch.py` module.
- Notification templates: `shift_offered`, `shift_accepted`, `shift_declined`, `run_sheet_published`.
- Scheduler event: hourly at-risk flag sweep.
- Depends on: phase-1 (Event Booking, Service Asset, EE Crew Role, notifications).
