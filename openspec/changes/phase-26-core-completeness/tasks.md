# Tasks: Phase 26 — Core Completeness

> Usable revenue + planning loops without Desk. Isolation tests on every payer API.

## 1. Client Pay & Documents

- [x] 1.1 Payer APIs: `portal_client.list_invoices`, `start_checkout`, `list_contracts`, `get_contract`, `sign_contract`. Guests 403.
      **Accept:** pytest guest deny; amounts are strings.
- [x] 1.2 `/client/pay` and `/client/documents` list + checkout + in-portal sign. Home next action Sign then Pay.
      **Accept:** guest UI still has no Pay; SPA rebuilt.

## 2. Stripe ownership

- [x] 2.1 `create_checkout` allows `EE Customer` only for invoices they own; staff unchanged.
      **Accept:** other customer 403; guest 403.

## 3. Proposal wizard

- [x] 3.1 Owner Proposal from pipeline/job: packages → quotation → contract send → deposit invoice.
      **Accept:** no DocType names in UI; client Home shows Sign.
- [x] 3.2 Client can view the proposal package list (read) then Sign/Pay.
      **Accept:** guest cannot open Pay from proposal.

## 4. Planning hub (real forms)

- [x] 4.1 Wire phase-15 planning form, timeline, and music APIs into `/client/planning` (keep ideas/votes).
      **Accept:** submitting a form persists on that booking only.

## 5. Clone, catalog, pull sheets

- [x] 5.1 Clone job to a new date with availability check.
      **Accept:** conflict rejects; no copied assignments.
- [x] 5.2 Public catalog + customer wishlist on the tenant site.
      **Accept:** tenant isolation; guest browse, customer save.
- [x] 5.3 Pull sheets warehouse/stock lines only.
      **Accept:** service-only items omitted.

## 6. Conflicts & checklists

- [x] 6.1 Flag approved plan items missing from quote/booking lines.
      **Accept:** owner sees conflict; resolving the line clears it.
- [x] 6.2 Event-type workflow checklist (data-driven steps) on owner Today / job detail.
      **Accept:** no hard-coded vertical names in code.

## 7. Ship

- [x] 7.1 Isolation pytest: guest pay/sign deny; customer A cannot checkout B; clone conflict.
- [x] 7.2 Rebuild `public/{owner,employee,client}/` and bench image.
      **Accept:** main.js 200; `/client/pay` lists invoices for a payer.
