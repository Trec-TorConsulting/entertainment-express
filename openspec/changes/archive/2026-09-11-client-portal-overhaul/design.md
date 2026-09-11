## Context

The `/client` Customer Portal SPA (`frontend/customer-portal`) serves event hosts and invited guests. Historically, several screens were kept inside `AppLegacy.tsx` as simple functional fallbacks. With the establishment of `@portal-kit` (Radix primitives, Tailwind CSS, Lucide icons, responsive navigation shells), the portal must be unified into clean, modular, production-ready routes.

## Goals / Non-Goals

**Goals:**
- Unify `/client` into modular routes under `frontend/customer-portal/src/app/routes/`.
- Deliver full production quality for all 10 client sections:
  1. Home (`/`)
  2. Events Directory (`/events`)
  3. Event Detail Hub (`/events/:id`)
  4. Pay & Billing (`/pay`)
  5. Planning Hub (`/planning`)
  6. Documents & E-Sign (`/documents`)
  7. Appointments & Consultations (`/appointments`)
  8. People & Collaboration (`/people`)
  9. Live Event Chat (`/chat`)
  10. Photos & Deliverables (`/photos`)
  11. Account & Preferences (`/account`)
- Ensure full mobile responsiveness with bottom navigation and desktop sidebar.
- Enforce strict role boundary (hosts see financial data; guests see only collaborative planning/chat/photos).
- Connect all user actions to real backend endpoints.

**Non-Goals:**
- Modifying ERPNext accounting core or Frappe framework.
- Modifying the owner or employee portal code.

## Decisions

### D1: Route Architecture & Lazy Loading
Each workspace lives in its own directory under `src/app/routes/<feature>/` with a clean component export, lazy-loaded in `src/app/App.tsx` with skeleton fallbacks.

### D2: Portal-Kit Token & Component Reuse
All forms, dialogs, tabs, buttons, badges, and alerts use `@portal-kit` primitives (`Button`, `Card`, `Badge`, `Dialog`, `Tabs`, `Input`, `Textarea`, `Alert`, `Skeleton`).

### D3: Data Fetching and Mutation
All API calls utilize `call(...)` from `@portal-kit` which handles CSRF tokens and Frappe response unwrapping, with error catching and feedback toasts.

## Risks / Trade-offs

- [Risk] Legacy tests or bookmarks expecting old URLs.
  → Mitigation: Keep URL routes identical (`/`, `/events`, `/events/:id`, `/pay`, `/planning`, `/documents`, `/appointments`, `/people`, `/chat`, `/photos`, `/account`).
- [Risk] Guest collaborator seeing host billing or contract info.
  → Mitigation: Server-side validation with `_require_payer` in `portal_client.py` and UI conditional rendering based on `isGuest(roles)`.
