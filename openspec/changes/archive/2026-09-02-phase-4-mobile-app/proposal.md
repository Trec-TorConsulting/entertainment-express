## Why

Phases 1–3 build a complete backend SaaS platform, but users interact via email links and admin UI. Phase 4 builds customer-facing and crew-facing applications:

- **Crew App:** Accept shifts, check-in/out, view run sheets, submit timesheets (mobile-first)
- **Customer Portal:** Manage bookings, sign contracts, pay deposits, track events, message crew (web)
- **Dispatch Portal:** Real-time crew locations, at-risk bookings, publish run sheets (web)
- **Mobile APIs:** RESTful endpoints optimized for low-bandwidth field operations

## What Changes

- New **Frappe Portal Pages**: customer-dashboard, crew-dashboard, dispatch-portal
- New **React/Vue Single Page Applications** (customer & dispatch portals)
- New **React Native or Flutter app** (crew mobile app)
- New **Mobile-optimized API routes** with pagination, caching, offline support
- New **WebSocket support** for real-time dispatch board updates
- New **File upload handling** for contract signatures, compliance docs, crew photos
- New **Push notifications** for shift offers, booking updates (Firebase Cloud Messaging)

## Capabilities

### New Capabilities
- `crew-mobile-app`: Accept/decline shifts, check-in/out, view assignments, timesheets, notifications
- `customer-portal`: Book events, manage timeline, sign contracts, pay deposits, track crew status, message
- `dispatch-portal`: Real-time board, crew locations (map), at-risk flags, run sheet management, TTL warnings
- `mobile-api`: Low-latency endpoints for field operations, pagination, caching

### Modified Capabilities
- `api-versioning`: Add API v2 for mobile (v1 remains backward-compatible)
- `authentication`: Add JWT token support (in addition to session-based)
- `permissions`: Add customer and crew dashboard roles

## Impact

- New frontend tech stack (React/Vue, TypeScript, Tailwind, Redux/Zustand)
- New mobile app (React Native/Flutter, native APIs for geolocation, camera, notifications)
- New Frappe Portal Pages (3 dashboards)
- Enhanced API surface (15+ new endpoints for mobile)
- WebSocket integration for real-time updates
- Push notification service integration (Firebase)
- Depends on: Phases 1, 2, 3 (all backend complete)
