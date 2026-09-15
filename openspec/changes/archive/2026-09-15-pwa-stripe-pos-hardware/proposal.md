## Why

Mobile entertainment operators (DJs, photo booth attendants, inflatable delivery drivers, performers) frequently complete gigs where the client still owes an unpaid balance, requests day-of overtime, adds on-site equipment (extra lights, fog machine, additional photo prints), or wants to tip the crew with a credit card. Currently, field crew have no in-person card swipe/tap capability on their mobile devices, forcing either awkward post-event online invoicing, manual cash handling, or third-party card swipes that never sync back to the tenant's ERPNext books.

By integrating Stripe Terminal directly into the Mobile Field App PWA with hybrid hardware support (Bluetooth Mobile Readers like Stripe Reader M2 and Cloud/WiFi Smart Readers like BBPOS WisePOS E), field crew can collect final balances, on-site upsells, and credit card tips directly on their phone at the venue. Transactions automatically generate ERPNext `Payment Entry` records, settle `Sales Invoice` documents, feed the digital tip pool, and update the owner's Event P&L in real time.

## What Changes

- **PWA Stripe Terminal Web SDK Integration**: Integrate `@stripe/terminal-js` into the Mobile Field App (`/employee` PWA), supporting Bluetooth reader discovery & connection via Web Bluetooth API and Cloud/WiFi reader connection via IP/Cloud pairing.
- **On-Site Checkout Modal & Flow**: Add an in-person payment flow to the Field App Event Wrap-Up / Teardown screen displaying:
  - Remaining Booking Balance (pulled live from `Event Booking` / `Sales Invoice`)
  - Day-of Overtime / Add-on Line Item Entry (auto-calculating amount)
  - Interactive Tip Screen (Standard prompt: 15%, 20%, 25%, Custom amount, or Skip/No Tip)
  - Reader status indicator (Connecting, Ready for Tap/Insert, Processing, Approved)
- **Backend Terminal Connection Token & Reader Registration APIs**:
  - `POST /api/method/entertainment_express.api.terminal.connection_token`: Generates short-lived Stripe Terminal connection tokens scoped to the tenant's Stripe account.
  - `GET /api/method/entertainment_express.api.terminal.list_readers`: Lists registered physical readers for the tenant's locations.
  - `POST /api/method/entertainment_express.api.terminal.create_payment_intent`: Creates an on-site PaymentIntent with metadata linking `booking`, `invoice`, and `crew_user`.
  - `POST /api/method/entertainment_express.api.terminal.capture_payment`: Captures the authorized Terminal payment and triggers ERPNext accounting creation.
- **Automated ERPNext Accounting & Tip Routing**:
  - Automatically generates an ERPNext `Payment Entry` against the booking's `Sales Invoice`.
  - Routes tip amounts directly into the event's `Digital Tip Pool` for algorithmic splitting.
  - Standard processing fees are absorbed by the company and booked to the Payment Processor Expense account.
  - Generates an instant SMS / Email digital receipt to the client.

## Capabilities

### New Capabilities
- `pwa-stripe-pos-terminal`: In-person hardware payment processing via Stripe Terminal within the Mobile Field App PWA, supporting Bluetooth/Cloud readers, on-site balance collection, overtime add-ons, and digital tip capture.

### Modified Capabilities
- `mobile-field-app`: Add POS reader management, on-site payment collection drawer, and digital tip capture to the event wrap-up checklist.
- `billing-payments`: Add Stripe Terminal PaymentIntent capture, in-person payment entry reconciliation, and hardware terminal device management.

## Impact

- **Frontend**: Field App PWA (`entertainment_express/public/employee/` and `portal-kit`), adding Stripe Terminal JS SDK, Bluetooth permissions handler, and Checkout drawer component.
- **Backend API**: New module `entertainment_express/api/terminal.py` and webhook handlers in `entertainment_express/api/payments_stripe.py`.
- **Data Model**: New DocType `EE Terminal Reader` for storing paired hardware readers and serial numbers per tenant/vehicle.
- **Dependencies**: NPM `@stripe/terminal-js` added to frontend portal bundle; `stripe` Python library utilized for Terminal API endpoints.
