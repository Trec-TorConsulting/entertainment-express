# Design: Phase 24 — Owner UI (`/owner`)

> Prereq: phase-21 tokens (cockpit). Read `owner-portal` spec.

## A. URLs

- Canonical: `/owner` only.
- Operator: `/app` unchanged.
- Do not add `/admin`.

## B. IA

| Nav | Job |
|-----|-----|
| Overview | Revenue, pipeline, at-risk, outstanding (API strings) |
| Approvals | Queue + approve/reject |
| Money | Read-only financial overview |
| Team | Users/roles (no self-escalation to System Manager) |
| Catalog | Packages/pricing |
| Settings | Portal branding, feature toggles |

## C. Visual

- Cockpit: 4–6 StatCards, then approvals, then upcoming events.
- Owner chrome sits between client (airy) and employee (dense).
- Settings forms use kit FormField; brand color picker writes `EE Portal Settings` only.

## D. Implementation

`frontend/owner-portal`, `app/www/owner/index.html`. Rebuild `public/owner/`. Isolation + permission
tests: employee hitting `/owner` is denied (existing phase-20 behavior).
