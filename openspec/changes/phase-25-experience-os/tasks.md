# Tasks: Phase 25 — Experience OS (owner / employee / client)

> One product family, three skins. Isolation tests on every API that takes a booking or customer.

## 1. Kit

- [x] 1.1 Portal-kit densities: cockpit, ops, consumer; optional Company | Talent switch slot.
      **Accept:** all three SPAs import the same shell; no DocType names in default copy.
- [x] 1.2 Shared BookingDetail / MoneySummary kit components (read API strings only).
      **Accept:** owner and employee import the same component.

## 2. Collaboration backend

- [x] 2.1 Seed `EE Event Guest`. DocTypes: `EE Event Invite`, `EE Event Plan Item`, `EE Event Vote`, `EE Booking Message`.
      **Accept:** migrate on a tenant site; Guest role exists.
- [x] 2.2 Whitelist APIs: invite/revoke/list, plan suggest/vote/approve, chat list/post — membership checks on every call.
      **Accept:** tests: guest cannot pay; guest cannot read another booking; invitee is not `EE Customer`.
- [x] 2.3 Invite + chat notifications via existing notification channels (log-fail if unconfigured).
      **Accept:** invite queues an email; no crash without Twilio.

## 3. Owner Company OS

- [x] 3.1 Nav: Today, Calendar, Pipeline, Dispatch, Catalog, Gear, People, Money, Reports, Automations, Brand.
      **Accept:** each route has a real list or empty-state next action (not “scaffolded”).
- [x] 3.2 Today wired to bookings + at-risk + outstanding + approvals + unread chat counts.
      **Accept:** date range; money strings from API.
- [x] 3.3 Company | Talent switch when owner also has Entertainer or Crew.
      **Accept:** no switch if owner-only; Talent shows that user’s assignments.
- [x] 3.4 Owner CRUD for pipeline, calendar jobs, catalog, gear, people, brand (invoices view/edit notes).
      **Accept:** `/owner/pipeline` new/open/save/remove inquiry; no DocType names in the UI.

## 4. Employee OS

- [x] 4.1 Role-sliced nav of the same objects; My Day for field; dispatch embed.
      **Accept:** sales cannot open crew-only APIs; crew phone bottom nav still works.
- [x] 4.2 Staff report routes call role-filtered report APIs.
      **Accept:** crew denied owner revenue report.

## 5. Client OS (start in this change)

- [x] 5.1 Paying customer IA: Home, Events, Pay, Documents, Planning, People, Chat, Photos.
      **Accept:** unsigned/unpaid next action on Home from existing APIs.
- [x] 5.2 Guest IA: This event, Planning, Chat, Photos only. Invite/revoke UI for customer.
      **Accept:** guest UI has no Pay; isolation tests from 2.2 still pass through the SPA APIs.

## 6. Reports

- [x] 6.1 Owner canned pack APIs + CSV/PDF (jobs/revenue, outstanding/deposits, pipeline, at-risk, utilization, payouts, by service type). No GL.
      **Accept:** tenant isolation test; amounts are strings.
- [x] 6.2 Employee + client money summary APIs as in design D6.
      **Accept:** client sees only own invoices; guest 403 on reports.

## 7. Ship

- [x] 7.1 Isolation + permission pytest for collaboration and reports.
      **Accept:** `bench`/`pytest` on app tests including cross-booking guest deny.
- [x] 7.2 Rebuild `public/{owner,employee,client}/` (+ dispatch if embed tokens change) and bench image.
      **Accept:** main.js 200; owner Today and client Home load for the right roles.
