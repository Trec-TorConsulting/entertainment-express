## Why

Phase 26 closed the event revenue loop (proposal → sign → pay → planning). Tenants still cannot run **consultations** the way HoneyBook Scheduler / Calendly do: a public link, staff hours, no double-booking against events, confirm/reschedule. Adjacent products win the first sales conversation. Two-way Google/Microsoft calendars stay phase 13.

## What Changes

- Add **Meeting Types** (duration, location, buffers, assigned staff or round-robin) with CRUD on `/owner` — no Desk.
- Add a **public scheduling page** on the tenant site (`/book-meeting` or `/schedule/:type`) where a prospect picks a slot and submits name/email; creates an Appointment **and** a Lead on that tenant only.
- Compute slots from staff weekly hours + date overrides + time-off, minus existing Appointments **and** Event Booking assignments. Overlap is never offered.
- Logged-in `EE Customer` can book/reschedule/cancel from `/client`; guests of events cannot book money meetings as payers.
- Confirmations and reminders use existing `notifications.send`. Missing Twilio does not crash.
- Video types store a meeting URL (owner-supplied Zoom/Meet link or generated placeholder). No new video vendor.
- **Override:** baseline `appointments-scheduling` Calendar Sync (Google/M365 two-way) is **out of this phase**. v1 is native EE availability only. ICS download MAY be offered.
- **Explicit non-goals:** venue walk-through GPS, paid consult invoicing, group classes, Eventsquid ticketing, phase 13 calendar OAuth, phase 17 COI.

## Capabilities

### New Capabilities

- (none) — capability `appointments-scheduling` already exists in baseline specs.

### Modified Capabilities

- `appointments-scheduling`: Portal + public self-book; native conflict engine; reminders/reschedule; video URL attach. Calendar two-way deferred (see override above).
- `owner-portal`: Meeting types and appointment inbox on `/owner` without Desk.
- `employee-portal`: `EE Sales` sees and honors their own appointment slots.
- `customer-portal`: Signed-in clients book/reschedule consults; event guests do not become payers.
- `crm`: Public book creates/links a Lead on this tenant only.
- `notifications`: Appointment booked / reminder / canceled templates on existing channels.
- `hr-workforce`: Staff weekly hours and time-off feed appointment availability.
- `booking-availability`: Event assignments block consult slots for the same staff.
- `identity-access`: Public POST is guest-allowlisted and rate-limited; no cross-tenant slots.

## Impact

- Frontends: `frontend/owner-portal`, `frontend/employee-portal`, `frontend/customer-portal`; tenant `www` schedule page; rebuild `public/{owner,employee,client}/`.
- Backend: new `entertainment_express/api/appointments.py`; DocTypes `EE Meeting Type`, `EE Staff Hours` (or Employee child), `EE Appointment`.
- Tests: site isolation; overlapping event blocks slot; guest rate-limit; salesperson cannot see another user’s private notes if we add them (v1: no private notes across tenants anyway).
- Cluster: bench image bump; `bench migrate` on tenant sites.
- Depends on: phase-3 employees/time-off, phase-6 notifications, phase-26 portals.
- Does not: Google/Microsoft OAuth, Desk-only scheduling, GL charges for consults.
