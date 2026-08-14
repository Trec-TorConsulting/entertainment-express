## Context

Phase 25 made `/owner`, `/employee`, and `/client` look like a product. The revenue and planning loops still live in Frappe Desk plus one-off pages (`/sign`, quote email links). `api/quote.py` can build/send/accept a Quotation and `check_asset_availability` only looks at **confirmed** commitments. `api/contract.py` signs via tokenized `/sign`. Planning forms, timelines, and music exist (phase 15) but `/client/planning` and `/client/pay` are empty states. `/owner/automations` is copy-only.

Research (not to copy as products): [HoneyBook](https://www.honeybook.com/) / [Goodshuffle Pro](https://pro.goodshuffle.com/) for proposal + inventory conflicts; [eventplanner.net](https://www.eventplanner.net/eventsoftware/event-management-software.php) for event-type checklists; [Eventsquid](https://www.eventsquid.events/features/) for clone/libraries and guest collaboration (not ticketing). EE remains a **mobile entertainment operator OS**, not a conference or planner marketplace.

Stakeholders: tenant owner, sales, paying client, event guests (no money), crew (packing lists). Isolation: site-per-tenant; guests stay `EE Event Guest` on that site.

## Goals / Non-Goals

**Goals:**
- Owner/sales send one **Proposal** from `/owner` (or `/employee` sales): branded package list, price, contract, deposit — client finishes on `/client` without Desk.
- `/client` Pay, Documents, Planning, Home next-action work against existing money/planning APIs.
- Event-type **workflow checklists** with relative due dates; owner Reminders is the inbox.
- **Potential vs actual** asset/crew conflicts on quotes/holds vs confirmed bookings.
- **Clone job** / save as template without copying payments or signatures.
- Tenant public site shows **catalog + wishlist/quote request** with images.
- Warehouse-only package lines on pull sheets, hidden from client proposal.

**Non-Goals:**
- Ticketing, CEU, speakers, exhibitors, badge printing, virtual event organizer (Eventsquid).
- Public vendor directory (eventplanner.net marketplace).
- AI concept → budget → stakeholder deck (EventPlanner.ai / phase 11).
- Appointments, venues/COI, vendor network, campaigns, two-way calendar, QB/Xero (later phases).
- Report builder, GL, new payment processors, new Kubernetes services.

## Decisions

### D1 — Proposal is a facade, not a new money DocType
A **Proposal** is the client-facing session over existing documents: `Quotation` + `EE Contract` + deposit `Sales Invoice` / Stripe Payment Intent. New DocType **EE Proposal Session** (or custom fields on Quotation: `ee_proposal_status`, `ee_proposal_token`, `ee_last_viewed_at`) holds token, view log, and which add-ons the client may toggle.

**Alt:** new `EE Proposal` that duplicates line items. **Rejected** — ledger stays on ERPNext Quotation/Invoice.

API module: `entertainment_express/api/proposal.py` wrapping `quote.py`, `contract.py`, and billing. Owner: `create_proposal`, `send_proposal`. Client (allow_guest with token **or** logged-in `EE Customer` on that Customer): `get_proposal`, `record_view`, `set_add_ons`, `sign_and_pay`. Guests 403 on all mutation and money reads.

Amounts: `frappe.utils.flt` only; API returns formatted strings.

### D2 — Client Pay / Sign / Planning are SPA routes, not redirects to stubs
`/client/pay` lists the customer’s open invoices and starts the existing Stripe (or configured processor) checkout. `/client/documents` lists `EE Contract` for their bookings; unsigned → in-SPA sign (reuse `sign_contract` audit fields; may keep `/sign?token=` as fallback). `/client/planning` tabs: questionnaire (`api/planning.py`), timeline, music, collaboration suggest/vote. Home computes next action: unsigned contract → Sign; unpaid deposit/balance → Pay; incomplete form → Planning.

**Alt:** keep Frappe www HTML for sign/pay. **Rejected** for the OS; token links may still land in SPA with query params.

### D3 — Workflow templates as EE DocTypes, not ERPNext ToDo-only
- **EE Workflow Template**: `template_name`, `event_type` (data, not hard-coded vertical), `active`.
- Child **EE Workflow Template Task**: `title`, `offset_days` (int, negative = before event), `role` (EE Sales / Dispatcher / Customer / …), `action_key` (`send_planning_form|confirm_timeline|final_payment|day_of_checklist|custom`).
- **EE Workflow Task**: `booking`, `template_task`, `due_date`, `assigned_user`/`role`, `status` (`open|done|dismissed`).

On booking confirm (and when event type is set), apply matching active template if none exists. Owner `/owner/automations` lists templates + toggles for notification keys (`deposit_chase`, `planning_form_reminder`, `proposal_follow_up`, `unsigned_contract`). Today inbox includes open workflow tasks.

Reuse Frappe ToDo optionally as a mirror; source of truth is `EE Workflow Task`.

### D4 — Potential vs actual conflicts
Extend `booking/availability.py` and `quote.check_asset_availability`:

| Severity | Sources | Send quote? | Confirm booking? |
|----------|---------|-------------|------------------|
| `actual` | Confirmed Event Booking, active holds, maintenance | Allow send with banner | Block (existing) |
| `potential` | Other Open/sent Quotations overlapping same unique asset/crew | Allow send with banner | N/A until accept |

Never auto-block sending a quote. On proposal accept / booking confirm, re-run actual check; if actual conflict, do not reserve; notify sales. Isolation: only this site’s documents.

### D5 — Clone job
`clone_booking(source, as_template=False)` copies event name suffix, date unset or +offset, items, assets (unassigned until availability check), timeline items, planning form template link (not answers), workflow template (not completed tasks), warehouse-only flags. **Never** copies: payments, invoices, signatures, chat, guests, Stripe IDs. `EE Job Template` is a Booking with `is_template=1` excluded from calendars and availability.

### D6 — Public catalog / wishlist
Tenant `/` and `/book` (existing public booking) list Service Packages with `published=1`, image, rate (formatted). Guest session or logged-in customer can `save_wishlist` → Lead + tentative inquiry (existing quote-only path). No second CMS. Brand: existing portal brand name/color **plus** logo + hero blurb already on marketing/tenant home where present; proposal PDF/SPA uses the same.

### D7 — Client-visible lines
Add `client_visible` (Check, default 1) on `Service Package Item` and quotation/booking item custom field. Proposal and client invoice descriptions omit `client_visible=0`. Packing list / run sheet include them. Totals **include** hidden lines (customer pays for cables even if unnamed) unless tenant sets `hide_and_absorb` later — **v1: include in total, omit line label**.

### D8 — Notifications
Enqueue existing `notifications.send` for: `proposal_sent`, `proposal_viewed` (staff), `proposal_follow_up` (scheduler, unsigned/unpaid), workflow task due, planning form reminder (phase 15 already). Fail open if Twilio missing.

### D9 — Files
| Area | Path |
|------|------|
| Proposal API | `entertainment_express/api/proposal.py` |
| Checklist | `entertainment_express/api/workflow.py` + DocTypes under `entertainment_express_core` or `crm` |
| Conflicts | `entertainment_express/booking/availability.py`, `api/quote.py` |
| Clone | `entertainment_express/api/booking.py` (`clone_booking`) |
| Storefront | `entertainment_express/www/` tenant home + `api/storefront.py` |
| Client SPA | `frontend/customer-portal/src/App.tsx` |
| Owner SPA | `frontend/owner-portal/src/App.tsx` (pipeline → proposal, automations, clone on job) |
| Kit | `frontend/portal-kit` ProposalViewer, ConflictBanner, Checklist |
| Tests | `tests/test_phase26_core_completeness.py` |

## Risks / Trade-offs

- **[Two quotes sign for the same booth]** → Potential warning on send; actual check on accept; loser stays quoted with conflict flag.
- **[Hidden lines surprise the client]** → Totals still match; proposal footer: “Includes required equipment.”
- **[Token vs session sign]** → Both; token must bind contract + customer email; logged-in customer must own the Customer link.
- **[Clone copies PII guests]** → Do not copy invites/chat.
- **[Scope]** → Tasks ordered: client pay/sign first, then proposal, then conflicts, checklists, clone, storefront.

## Migration Plan

1. Custom fields + new DocTypes via `patches.txt` / fixtures; `bench migrate` all tenant sites.
2. Backfill: existing Open Quotations get `ee_proposal_status=sent` if already emailed.
3. SPA rebuild into `public/{owner,employee,client}/`; bump bench image.
4. Rollback: previous image; new fields unused; no money reverse.

## Open Questions

- Absorb vs show hidden-line totals: **v1 include in total, hide labels** (D7).
- Co-host paying: **out** (phase 25).
- Multi-currency proposals: follow company default; no new currency engine.
