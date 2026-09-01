## Context

Phase 26 made `/owner`, `/employee`, and `/client` usable for events. There is no Appointment DocType and no public scheduler. HoneyBook Scheduler / Calendly are the research targets (not copies). Event Booking remains the paid gig; Appointments are consultations distinct from events. Staff time-off already exists as Event Booking `status=time_off` (phase 3) plus crew assignments.

Stakeholders: tenant owner, EE Sales, prospect (Guest), paying client. Isolation: site-per-tenant.

## Goals / Non-Goals

**Goals:**
- Owner defines meeting types and hours without Desk.
- Prospect self-books a slot on this tenant’s public page; Lead + Appointment land on this site.
- Slots never overlap that staff’s other appointments, event assignments, or time-off.
- Confirm / remind / reschedule / cancel on existing notification channels.
- Client can manage their own consults; event guests cannot pay or become payers.

**Non-Goals:**
- Google/Microsoft/Apple two-way sync (phase 13).
- Charging for consults / GL.
- Venue COI (phase 17), campaigns (phase 8), AI (phase 11).
- Generating Zoom/Meet via vendor OAuth — store a URL.

## Decisions

### D1 — New DocTypes, not Event Booking rows
**EE Meeting Type**: `type_name`, `duration_minutes`, `location_type` (`phone|video|in_person`), `buffer_before`, `buffer_after`, `location_label`, `video_url`, `assigned_staff` (Link Employee, empty = round-robin among active sales), `active`, `slug`.
**EE Staff Hours** (child of Employee or Small DocType): weekday, start_time, end_time; plus **EE Staff Hour Override** date, closed or custom hours.
**EE Appointment**: meeting_type, staff, invitee_name, invitee_email, invitee_phone, start, end, status (`scheduled|rescheduled|canceled|completed|no_show`), lead, customer (optional), video_url, cancel_token, timezone.

**Alt:** reuse Event Booking with a consult status. **Rejected** — contaminates availability, deposits, and packing lists.

### D2 — Slot API is read-only until book
`list_slots(meeting_type, from_date, to_date)` returns ISO starts. `book(...)` re-checks the slot in a `frappe.db.savepoint` / select-for-update equivalent (`unique` on staff+start) so two POSTs cannot double-book.

### D3 — Public page is Frappe www, portals are SPA
`www/schedule.html` + `www/schedule.py` (or `/book-meeting`) calls `api/appointments.py` `allow_guest=True` for list_slots + book, rate-limited like storefront. Owner `/owner/schedule`, employee My Day, client `/client/appointments` use staff/payer methods.

### D4 — Calendar sync override
No OAuth this phase. Optional ICS via `appointments.ics(name, token)`. Phase 13 will add two-way busy.

### D5 — Round-robin
If meeting type has no assigned_staff, pick the active `EE Sales` Employee with the fewest scheduled appointments that week who is free for the slot. If none, no slots.

### D6 — Money
No invoices. Amounts never appear. Do not call billing.

### D7 — Files
| Area | Path |
|------|------|
| API | `entertainment_express/api/appointments.py` |
| DocTypes | `entertainment_express_core/doctype/ee_meeting_type`, `ee_appointment`, `ee_staff_hours` |
| Public | `www/schedule.html` + `schedule.py` |
| Portals | owner/employee/customer `App.tsx` |
| Notifications | fixtures `appointment_booked`, `appointment_reminder`, `appointment_canceled` |
| Tests | `tests/test_phase16_appointments.py` |

## Risks / Trade-offs

- [Race on last slot] → unique index staff+start; re-validate in `book`.
- [Timezone surprises] → store timezone on Appointment; compute in tenant default tz (`America/New_York` unless Employee has one).
- [Time-off model is Event Booking status] → treat those rows as busy; do not invent a second time-off table unless hours DocType needs date overrides.
- [Phase 13 later] → keep `video_url` and ICS fields so sync can attach later.

## Migration Plan

1. DocTypes + patch; migrate tenant sites.
2. Ship API + public page + SPA rebuild; bump bench image.
3. Rollback: hide public route and deactivate meeting types; rows remain.

## Open Questions

- None blocking. Owner-supplied video URL is enough for v1.
