## Why

Tenant owners currently have a scaffold at `/owner`. This phase designs that **Owner UI** — the business
cockpit for `EE Tenant Admin`. The SaaS operator Desk at `/app` on `admin.{base_domain}` stays Desk;
this phase does not restyle ERPNext Desk and does not add an `/admin` route.

## What Changes

- Redesign `/owner` to the phase-21 visual system: cockpit, approvals, money (display-only strings),
  team/access, catalog/settings.
- Owner IA: Overview, Approvals, Money, Team, Catalog, Settings — task-first, not Desk modules.
- No `/admin` alias. Canonical owner home remains `/owner` (phase-20).
- No new money logic, no second backend.

## Capabilities

### New Capabilities
- (none)

### Modified Capabilities
- `owner-portal`: add UX requirements for the cockpit layout and visual density.
- `ui-design-system`: consume cockpit layout (stat row, approval queue, settings forms).

## Impact

- `frontend/owner-portal/src/**`, `app/www/owner/index.html`.
- Rebuild `public/owner/` and roll the bench image.
- **Depends on:** phase-21, phase-20.
- **Does not:** expose tenant owners to `/app` or build a custom SaaS-operator SPA.
