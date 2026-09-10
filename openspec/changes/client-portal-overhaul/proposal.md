## Why

The `/client` customer portal is the most visible touchpoint between an entertainment company and paying event hosts (brides, corporate planners, schools, festival organizers) as well as invited guest collaborators. Currently, while flagship routes (`/`, `/events/:id`, `/pay`, `/planning`) exist in an early state, major workspaces (`/events`, `/documents`, `/appointments`, `/people`, `/chat`, `/photos`, `/account`) are routed through a 1,211-line legacy scaffold (`AppLegacy.tsx`) with raw inline styles, mock handlers, and incomplete API bindings.

To deliver a 100% production-ready, enterprise-grade, sales-ready experience that beats HoneyBook and Goodshuffle Pro, we must completely retire the legacy scaffold and deliver modern, accessible, responsive route modules powered by `@portal-kit` (Radix UI + Tailwind CSS) and real backend APIs.

## What Changes

- **Complete Modern Architecture**: Retire `AppLegacy.tsx` and introduce dedicated route modules under `frontend/customer-portal/src/app/routes/` for all client workspaces.
- **Enhanced Flagship Home (`/`)**: Next-action hero (prioritizing e-sign contracts, deposit/invoice payments, and planning milestones), interactive event carousel for clients with multiple bookings, live billing summary, real planning progress metrics, upcoming consultation card, and guest collaborator welcome view.
- **Enhanced Event Flagship (`/events/:id`) & Directory (`/events`)**:
  - Searchable, filterable card directory of all client bookings with countdowns and weather badges.
  - Sticky event header with days-away countdown, live weather advisory with one-click rain-date acceptance, and deep tabbed hubs (Overview, Planning, Documents, Financials, Team/Crew, Photos).
- **Flagship Payments & Billing Hub (`/client/pay`)**:
  - Live open invoice listing via `portal_client.list_invoices`.
  - Multi-processor selector via `portal_billing.list_processors` (Stripe, Square, PayPal, ACH, Authorize.Net).
  - Tip selector ($0, $25, $50, $100, custom) and promo code discount entry.
  - Real checkout handoff via `portal_client.start_checkout` with celebration screen.
- **Contracts, Waivers & E-Sign Hub (`/client/documents`)**:
  - Lists agreements, liability waivers, and paid receipts.
  - Interactive e-sign modal with contract terms, signer identity, typed/drawn signature canvas, agreement confirmation, and audit trail.
  - PDF/receipt download.
- **Full Planning Suite (`/client/planning`)**:
  - Music Planning: Must-play, Do-not-play, Special Moments, General Requests via `music.py`, plus curated playlist browsing.
  - Timeline & Run of Show: Chronological schedule via `timeline.py` with client change-suggestion dialog.
  - Questionnaires: Dynamic form instances via `planning.py` with autosave indicators and completion celebrations.
  - Collaborative Group Voting: Suggest and vote on songs/activities via `portal_collaboration`.
- **Appointments & Consultations (`/client/appointments`)**:
  - Scheduled planning consultations with video/phone meeting details.
  - "Book Consultation" modal with live staff slot availability, slot picker, and reschedule/cancellation flows.
- **People & Guest Collaborators (`/client/people`)**:
  - Host invite manager for co-planners and wedding party/event guests.
  - QR code and copyable share link for friends to suggest songs and vote on activities.
- **Live Event Chat (`/client/chat`)**:
  - Threaded conversation with assigned talent (DJ, MC) and event coordination staff with read-state tracking.
- **Photos & Media Deliverables (`/client/photos`)**:
  - Published event photo albums, photo booth galleries, and media download.
- **Account & Preferences (`/client/account`)**:
  - Multi-channel notification settings (SMS, email, quiet hours) and instant Dark/Light theme switching.

## Capabilities

### Modified Capabilities
- `customer-portal`: Mandates dedicated modern route architecture for all 10 client workspaces, interactive in-portal e-signature with signature capture, live multi-processor checkout, complete music/timeline/form planning, appointment booking, guest collaboration, live chat, deliverables gallery, and notification preferences.
- `portal-premium-experience`: Expands PQB enforcement across the full suite of client routes with consumer visual density, dark mode fidelity, and mobile bottom navigation.

## Impact

- **Frontend**: `frontend/customer-portal/src/app/routes/` (`home`, `event`, `events`, `pay`, `planning`, `documents`, `appointments`, `people`, `chat`, `photos`, `account`), `layouts/ClientLayout.tsx`, `App.tsx`.
- **Backend & APIs**: Consumes existing whitelisted endpoints in `portal_client.py`, `portal_billing.py`, `portal_collaboration.py`, `portal_proposal.py`, `music.py`, `timeline.py`, `planning.py`, `appointments.py`, `deliverables.py`, and `weather.py`.
- **Testing & Isolation**: Validated by `npm run build` in `frontend/customer-portal`, OpenSpec baseline validation, and `python3 smoke_test.py`.
