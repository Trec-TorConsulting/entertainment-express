## Context

`/owner` and `/employee` are shells (nav + empty APIs). `/client` is still a skeleton. Backend capabilities (bookings, catalog, dispatch, billing, planning forms, timeline) already exist as Frappe DocTypes and whitelisted methods; they are not wired into a single consumer-grade UX. There is **no** event-guest / invitee model and **no** booking-scoped chat with guests.

Stakeholders: tenant owner (may or may not be talent), staff, paying client, invited party members. Isolation remains site-per-tenant; guests are additional users on the **same** tenant site, permission-scoped to one booking.

## Goals / Non-Goals

**Goals:**
- One portal-kit product, three densities: cockpit (`/owner`), ops (`/employee`), consumer (`/client`).
- Owner can do everything; optional **Company | Talent** switch when they also hold `EE Entertainer` or `EE Crew`.
- Client portal is complete for the paying customer; invitees get community/planning only (no pay, no contract, no invoice mutation).
- Canned reports per URL; currency-safe; CSV/PDF.
- Language a DJ/rental owner understands (Today, Jobs, Money, Team) — never DocType names.

**Non-Goals:**
- Report builder, custom SQL, GL / Chart of Accounts / journal entries in these portals.
- Restyling SaaS operator Desk (`/app`).
- Marketing homepage (phase-21) except sharing tokens.
- Replacing the Expo crew app; `/employee` Talent/Field is the web equivalent and deep-links the app where installed.
- Cross-tenant chat or guests seeing other customers’ events.

## Decisions

### D1 — One family, three skins (not three apps)
Shared `frontend/portal-kit`: tokens, AppShell (density + optional mode switcher), DataTable, Money, empty states, command palette. Each SPA stays its own Vite app (existing build into `public/{owner,employee,client}/`) so Frappe www hosts and CSRF/bootstrap stay simple. Screens for Booking, Quote, Invoice are kit components imported by owner and employee (and read-only slices for client).

**Alt considered:** one React app with three basenames — harder to ship on Frappe www. **Rejected** for this phase.

### D2 — Owner Company | Talent tabs
If roles include `EE Tenant Admin` **and** (`EE Entertainer` or `EE Crew`), header shows **Company | Talent**. Company = full OS. Talent = employee My Day / field workspace for *this user*. If owner is not talent, no second tab. Owner still reaches Talent views of *other* crew from Company → People / Dispatch.

**Alt:** separate `/owner/talent` URL only. **Both:** tabs *and* routes `/owner` vs `/owner/talent`.

### D3 — Event collaboration data model (new)
On the tenant site:

- **EE Event Guest** role (Website User). Cannot be granted `EE Customer` payer powers via invite.
- DocType **EE Event Invite**: `booking`, `email`, `full_name`, `user` (link), `status` (`invited|accepted|revoked`), `invited_by` (must be booking customer or staff/owner). Unique `(booking, email)`.
- DocType **EE Event Plan Item**: `booking`, `item` (optional Item/package), `title`, `source` (`client|guest|staff`), `status` (`suggested|shortlisted|approved|rejected`), vote counts as child or separate **EE Event Vote** (`plan_item`, `user`, `value`).
- DocType **EE Booking Message**: `booking`, `author`, `body`, `created`. Participants: booking customer, accepted invites, assigned crew/entertainers, plus staff with EE Dispatcher/Sales/Tenant Admin. Server filters every read/write by membership.

Payer actions (`pay`, `sign`, `request refund`) stay `EE Customer` on that Customer record only.

Invite flow: client enters email → user created or linked as Website User + `EE Event Guest` → email/SMS with magic link to `/client/events/{booking}` (guest bootstrap). Guests hitting `/client` see **that event’s planning hub**, not a fake customer dashboard.

### D4 — Client IA
Paying customer nav: **Home, Events, Pay, Documents, Planning, People (invites), Chat, Photos**.  
Guest nav: **This event, Planning, Chat, Photos** — no Pay, no Documents money, no invite-admin unless we later add co-host (v1: only the customer invites/revokes).

### D5 — Owner / Employee IA (Company OS)
Owner Company nav (plain language):

| Nav | Does |
|-----|------|
| Today | Jobs this week, money in/out, at-risk, inbox (approvals + unread chat) |
| Calendar | All bookings; create/edit |
| Pipeline | Leads → quotes → contracts |
| Dispatch | Existing `/dispatch` embed + at-risk |
| Catalog | Packages, add-ons, prices |
| Gear | Fleet/inventory/holds |
| People | Staff, roles, payouts, availability |
| Money | Invoices, deposits, payouts (no GL) |
| Reports | Canned pack + export |
| Automations | Reminders / notification toggles (existing notification settings) |
| Brand | Logo, color, public site copy, contract templates (existing DocTypes) |

Employee: **My Day** + only modules their roles allow (same components). Bottom nav on phone: Home, primary ops, Search, Me.

### D6 — Reports v1 (canned, per URL)

**`/owner` Reports** (company):
- This week / this month: jobs, revenue (recognized), outstanding, deposits held
- Pipeline: lead → quote → booked conversion
- At-risk jobs (no crew within 48h, unpaid deposit past policy)
- Gear & people utilization
- Payouts due (1099/crew)
- By service type (from catalog, not hard-coded verticals)

**`/employee` Reports** (role-filtered):
- Sales: my pipeline, conversion, follow-ups due
- Dispatch: today’s board load, at-risk, unassigned
- Field: my hours, upcoming calls (no company P&L)
- Accounting: aging invoices, deposits to apply (no chart of accounts)

**`/client` (payer only; guests get none):**
- This event: what I owe, what I paid, what’s left
- History: past events and receipts
- No company KPIs

All amounts from backend `fmt_money` / report APIs. Export CSV/PDF. Isolation tests per pack.

### D7 — Wire existing APIs first, then collaboration
Implementation order: kit densities → owner Today/Calendar/Pipeline/Money using existing whitelist methods → employee My Day → client Home/Pay/Documents on existing customer APIs → then Event Invite/chat/votes → reports. Empty states with one next action when data is missing.

### D8 — Dual-role operators
Keep `require_owner_login` / `require_employee_login` allowing explicit URL if the user has that portal role (already shipped 0.0.50). Guests use `/client` only.

## Risks / Trade-offs

- **[Guest is a User on the tenant site]** → Mitigation: Website User + `EE Event Guest` only; permission queries on every DocType; never `ignore_permissions` except audited invite insert.
- **[Chat volume]** → Mitigation: booking-scoped messages, no global inbox search across customers for guests; staff see threads they are members of.
- **[Owner wants GL]** → Mitigation: Money views + export; “Download for accountant” PDF; no Desk.
- **[Scope blow-up]** → Mitigation: tasks ordered so first vertical slice (Today + one booking detail + client pay + invite) is demoable before Catalog/Gear/Automations polish.
- **[Invite spam]** → Mitigation: rate-limit invites per booking; revoke invalidates link.

## Migration Plan

- No data migration. New DocTypes via `bench migrate` on tenant sites.
- Seed `EE Event Guest` role in existing role bootstrap.
- SPA rebuilds + image tag. Rollback: previous bench image; new DocTypes remain unused.
- Feature flag: `EE Portal Settings.collaboration_enabled` default **on** for new tenants; existing tenants on.

## Open Questions

- Co-host who can invite others: **out of v1** (customer only invites).
- Guest account used on two bookings with two tenants: separate sites, separate users — OK.
- Whether assigned entertainer **must** be in chat by default: **yes**.
