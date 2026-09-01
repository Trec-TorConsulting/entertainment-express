# Tasks: Phase 16 — Appointments & Scheduling

> Calendly-style consults on the tenant site and portals. Distinct from Event Bookings. No Google/Microsoft sync. No consult invoices.

## 1. Schema

- [x] 1.1 DocType `EE Meeting Type`: name, duration, location_type, buffers, assigned_staff, video_url, active, slug.
      **Accept:** migrate on a tenant site; listed under Entertainment Express Core.
- [x] 1.2 Child `EE Staff Hours` on Employee (or linked DocType): weekday + start/end; `EE Staff Hour Override` date open/closed.
      **Accept:** owner can save Mon–Fri 9–5 for a salesperson.
- [x] 1.3 DocType `EE Appointment`: type, staff, invitee, start/end, status, lead, cancel_token; unique staff+start.
      **Accept:** two inserts same staff+start fail; no money fields.
- [x] 1.4 Notification templates `appointment_booked`, `appointment_reminder`, `appointment_canceled`.
      **Accept:** fixtures load; send without Twilio returns.

## 2. Slot engine and book API

- [x] 2.1 `api/appointments.py` `list_slots` (guest): hours − overrides − time-off − appointments − crew assignments; buffers applied.
      **Accept:** assigned event 14:00–18:00 hides overlapping consults; other tenant data never queried.
- [x] 2.2 `book` (guest, rate-limited): re-check slot, insert Appointment, create/match Lead, queue confirmation.
      **Accept:** duplicate POST on last slot → one row; guest is not granted `EE Customer`.
- [x] 2.3 `reschedule` / `cancel` with token or payer session; `complete` / `no_show` staff-only.
      **Accept:** cancel releases slot; guest 403 on staff complete.
- [x] 2.4 Daily reminder scheduler gated like other automations; ICS download by token.
      **Accept:** reminder uses existing `notifications.send`; ICS is this appointment only.

## 3. Public page and portals

- [x] 3.1 Tenant `www/schedule` lists active types and slots; form calls `book`.
      **Accept:** unpublished/inactive types hidden; no DocType names in copy.
- [ ] 3.2 `/owner/schedule`: CRUD meeting types + hours; appointment list with cancel/complete.
      **Accept:** not EmptyState; no `/app`.
- [ ] 3.3 `/employee` My Day shows assigned consults for `EE Sales`.
      **Accept:** other salesperson’s consults omitted.
- [ ] 3.4 `/client/appointments`: customer lists own, reschedule/cancel; guests 403.
      **Accept:** pytest.

## 4. Ship

- [ ] 4.1 `tests/test_phase16_appointments.py`: isolation, overlap with event, rate-limit, guest not payer.
      **Accept:** pytest on tenant site.
- [ ] 4.2 Rebuild `public/{owner,employee,client}/`; bump bench image; migrate tenant sites.
      **Accept:** public book and `/owner/schedule` load for the right roles.
