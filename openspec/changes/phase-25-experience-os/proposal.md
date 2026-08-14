## Why

Phases 23/24 shipped portal chrome, not a company. Owners, staff, and clients still cannot run an entertainment business (or plan a wedding) without Desk. We need one product family—three skins over the same tenant data—that is the daily OS: `/owner` (all company functions, optional Talent tab), `/employee` (role-sliced work), `/client` (the client’s entire job, including invited guests).

## What Changes

- Treat `/owner`, `/employee`, and `/client` as **one app family, three skins** (cockpit / ops / consumer) sharing portal-kit, objects, and copy. No Desk for these audiences.
- **Owner (1A):** full access to every company function. If the owner is also talent, a **Company | Talent** switch (two “tabs”) — Company is the OS; Talent is the same field “My Day” staff see. Owner need not be an entertainer.
- **Employee:** same screens filtered by role. Phone-first for crew. Dispatch reuses the existing board, not a second product.
- **Client (start now, not after marketing):** `/client` is where the paying customer does **all** their work — bookings, contracts, pay, planning, messages, deliverables. They may **invite people** to an event (wedding party, co-hosts). Invitees are **not** payers: read-only commercial data, plus community planning (ideas, votes, pick-from-catalog suggestions) and a **booking chat** with the client, other invitees, and assigned entertainer(s). Isolation: invitee sees only that booking.
- UX bar: no ERP jargon, no “tech,” next action always obvious. Money stays API strings.
- **Reports v1** are canned + export, tailored per URL (see design). No report builder. No GL/Chart of Accounts in these portals.
- **BREAKING (product):** chrome-only IA from phase-22/23/24 (six stub nav items, empty money) is replaced by the OS IA below. Routes `/owner`, `/employee`, `/client` stay. `/admin` stays gone.
- New backend for event invites, guest role, planning collaboration, and booking-scoped chat (not present today). Reuse existing booking, catalog, dispatch, CRM, billing, planning-form, and notification APIs everywhere else.

## Capabilities

### New Capabilities
- `event-collaboration`: booking-scoped guests (invite/revoke), guest vs payer permissions, collaborative planning (suggest/vote/comment on catalog and plan items), booking chat (client + guests + assigned talent/staff).

### Modified Capabilities
- `owner-portal`: full company OS IA, Company/Talent mode, canned owner reports, no-tech UX.
- `employee-portal`: role-sliced views of the same objects; Talent/My Day; canned staff reports.
- `customer-portal`: complete client OS; invite guests; payer-only money; planning hub; chat.
- `identity-access`: role `EE Event Guest`; invitee cannot receive `EE Customer` payer powers; owner still cannot grant System Manager.
- `reporting-bi`: canned report packs per portal URL; CSV/PDF export; no builder in v1.
- `notifications`: booking-chat and invite emails/SMS using existing channels.

## Impact

- Frontends: `frontend/portal-kit`, `frontend/owner-portal`, `frontend/employee-portal`, `frontend/customer-portal` (and dispatch embed). Rebuild `public/{owner,employee,client,dispatch}/`.
- Backend: new DocTypes/APIs under `entertainment_express` for collaboration; extend `api/portal_owner.py`, `portal_employee.py`, customer portal APIs; identity roles; isolation tests (guest A cannot see booking B; invitee cannot pay).
- Depends on existing: phase-1 bookings/pay, phase-2 dispatch, phase-3 HR, phase-4/5 catalog/fleet/billing, phase-15 planning forms/timeline, phase-20 portal guards.
- Does not: restyle SaaS operator Desk; expose GL; build marketing homepage (phase-21 can follow once skins share tokens).
- Cluster: bench image bump after SPA + API land.
