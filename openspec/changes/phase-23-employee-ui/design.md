# Design: Phase 23 — /employee UI

> Prereq: phase-21 tokens (ops-density). Read `employee-portal` spec.

## A. IA

| Area | Content |
|------|---------|
| My Day | Role-specific cards: today's jobs, at-risk, inbox, clock/timesheet |
| Sales | Leads/quotes (list + detail) |
| Dispatch | Embed or deep-link existing dispatch board; same tokens |
| Field | Assignments, check-in/out CTAs (mobile API) |
| Accounting | Invoices/payments read views per role |
| Command palette | Existing kit, keyboard `/` |

## B. Visual

- **Compact** density: smaller StatCard, sticky table headers, status chips.
- Left nav on desktop; bottom nav on phone (Home, Dispatch/Field, Search, Me).
- Do not copy marketing hero layouts into ops screens.

## C. Implementation

`frontend/employee-portal/src/App.tsx` routes + portal-kit. Rebuild `public/employee/`. Dispatch
portal Tailwind preset must use the same tokens file.
