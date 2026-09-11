## 1. Client Layout & Flagship Routes Modernization

- [x] 1.1 Upgrade `ClientLayout.tsx` with responsive navigation, badge counts, and guest/payer view modes
- [x] 1.2 Upgrade `HomePage.tsx` with next-action hero, multi-event selector, live billing, and real planning indicators
- [x] 1.3 Upgrade `EventDetailPage.tsx` with sticky event header, countdown, weather advisory, and rich tabs (Overview, Planning, Documents, Financials, Team, Photos)
- [x] 1.4 Upgrade `PayPage.tsx` with live invoice list, processor picker (Stripe/Square/PayPal/ACH), tip selector, promo code support, and checkout celebration
- [x] 1.5 Upgrade `PlanningPage.tsx` with music selections (must-play/do-not-play/special moments), visual timeline with change suggestions, dynamic questionnaires, and collaborative voting

## 2. Dedicated Route Components (Retiring AppLegacy)

- [x] 2.1 Implement `EventsListPage.tsx` for browsing bookings with status filtering and countdowns
- [x] 2.2 Implement `DocumentsPage.tsx` for contracts, waivers, and receipts with an interactive in-portal e-sign modal
- [x] 2.3 Implement `AppointmentsPage.tsx` for viewing meetings and booking new consultation slots
- [x] 2.4 Implement `PeoplePage.tsx` for managing co-planners, guest invites, and permission roles
- [x] 2.5 Implement `ChatPage.tsx` for live threaded messaging with entertainment talent and coordination staff
- [x] 2.6 Implement `PhotosPage.tsx` for viewing deliverables, photo booth galleries, and downloading assets
- [x] 2.7 Implement `AccountPage.tsx` for notification preferences (SMS/email/WhatsApp), quiet hours, and theme switching

## 3. Router Integration & Verification

- [x] 3.1 Update `App.tsx` and client route index to wire all modern route components and retire `AppLegacy.tsx`
- [x] 3.2 Validate frontend compilation with `npm run build`
- [x] 3.3 Run OpenSpec validation and multi-phase smoke tests
