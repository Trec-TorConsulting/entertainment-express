# Tasks: Comprehensive QA Audit — Full-Coverage E2E Test Suite

## 1. Test Infrastructure and Configuration

- [x] 1.1 Create `tests/e2e/support/api-client.ts` — typed API wrapper composing with existing `callMethod` from `session.ts`. Exports typed `ApiClient` class with `call(method, args)` returning `{ ok, status, message }`. Include per-persona convenience constructors.
- [x] 1.2 Create `tests/e2e/support/fixtures.ts` — test data factories for all major entity types. Each factory returns `{ data, cleanup }`. Factories: `createTestPackage(page, opts)`, `createTestLead(page, opts)`, `createTestBooking(page, opts)`, `createTestVenue(page, opts)`, `createTestAsset(page, opts)`, `createTestPartner(page, opts)`, `createTestPerson(page, opts)`. Use `Date.now().toString().slice(-6)` for unique stamps.
- [x] 1.3 Create `tests/e2e/support/assertions.ts` — reusable assertion helpers: `assertDialogClosed(page, name)`, `assertRecordSaved(page, kind, match)`, `assertRoleDenied(page, method)`, `assertToastVisible(page, text?)`, `assertFormValidationError(page, fieldLabel)`, `assertNoPageErrors(watch, context)`.
- [x] 1.4 Create `tests/e2e/support/global-setup.ts` — Playwright global setup that pings `EE_E2E_BASE/api/method/ping`, verifies all 3 persona logins succeed, and logs tenant version. Fail fast with descriptive errors.
- [x] 1.5 Update `playwright.config.ts` — add 6 named projects (`infra`, `owner`, `employee`, `client`, `public`, `workflows`, `api`) each with `testDir` pointing to the respective suite directory. Add `globalSetup` pointing to `support/global-setup.ts`. Add `dotenv` loading from `.env.e2e`.
- [x] 1.6 Update `package.json` — add scripts: `test:e2e:owner`, `test:e2e:employee`, `test:e2e:client`, `test:e2e:public`, `test:e2e:workflows`, `test:e2e:api`, `test:e2e:all`.

## 2. Owner Portal Tests — Core Operations

- [x] 2.1 Create `tests/e2e/01-owner/today-dashboard.spec.ts` — verify Today page loads, widgets render, quick-action buttons open correct dialogs, and dismissing dialogs returns to dashboard. Assert no JS errors via `watchPage`.
- [x] 2.2 Create `tests/e2e/01-owner/calendar-booking.spec.ts` — full CRUD: create booking (fill Event Name, Client Host Name, Event Date, Start Time, End Time, Location, Contract Total, Notes → save → verify via API), edit booking (change name and total → save → verify), cancel booking, navigate month/week/day views.
- [x] 2.3 Create `tests/e2e/01-owner/schedule.spec.ts` — verify Schedule page loads with crew availability grid, tabs switch correctly, no JS errors.
- [x] 2.4 Create `tests/e2e/01-owner/pipeline-crm.spec.ts` — create inquiry (fill Client/Contact Name, Email, Phone, Event Date, Event Type → "Create Deal" → verify via API), edit deal status through stages (New→Qualified→Proposal Sent→Booked→Lost), filter deals by search text, open review drawer.
- [x] 2.5 Create `tests/e2e/01-owner/dispatch-board.spec.ts` — select date with bookings, assign crew from Person dropdown, click "Offer shift", verify "Waiting on them" appears, verify via `portal_dispatch.job_crew` API. Test reassigning crew.

## 3. Owner Portal Tests — Catalog and Assets

- [x] 3.1 Create `tests/e2e/01-owner/packages-catalog.spec.ts` — create package (Package Title, Base Rate, Description, Category → save → verify via API), edit package (change title and rate → save → verify), archive package (verify removal from active view).
- [x] 3.2 Create `tests/e2e/01-owner/gear-assets.spec.ts` — add asset (Asset Name, Category, Serial Number, Condition, Purchase Date → save → verify via API), edit asset (change condition → save → verify), retire asset.
- [x] 3.3 Create `tests/e2e/01-owner/people-team.spec.ts` — add person (Name, Email, Phone, Role → save → verify via API), edit person (change role → save → verify), deactivate person.
- [x] 3.4 Create `tests/e2e/01-owner/places-venues.spec.ts` — add venue (Venue Name, Address, Contact Name, Contact Phone, Load-in Instructions, Parking, Power → save → verify via API), edit venue, verify changes persist.
- [ ] 3.5 Create `tests/e2e/01-owner/partners-vendors.spec.ts` — add partner (Partner Name, Category, Email, Phone → save → verify via API), verify partner appears in list.
- [ ] 3.6 Create `tests/e2e/01-owner/subcontractors.spec.ts` — verify page loads with listings and management controls, tabs switch correctly, no JS errors.

## 4. Owner Portal Tests — Finance and Money

- [x] 4.1 Create `tests/e2e/01-owner/money-invoices.spec.ts` — create invoice ("+ Create Invoice" → select Booking → "Create balance invoice" → verify invoice number appears → verify via API), view invoice detail (line items, payment status), filter invoices by status (Draft/Sent/Paid/Overdue).
- [ ] 4.2 Create `tests/e2e/01-owner/payroll-settlement.spec.ts` — verify Payroll page loads, displays pending timesheets and settlement controls, tabs switch correctly.
- [ ] 4.3 Create `tests/e2e/01-owner/reports.spec.ts` — verify Reports page loads, report tiles render, date range filters apply, at least one report generates data.

## 5. Owner Portal Tests — Settings, AI, and Marketing

- [x] 5.1 Create `tests/e2e/01-owner/assistant-ai.spec.ts` — verify AI Assistant page loads, chat input is present and submittable, no JS errors.
- [ ] 5.2 Create `tests/e2e/01-owner/plan-subscription.spec.ts` — verify Plan page loads, current plan details displayed, upgrade/downgrade options visible.
- [ ] 5.3 Create `tests/e2e/01-owner/automations.spec.ts` — verify Automations page loads, automation rules displayed, toggle controls functional.
- [ ] 5.4 Create `tests/e2e/01-owner/grow-marketing.spec.ts` — verify Grow page loads, marketing tools rendered, no JS errors.
- [ ] 5.5 Create `tests/e2e/01-owner/import-migration.spec.ts` — verify Import page loads, import options displayed, no JS errors.
- [ ] 5.6 Create `tests/e2e/01-owner/company-studio.spec.ts` — verify Company Studio loads, company settings editable, save persists.
- [ ] 5.7 Create `tests/e2e/01-owner/master-data.spec.ts` — verify Master Data Explorer loads, DocType browser functional.
- [ ] 5.8 Create `tests/e2e/01-owner/brand-whitelabel.spec.ts` — upload logo (file input interaction), change colors (color picker), save brand settings → verify via API.
- [ ] 5.9 Create `tests/e2e/01-owner/website-builder.spec.ts` — verify Website builder loads, page list visible, editor controls present.
- [ ] 5.10 Create `tests/e2e/01-owner/coverage-service-area.spec.ts` — verify Coverage page loads, service area config visible, map renders.
- [ ] 5.11 Create `tests/e2e/01-owner/connections-integrations.spec.ts` — verify Connections page loads, integration cards visible with connect/disconnect controls.
- [ ] 5.12 Create `tests/e2e/01-owner/security-settings.spec.ts` — verify Security page loads, security settings displayed, no JS errors.

## 6. Owner Portal Tests — Remaining Pages

- [x] 6.1 Create `tests/e2e/01-owner/fleet-safety.spec.ts` — verify Fleet & Safety page loads, vehicle health cards display, Van Manifest page loads.
- [ ] 6.2 Create `tests/e2e/01-owner/emergency-overrides.spec.ts` — verify Emergency Overrides page loads, active overrides displayed, controls present.
- [ ] 6.3 Create `tests/e2e/01-owner/event-details.spec.ts` — verify Event Details page with tabs (Details, Crew, Timeline, Planning, Music, Financials) all render and switch correctly.

## 7. Owner Portal Tests — Validation and Edge Cases

- [x] 7.1 Add form validation error tests to `packages-catalog.spec.ts` — submit Create Package with empty required fields → assert validation error appears and dialog stays open.
- [ ] 7.2 Add form validation error tests to `calendar-booking.spec.ts` — submit booking with missing Event Date → assert validation error.
- [ ] 7.3 Add empty-state rendering tests across at least 3 Owner pages (Pipeline, Calendar, Gear) — verify clean empty-state placeholder renders instead of broken/blank page.

## 8. Employee Portal Tests

- [x] 8.1 Create `tests/e2e/02-employee/my-day.spec.ts` — verify My Day page loads, shift cards display with status badges, clock-in/clock-out buttons respond to clicks.
- [x] 8.2 Create `tests/e2e/02-employee/dispatch-embed.spec.ts` — verify Dispatch embed loads, assigned bookings render, booking detail expands on click.
- [ ] 8.3 Create `tests/e2e/02-employee/pull-sheet.spec.ts` — verify Pull Sheet loads, equipment checklist renders, checkboxes toggle, notes field saves.
- [ ] 8.4 Create `tests/e2e/02-employee/field-board.spec.ts` — full shift state machine: accept offered shift ("I'm in" → verify "accepted"), transition en-route ("On the way" → verify "en-route"), arrive ("Arrived" → verify "on-site"), break + resume, wrap up, complete. Verify each state via `field.my_jobs` API. Test declining a shift.
- [ ] 8.5 Create `tests/e2e/02-employee/my-earnings.spec.ts` — verify earnings page loads, pay history displays, date range filter works, pay stub detail opens.
- [ ] 8.6 Create `tests/e2e/02-employee/reports.spec.ts` — verify Reports page loads, employee-specific reports available, date range applies.
- [ ] 8.7 Create `tests/e2e/02-employee/my-profile.spec.ts` — verify profile loads with current info, edit phone number and emergency contact → save → verify via API.

## 9. Client Portal Tests

- [x] 9.1 Create `tests/e2e/03-client/home-dashboard.spec.ts` — verify Home page loads, event countdown widget, action items, quick-action links navigate correctly.
- [x] 9.2 Create `tests/e2e/03-client/my-events.spec.ts` — verify events list loads, filter by status (Upcoming/Past/Cancelled), click into event detail navigates to `/client/events/:id`.
- [x] 9.3 Create `tests/e2e/03-client/event-detail.spec.ts` — verify all tabs render (Overview, Timeline, Planning, Music, Crew, Documents, Photos), tabs switch correctly, editable fields can be modified and saved.
- [x] 9.4 Create `tests/e2e/03-client/payments-invoices.spec.ts` — verify payments page loads, outstanding invoices listed, invoice detail shows line items, "Pay Now" button renders Stripe Elements (skip actual charge if test keys unavailable).
- [ ] 9.5 Create `tests/e2e/03-client/planning-hub.spec.ts` — fill planning form fields (event type questions, pronunciations, special requests, timeline preferences), save draft, reopen and verify draft persists, submit form, verify status "Submitted" via API.
- [ ] 9.6 Create `tests/e2e/03-client/live-event-chat.spec.ts` — verify chat page loads, message input present, send message, verify message appears in thread.
- [ ] 9.7 Create `tests/e2e/03-client/cohosts-guests.spec.ts` — invite co-host (enter email → send → verify), add guests to guest list, verify RSVP tracking.
- [ ] 9.8 Create `tests/e2e/03-client/consultations.spec.ts` — schedule appointment (select time, type → confirm), cancel appointment, reschedule appointment.
- [ ] 9.9 Create `tests/e2e/03-client/contracts-docs.spec.ts` — view contract list, open contract detail, e-sign contract (programmatic canvas fill → name confirmation → submit → verify "Signed" status via API), download PDF.
- [ ] 9.10 Create `tests/e2e/03-client/event-photos.spec.ts` — verify gallery loads with thumbnails, download individual photo, share gallery link.
- [ ] 9.11 Create `tests/e2e/03-client/account-preferences.spec.ts` — view profile info, edit phone number and notification preferences → save → verify via API.

## 10. Public and Guest Page Tests

- [x] 10.1 Create `tests/e2e/04-public/marketing-homepage.spec.ts` — verify homepage loads at `EE_E2E_PUBLIC`, hero CTA clicks, nav menu links work, footer links work, SEO meta tags present.
- [x] 10.2 Create `tests/e2e/04-public/pricing-page.spec.ts` — verify pricing page loads, plan cards display, annual/monthly toggle works (if present), CTA buttons navigate to signup.
- [ ] 10.3 Create `tests/e2e/04-public/solutions-pages.spec.ts` — verify solutions page loads, click each vertical-specific page, FAQ accordions expand/collapse.
- [ ] 10.4 Create `tests/e2e/04-public/features-pages.spec.ts` — verify features page loads, feature detail pages load on click.
- [ ] 10.5 Create `tests/e2e/04-public/signup-trial.spec.ts` — verify signup form loads, form validation on empty submit, email format validation, successful submission navigates to confirmation page.
- [ ] 10.6 Create `tests/e2e/04-public/tenant-homepage.spec.ts` — verify tenant homepage at `EE_E2E_BASE`, service cards display, booking CTA navigates.
- [ ] 10.7 Create `tests/e2e/04-public/request-quote-form.spec.ts` — fill quote request form (Name, Email, Phone, Event Date, Event Type, Details → submit → verify success message), test validation on empty required fields.
- [x] 10.8 Create `tests/e2e/04-public/guest-music-requests.spec.ts` — fill music request form (Song Name, Artist, Dedication → submit → verify confirmation).
- [ ] 10.9 Create `tests/e2e/04-public/public-schedule.spec.ts` — verify public schedule page loads, calendar/availability displays.
- [ ] 10.10 Create `tests/e2e/04-public/blog.spec.ts` — verify blog listing loads, click article, category filter works.

## 11. Cross-Persona Workflow Tests

- [x] 11.1 Create `tests/e2e/05-workflows/lead-to-cash.spec.ts` — Owner creates inquiry → qualifies → creates booking → dispatches crew → Employee accepts → transitions through states → Owner invoices → verifies payment recorded. Each step asserted via API.
- [x] 11.2 Create `tests/e2e/05-workflows/quote-contract-sign.spec.ts` — Owner creates quote → generates contract → Client opens contract → e-signs → Owner sees "Signed" status. Verify audit trail via API.
- [x] 11.3 Create `tests/e2e/05-workflows/booking-dispatch-crew.spec.ts` — Owner creates booking → dispatches → assigns crew → Employee accepts → goes en-route → arrives → completes. Verify dispatch view reflects real-time status.
- [x] 11.4 Create `tests/e2e/05-workflows/invoice-payment.spec.ts` — Owner creates invoice → Client views invoice → Owner records payment → both see "Paid" status.
- [ ] 11.5 Create `tests/e2e/05-workflows/planning-form-submit.spec.ts` — Client fills planning form → saves draft → submits → Owner reviews submission on booking detail.
- [ ] 11.6 Create `tests/e2e/05-workflows/music-selection.spec.ts` — Client adds must-play/do-not-play/special-moment songs → Owner views selections on booking. Verify via `music` API.
- [x] 11.7 Create `tests/e2e/05-workflows/crew-shift-lifecycle.spec.ts` — Complete shift state machine: offered → accepted → en-route → on-site → break → resume → wrap-up → complete. Verify each state via `field.my_jobs` API with timestamps.
- [ ] 11.8 Create `tests/e2e/05-workflows/proposal-flow.spec.ts` — Owner builds proposal → sends → Client selects package → signs contract → makes deposit. Verify booking created and deposit recorded.

## 12. API Contract and Regression Tests

- [x] 12.1 Create `tests/e2e/06-api/portal-crud.spec.ts` — test `list_records` for all supported kinds (package, inquiry, job, invoice, venue, partner, asset, person, etc.) with each persona. Verify 200 response shape. Test create → read → update → delete lifecycle. Test invalid kind returns error. Test unauthenticated returns 403.
- [x] 12.2 Create `tests/e2e/06-api/portal-owner.spec.ts` — test owner-specific endpoints (dashboard_stats, etc.). Verify Employee and Client get 403.
- [x] 12.3 Create `tests/e2e/06-api/portal-employee.spec.ts` — test employee-specific endpoints. Verify data is scoped to authenticated employee.
- [x] 12.4 Create `tests/e2e/06-api/portal-client.spec.ts` — test client-specific endpoints. Verify data is scoped to authenticated client (no cross-client data).
- [x] 12.5 Create `tests/e2e/06-api/portal-dispatch.spec.ts` — test `job_crew` endpoint with valid and invalid job IDs. Verify response shape.
- [x] 12.6 Create `tests/e2e/06-api/portal-billing.spec.ts` — test invoice creation, payment recording endpoints. Verify amounts, statuses.
- [x] 12.7 Create `tests/e2e/06-api/portal-hr.spec.ts` — test team listing, role assignment. Verify Employee/Client get 403 on management endpoints.
- [x] 12.8 Create `tests/e2e/06-api/booking-api.spec.ts` — test booking create/update/cancel via API. Test availability check. Test validation errors on missing required fields.
- [x] 12.9 Create `tests/e2e/06-api/contract-api.spec.ts` — test contract generation, signing, status transitions via API.
- [x] 12.10 Create `tests/e2e/06-api/music-api.spec.ts` — test song request CRUD. Test categorized listing (must-play, do-not-play, special-moment).
- [x] 12.11 Create `tests/e2e/06-api/field-api.spec.ts` — test `my_jobs` returns employee-scoped data. Test shift state transitions via API.
- [x] 12.12 Create `tests/e2e/06-api/commerce-api.spec.ts` — test storefront product listing, cart, checkout endpoints.

## 13. Pagination, Filtering, and Sorting API Tests

- [x] 13.1 Add pagination tests to `portal-crud.spec.ts` — call with `page_size: 5, page: 1`, verify max 5 records returned with pagination metadata.
- [x] 13.2 Add filter tests to `portal-crud.spec.ts` — call with filter parameters, verify only matching records returned.
- [x] 13.3 Add sort tests to `portal-crud.spec.ts` — call with sort parameter, verify records returned in correct order.

## 14. Final Validation

- [x] 14.1 Run `npx playwright test tests/e2e/06-api/` and verify all API contract tests pass.
- [x] 14.2 Run `npx playwright test tests/e2e/01-owner/` and verify all Owner portal tests pass.
- [x] 14.3 Run `npx playwright test tests/e2e/02-employee/` and verify all Employee portal tests pass.
- [x] 14.4 Run `npx playwright test tests/e2e/03-client/` and verify all Client portal tests pass.
- [x] 14.5 Run `npx playwright test tests/e2e/04-public/` and verify all public page tests pass.
- [x] 14.6 Run `npx playwright test tests/e2e/05-workflows/` and verify all workflow tests pass.
- [x] 14.7 Run full suite `npx playwright test` and verify all ~436 tests pass green.
- [x] 14.8 Verify Playwright HTML report generates correctly with screenshots/videos for any failures.
