# Design: Phase 22 — /client UI

> Prereq: phase-21 tokens. Read `customer-portal` spec and `frontend/customer-portal`.

## A. IA

| Nav | Route (SPA or www) | Job |
|-----|--------------------|-----|
| Home | `/client` | Next action: pay / sign / upcoming event |
| Bookings | `/client` bookings list/detail | Status, crew ETA, documents |
| Documents | contracts | Sign CTA |
| Pay | `/client/pay` | Deposit/balance, never raw PAN |
| Planning | `/client/planning`, music, timeline | Event details |
| Messages | existing thread if present | Else empty state with "we'll email you" |

## B. Visual

- Import portal-kit tokens. Customer chrome is **calm / consumer** (more whitespace than employee).
- AppShell: tenant logo, customer name, log out.
- Booking status chips use semantic colors from tokens only.
- Money via `Money` component (string from API, never JS float math).

## C. Implementation

Polish `frontend/customer-portal` screens and `app/www/client/*.html` wrappers so hosted pages share
header/footer CSS classes with the SPA. Rebuild `public/client/`. Isolation: API tests already in
phase-20; add a visual regression note (manual checklist on iPhone + desktop), not a new backend.
