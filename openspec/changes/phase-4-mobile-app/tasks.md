# Tasks: Phase 4 — Mobile App & Customer Portals

> Prereq: **Phase 1–3 complete and deployed to staging cluster.**

## 1. Mobile API v2 (design §E)
- [x] 1.1 Create `api/mobile_api_v2.py` with crew endpoints (12 functions).
      **Accept:** GET /api/v2/crew/assignments returns paginated list; POST endpoints verify JWT token.
- [x] 1.2 Implement dispatch real-time endpoints (WS + day-view).
      **Accept:** WebSocket upgrade works; crew location updates push to connected clients.
- [x] 1.3 Implement customer portal API endpoints (4 functions).
      **Accept:** GET /api/v2/customer/bookings lists customer's bookings; crew-status shows real-time status.

## 2. Crew Mobile App (design §B)
- [x] 2.1 Scaffold React Native project (Expo or native).
      **Accept:** App builds and runs on iOS simulator + Android emulator.
- [x] 2.2 Implement shift offer screen (list, accept/decline buttons).
      **Accept:** Tapping accept calls API with token; shift status updates in real-time.
- [x] 2.3 Implement check-in screen (GPS + photo capture).
      **Accept:** Check-in captures GPS coordinates, timestamp, optional photo; updates booking status.
- [x] 2.4 Implement check-out screen.
      **Accept:** Check-out records duration, auto-completes booking if last crew member; notifies customer.
- [x] 2.5 Implement run sheet viewer (equipment, checklist, map).
      **Accept:** Displays full booking details, equipment list, checklist checkboxes sync to API.
- [x] 2.6 Implement timesheet viewer (weekly hours, notes).
      **Accept:** Shows approved timesheets, pending timesheets awaiting manager approval.
- [x] 2.7 Implement offline mode (SQLite cache + sync).
      **Accept:** App caches run sheet when online; functions without network; re-syncs when online.
- [x] 2.8 Implement push notifications (Firebase Cloud Messaging).
      **Accept:** Shift offer notification triggers app, deep link opens shift detail.

## 3. Customer Portal (design §C)
- [x] 3.1 Scaffold React + TypeScript + Tailwind SPA.
      **Accept:** Dev server runs on localhost:3000; builds to static HTML.
- [x] 3.2 Implement dashboard (bookings list, timeline, quick actions).
      **Accept:** Shows upcoming/past bookings; each booking has status badge + actions.
- [x] 3.3 Implement booking detail page (quote, contract, payment, crew).
      **Accept:** Full booking timeline; contract signing embedded; payment link works; crew locations map.
- [x] 3.4 Implement crew tracking map (real-time locations).
      **Accept:** Shows crew member locations if check-in triggered; updates every 30s via WebSocket.
- [x] 3.5 Implement messaging/notes feature.
      **Accept:** Customer can send notes to crew/coordinator; notifications trigger.
- [x] 3.6 Implement responsive UI (mobile, tablet, desktop).
      **Accept:** Portal works on iPhone 12, iPad, MacBook; touch-friendly on mobile.

## 4. Dispatch Portal (design §D)
- [x] 4.1 Scaffold dispatch portal SPA (React + TS).
      **Accept:** Builds successfully; loads in browser.
- [x] 4.2 Implement dispatch board (day view, crew status, at-risk flags).
      **Accept:** Shows all bookings for today; crew count + status per booking; red flags for at-risk.
- [x] 4.3 Implement real-time updates (WebSocket, crew locations map).
      **Accept:** Crew location map updates every 30s; at-risk alerts pop in real-time; latency <500ms.
- [x] 4.4 Implement run sheet management (generate, publish, completion %).
      **Accept:** Generate creates equipment list + checklist; publish sends notification; track % complete.
- [x] 4.5 Implement drag-drop crew scheduler (assign shifts).
      **Accept:** Drag crew avatar to time slot; conflict check; create assignment + send offer.
- [x] 4.6 Implement analytics (utilization %, crew reliability, reports).
      **Accept:** Dashboard shows crew utilization; repeat booking counts; export CSV.

## 5. Authentication & Security
- [x] 5.1 Implement JWT token generation & verification for mobile API.
      **Accept:** Mobile app exchanges HMAC token for JWT; JWT valid for 1h with refresh flow.
- [x] 5.2 Implement scope-based permissions (crew_read, customer_read, etc.).
      **Accept:** Customer cannot call crew APIs; crew cannot list all customers.
- [x] 5.3 Implement API rate limiting (per user, per IP).
      **Accept:** >100 req/min throttled; returns 429 with retry-after header.

## 6. Testing & Validation
- [x] 6.1 Unit tests for mobile API v2 endpoints.
      **Accept:** 20+ tests passing (CRUD, permissions, pagination).
- [x] 6.2 Integration tests for crew app flow (shift accept → check-in → check-out).
      **Accept:** Full flow works end-to-end; booking status transitions correctly.
- [x] 6.3 Smoke test: crew app + customer portal + dispatch portal together.
      **Accept:** All three apps working simultaneously; WebSocket updates cross-apps.
- [x] 6.4 Load test (100 concurrent users on dispatch board).
      **Accept:** WebSocket handles 100+ concurrent; <500ms latency.
- [x] 6.5 Mobile app testing (iOS simulator, Android emulator, physical device).
      **Accept:** App functions on iOS 14+ and Android 10+; no crashes.

## 7. Deployment
- [x] 7.1 Build & push mobile app to Expo EAS or App Store.
      **Accept:** iOS & Android builds available for QA testers.
- [x] 7.2 Deploy customer & dispatch portals (built into Frappe app assets + optional Vercel standalone).
      **Accept:** Path shells work on each tenant host — see production URL scheme below (not separate
      `customer.` / `dispatch.` apex hosts).
- [x] 7.3 Update K8s Frappe deployment to serve portals (reverse proxy).
      **Accept:** API routing works (/api/v2/* hits Frappe); SPA routing works (/* hits React).

## Definition of Done (phase gate)
- [x] Crew accepts shift via mobile app
- [x] Crew checks in (GPS + photo)
- [x] Customer sees crew location on portal map in real-time
- [x] Dispatcher sees both crew on dispatch board
- [x] Crew checks out
- [x] Booking marked complete
- [x] Timesheet auto-created; crew can view on app
- [x] All 3 apps working simultaneously with <500ms latency
- [x] 20+ unit tests, 5+ integration tests all passing
- [x] Apps deployed to staging + production URLs

Then proceed to **phase-5-vendor-network**.

> **Production URL scheme (authoritative):**
> - Main / control plane: `https://entx.app`
> - Tenant site: `https://{customer}.entx.app`
> - Tenant client portal: `https://{customer}.entx.app/client`
> - Tenant admin cockpit: `https://{customer}.entx.app/admin` (`/owner` remains a legacy alias)
> - Field / dispatch shells also on the tenant host: `/customer`, `/dispatch`, `/employee`
>
> Live E2E driver: `scripts/e2e_phase4_dod.py` (default `https://funytown.entx.app`).
> Path shells verified (`/client`, `/customer`, `/dispatch` → 200 on funytown).
