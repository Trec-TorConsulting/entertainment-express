# Tasks: Phase 26 — Core Completeness

> Wire existing quote, contract, billing, and planning APIs into the three portals. No ticketing, marketplace, or AI decks. Isolation tests on every money and booking API.

## 1. Schema

- [x] 1.1 Quotation custom fields: `ee_proposal_status`, `ee_proposal_token`, `ee_last_viewed_at` (fixtures in `setup/custom_fields.py`).
      **Accept:** migrate clean; existing quotes still open.
- [x] 1.2 `client_visible` Check default 1 on `Service Package Item` and matching custom field on `Quotation Item` / `Event Booking Item`.
      **Accept:** hidden line still in totals via `flt`.
- [x] 1.3 Package image + `published` on Service Package (or Item) for storefront.
      **Accept:** unpublished hidden from public catalog API.
- [x] 1.4 DocTypes `EE Workflow Template`, child `EE Workflow Template Task`, `EE Workflow Task`; Event Booking `is_template` Check.
      **Accept:** listed in `modules.txt` / `patches.txt`; migrate on a tenant site.

## 2. Client money and documents (unblock usability)

- [x] 2.1 `/client/pay` lists open invoices/deposits and starts existing processor checkout (`api/proposal.py` or billing wrapper). No self-link empty state.
      **Accept:** customer pays deposit; guest 403; amounts are strings.
- [x] 2.2 `/client/documents` lists contracts/receipts; unsigned contract signs via existing `sign_contract` audit fields (SPA or token landing in SPA).
      **Accept:** signed contract has signer + timestamp; guest 403.
- [x] 2.3 `/client` Home next action: unsigned → Sign, else unpaid → Pay, else incomplete planning → Planning.
      **Accept:** pytest for priority; isolation across customers.

## 3. Planning hub

- [x] 3.1 `/client/planning` loads form instance, timeline (client-visible items), music lists, suggest/vote.
      **Accept:** save form progress; guest no Pay nav; other booking 403.
- [x] 3.2 Owner job view shows planning completion percent.
      **Accept:** incomplete booking listed on Today when form < 100%.

## 4. Proposal

- [x] 4.1 `api/proposal.py`: `create_proposal`, `send_proposal`, `get_proposal`, `record_view`, `set_add_ons`, `sign_and_pay` wrapping `quote.py` / `contract.py` / billing. Money with `flt`.
      **Accept:** end-to-end test quote → sign → deposit → booking; guest 403 on sign_and_pay.
- [x] 4.2 Owner Pipeline/job: preview + Send Proposal; status sent/viewed/accepted. Employee sales same with Customer permission.
      **Accept:** no DocType names in UI; salesperson cannot send another tenant’s (site) or unauthorized Customer.
- [x] 4.3 Notifications: proposal_sent, proposal_viewed, follow-up scheduler; no crash without Twilio.
      **Accept:** view queues staff notice; send without Twilio still returns 200.

## 5. Conflicts

- [x] 5.1 Extend `booking/availability.py` + `quote.check_asset_availability` with `actual` vs `potential` (other Open quotations).
      **Accept:** two overlapping quotes → potential; confirmed booking → actual blocks confirm; send quote allowed on potential.
- [x] 5.2 ConflictBanner in owner/employee proposal UI.
      **Accept:** banner copy is business language, not DocType names.

## 6. Checklists and automations

- [x] 6.1 Apply workflow template on booking confirm by event type (idempotent).
      **Accept:** wedding template offsets due dates from event_date; second confirm does not duplicate tasks.
- [x] 6.2 `/owner/automations` lists templates + toggles deposit chase, planning reminder, proposal follow-up.
      **Accept:** not EmptyState; disable deposit chase skips that job for the tenant.
- [x] 6.3 Today inbox includes open `EE Workflow Task`.
      **Accept:** complete action sets task done.

## 7. Clone and hidden lines

- [x] 7.1 `clone_booking` copies items, timeline structure, template links, `client_visible`; not payments, signatures, chat, guests.
      **Accept:** pytest; `is_template` bookings excluded from calendar/availability.
- [x] 7.2 Pull sheet includes warehouse-only lines; Proposal line list omits names; totals include amounts.
      **Accept:** packing API vs get_proposal line arrays differ; grand_total equal.

## 8. Public catalog

- [x] 8.1 Guest `api/storefront.py` lists published packages (image, formatted rate) for this host only.
      **Accept:** tenant A catalog empty of tenant B items (site isolation).
- [x] 8.2 Wishlist submit → Lead + inquiry with selected packages.
      **Accept:** quote-only path; spam rate-limit on public POST.

## 9. Ship

- [x] 9.1 `tests/test_phase26_core_completeness.py`: guest deny pay/sign; potential vs actual; clone no payments; storefront isolation.
      **Accept:** pytest on tenant site.
- [x] 9.2 Rebuild `public/{owner,employee,client}/`; bump bench image; migrate tenant sites.
      **Accept:** `/client/pay` and `/owner` Send Proposal load for the right roles.
