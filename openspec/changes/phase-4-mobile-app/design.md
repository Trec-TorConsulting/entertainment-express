# Design: Phase 4 — Mobile App & Customer Portals

> Prereq: Phases 1–3 complete. All backend APIs functional.

---

## A. Architecture Overview

### Frontend Stack
- **Crew Mobile App:** React Native (iOS/Android) or Flutter
- **Customer Portal:** React 18 + TypeScript + Tailwind CSS
- **Dispatch Portal:** React 18 + TypeScript + Tailwind CSS
- **Real-time:** WebSocket upgrade for live dispatch board updates

### Backend Enhancements
- **Mobile API v2:** New REST endpoints optimized for low-bandwidth, high-latency field use
- **JWT Auth:** Token-based auth (in addition to session) for mobile apps
- **Caching:** Redis caching layer for read-heavy queries (crew assignments, event details)
- **WebSocket:** Socket.IO integration for dispatch board real-time updates

---

## B. Crew Mobile App

**Platform:** iOS + Android (React Native or Flutter)  
**Target Users:** Field crew (DJ, MC, dancers, etc.)  
**Key Features:**

| Feature | Description |
|---------|-------------|
| **Shift offers** | Push notification → tap to accept/decline (HMAC token) |
| **Check-in/out** | GPS-tagged, photo capture, auto-complete booking |
| **Run sheets** | Equipment list, checklist, venue map, crew contacts |
| **Timesheets** | View hours, submit notes, attach photos |
| **Notifications** | Shift offers, check-in reminders, payment confirmations |
| **Offline mode** | Cache run sheet + checklist, sync when online |

**Tech:**
- React Native (Expo or bare) or Flutter
- Firebase Cloud Messaging (push notifications)
- Geolocation API (check-in GPS)
- Image picker (photos)
- Local database (SQLite or Realm for offline cache)

**APIs Used:**
- `GET /api/v2/crew/me` — profile + pending shifts
- `GET /api/v2/crew/assignments` — list crew assignments
- `POST /api/v2/crew/shift/{id}/accept` (token)
- `POST /api/v2/crew/shift/{id}/decline` (token)
- `POST /api/v2/crew/check-in` — GPS + photo
- `POST /api/v2/crew/check-out` — timestamp
- `GET /api/v2/crew/run-sheet/{booking_id}` — full details
- `GET /api/v2/crew/timesheets` — list timesheets
- `POST /api/v2/crew/timesheet/{id}/submit-notes` — add notes

---

## C. Customer Portal (Web)

**Target Users:** Event organizers, booking managers  
**Key Features:**

| Feature | Description |
|---------|-------------|
| **Dashboard** | Upcoming bookings, pipeline status, quick actions |
| **Booking timeline** | Quote → contract → payment → crew assigned → completed |
| **Contract signing** | Embedded signing (same as email link, but in portal) |
| **Payment** | Deposit checkout link, receipt tracking |
| **Crew tracking** | Real-time crew location map (if permissions granted) |
| **Messaging** | Send notes/requests to crew or coordinator |
| **Event details** | Venue, capacity, setup requirements, equipment list |
| **Post-event** | Feedback, final invoice, timesheet approval (if admin) |

**Tech:**
- React 18 + TypeScript
- Tailwind CSS + shadcn/ui components
- React Query for data fetching
- Zustand for state management
- Mapbox or Google Maps for crew location
- react-signature-canvas for signature capture

**Layout:**
- Responsive (mobile-friendly, but primary target is desktop/tablet)
- Dark mode support
- Accessibility (WCAG 2.1)

---

## D. Dispatch Portal (Web)

**Target Users:** Dispatchers, event coordinators  
**Key Features:**

| Feature | Description |
|---------|-------------|
| **Dashboard** | Day's bookings, crew assignments, at-risk flags |
| **Dispatch board** | Real-time crew status (offered, accepted, checked-in, completed) + locations |
| **At-risk alerts** | Red flag if booking has no accepted crew within 48h |
| **Run sheet mgmt** | Generate, publish, view completeness (checklist %) |
| **Crew scheduler** | Drag-drop crew to shifts (if available), bulk messaging |
| **Message center** | Send shift offers, accept/decline notifications, SMS (future) |
| **Analytics** | Utilization %, crew reliability, repeat bookings |
| **Reporting** | Export daily/weekly reports (CSV, PDF) |

**Tech:**
- React 18 + TypeScript
- Tailwind CSS + shadcn/ui
- React Query + WebSocket (Socket.IO) for real-time updates
- Zustand for state
- Mapbox for crew locations
- react-big-calendar for calendar view

**Real-time Features (WebSocket):**
- Crew location pings (every 30s if checked-in)
- Shift accept/decline notifications
- Check-in/out status updates
- At-risk booking flags

---

## E. Mobile API v2

New REST endpoints optimized for mobile (low-bandwidth, high-latency):

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v2/crew/me` | GET | Crew profile + permissions |
| `/api/v2/crew/assignments` | GET | Paginated list of assignments (offered, accepted, completed) |
| `/api/v2/crew/shift/{id}` | GET | Full shift details (booking, venue, crew list) |
| `/api/v2/crew/shift/{id}/accept` | POST | Accept shift (requires token) |
| `/api/v2/crew/shift/{id}/decline` | POST | Decline shift (requires token) |
| `/api/v2/crew/check-in` | POST | Check-in with GPS + photo |
| `/api/v2/crew/check-out` | POST | Check-out with note |
| `/api/v2/crew/run-sheet/{booking_id}` | GET | Equipment, checklist, venue |
| `/api/v2/crew/timesheets` | GET | List timesheets (this week, previous weeks) |
| `/api/v2/crew/timesheet/{id}` | GET | Single timesheet detail |
| `/api/v2/crew/notifications` | GET | Push notification history |
| `/api/v2/customer/bookings` | GET | Paginated list (my bookings) |
| `/api/v2/customer/booking/{id}` | GET | Full booking detail (quote, contract, crew) |
| `/api/v2/customer/booking/{id}/crew-status` | GET | Real-time crew locations + status |
| `/api/v2/dispatch/day-view` | GET | All bookings for a day + crew status |
| `/api/v2/dispatch/board/subscribe` | WS | WebSocket for real-time updates |

**Response Format (all endpoints):**
```json
{
  "status": "success|error",
  "data": {...},
  "meta": {
    "page": 1,
    "page_size": 20,
    "total": 100,
    "timestamp": "2026-07-23T15:30:00Z"
  },
  "error": "string if status=error"
}
```

---

## F. Authentication & Security

**Crew Mobile App:**
- Push notification → deep link with HMAC token (same as email link)
- Token valid for 1 hour, can be refreshed
- Optional: biometric (Face ID/Touch ID) for app unlock

**Customer Portal:**
- Session-based (Frappe built-in) OR JWT token
- Multi-factor optional (email OTP)

**Dispatch Portal:**
- Session-based (Frappe built-in)
- MFA recommended (TOTP or SMS)

**Mobile API v2:**
- JWT tokens (short-lived, 1h) + refresh tokens
- Scope-based permissions (crew_read, crew_write, customer_read, etc.)

---

## G. Deployment

### Frontend Hosting
- **Crew App:** App Store + Google Play (via Expo or native build)
- **Portals:** Static host (S3 + CloudFront, or Vercel) + Frappe reverse proxy for API routing
- **Backend:** Kubernetes (same as phases 1–3)

### Build Pipeline
- GitHub Actions: Build → Test → Deploy
- Mobile app builds (EAS Build for Expo, or Fastlane for native)
- Web app: npm build → push to S3

---

## H. File Structure

```
entertainment_express/
├── www/
│   ├── crew-app.html (launcher for mobile web fallback)
│   ├── customer-portal/
│   │   ├── index.html
│   │   └── src/ (React SPA)
│   └── dispatch-portal/
│       ├── index.html
│       └── src/ (React SPA)
├── api/
│   └── mobile_api_v2.py (new endpoints)
├── mobile-app/ (React Native or Flutter)
│   ├── ios/
│   ├── android/
│   ├── src/
│   └── package.json
└── frontend/
    ├── customer-portal/ (React TS)
    ├── dispatch-portal/ (React TS)
    ├── package.json
    └── tsconfig.json
```

---

## I. Success Metrics

| Metric | Target |
|--------|--------|
| Mobile app store rating | 4.5+ stars |
| Crew app adoption | >80% of active crew |
| Check-in accuracy | >95% GPS confidence |
| Portal load time | <2s on 4G |
| Real-time latency | <500ms (dispatch board) |
| Offline capability | Run sheet + checklist cached |
| Uptime | 99.9% |
