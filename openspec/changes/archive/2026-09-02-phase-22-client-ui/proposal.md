## Why

`/client` is the end-customer product: bookings, contracts, pay, planning, music, messages. The SPA and
www host pages exist (phase-4 / phase-20) but the UI is still a skeleton. Customers will not sign and
pay on a page that looks unfinished. This phase is **visual and interaction design** over the existing
customer-portal APIs — not a new backend.

## What Changes

- Redesign `/client` (and `/client/*` host pages: sign, pay, planning, music, timeline) to the
  phase-21 visual system.
- A clear customer information architecture: Home, Bookings, Documents, Pay, Planning, Messages.
- Mobile-first layouts, empty states, and trust cues (what they owe, what they signed, next action).
- Align `frontend/customer-portal` + `app/www/client/*.html` so the shell and Frappe pages do not
  visually fork.
- No new DocTypes. Reuse existing customer APIs. Isolation: a customer sees only their records.

## Capabilities

### New Capabilities
- (none — visual layer only)

### Modified Capabilities
- `customer-portal`: add UX requirements (IA, next-best-action home, mobile, a11y, branded via
  `EE Portal Settings`) on top of existing account/dashboard/sign/pay requirements.
- `ui-design-system`: consume (do not fork) tokens from phase-21.

## Impact

- `frontend/customer-portal/src/**`, `app/www/client/**`, `app/www/customer/index.html` if still routed.
- Rebuild SPA into `public/client/` and roll the bench image.
- **Depends on:** phase-21 (tokens), phase-20 (kit, branding), phase-1 (`/client` APIs).
- **Does not replace:** phase-7 full customer-portal *capability* expansion (questionnaires, messaging
  depth) — this phase polishes what already ships.
