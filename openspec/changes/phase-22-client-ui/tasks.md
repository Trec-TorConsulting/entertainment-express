# Tasks: Phase 22 — /client UI

> **Status:** Delivered, then superseded by phase-25 Experience OS (`/client` OS IA, guest vs payer).
> Checkboxes match ROADMAP.

> Prereq: phase-21 tokens merged.

## 1. Shell & IA
- [x] 1.1 Customer AppShell nav: Home, Bookings, Documents, Pay, Planning, Messages.
      **Accept:** all six reachable; Messages may empty-state.
- [x] 1.2 Home next-action: sign / pay / upcoming event from existing APIs.
      **Accept:** outstanding deposit surfaces Pay.

## 2. Screens
- [x] 2.1 Restyle booking list/detail, sign, pay using portal-kit (Money, EmptyState, tokens).
      **Accept:** no float math; 375px usable.
- [x] 2.2 Align `www/client/*.html` chrome with the SPA.
      **Accept:** hosted sign/pay/planning do not look like a different product.

## 3. Validate
- [x] 3.1 Isolation: customer A cannot see B (existing API tests still pass).
- [x] 3.2 Rebuild `public/client/` + bench image; `/client` loads new bundle.
      **Accept:** main.js 200 on a tenant host.
