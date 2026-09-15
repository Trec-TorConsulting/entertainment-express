## Context

Mobile entertainment field crew (DJs, photo booth attendants, delivery drivers) need to collect balances, extra overtime charges, and client tips before leaving an event venue. Currently, `/employee` has run sheets and wrap-up checklists, but lacks in-person payment hardware connectivity. 

Stripe Terminal provides a unified API for managing in-person card readers. By integrating the Stripe Terminal JavaScript SDK into the PWA, mobile crew members can pair with Bluetooth mobile readers (Stripe Reader M2) or Cloud/WiFi smart readers (BBPOS WisePOS E) without needing native app store distribution.

## Goals / Non-Goals

**Goals:**
- Provide native Stripe Terminal hardware pairing within the Field App PWA (`/employee`) via `@stripe/terminal-js`.
- Enable one-touch on-site checkout for outstanding booking balances and overtime/add-on line items.
- Support standard tip selection (15%, 20%, 25%, Custom, Skip) where processing fees are absorbed by the company.
- Automatically generate ERPNext `Payment Entry` documents linked to the booking's `Sales Invoice`.
- Route tip amounts directly into the `Digital Tip Pool` for that event.
- Provide instant SMS/Email digital receipts via Twilio/SMTP.

**Non-Goals:**
- Standalone retail brick-and-mortar barcode-scanning cash register (EE is event/service-first).
- Storing unencrypted credit card primary account numbers (PAN) or magstripe tracks (all handling is strictly via PCI-compliant Stripe Terminal hardware encryption).
- Hardware terminal firmware flashing inside the PWA (firmware updates are handled automatically via Stripe Terminal SDK OTA).

## Decisions

### 1. Hybrid Reader Architecture (Bluetooth + Cloud Smart Readers)
- **Rationale**: Field crew in vans or remote venues (parks, barns) need Bluetooth readers (Stripe Reader M2) that connect directly to their phone over Web Bluetooth. High-end venues and photo booths with WiFi access can use WisePOS E smart readers.
- **Alternatives Considered**: Cloud-only was rejected because outdoor park bounce-house deliveries frequently lack local WiFi. Native-only was rejected because PWA deployment is instant and does not require Apple/Google App Store approvals.

### 2. Ephemeral Connection Token Backend
- **Endpoint**: `POST /api/method/entertainment_express.api.terminal.connection_token`
- **Mechanism**: Calls `stripe.terminal.ConnectionToken.create()` using the tenant's Stripe API Secret. Returns the token secret to the PWA Terminal client.
- **Security**: Endpoint requires active Frappe user session with `EE Crew`, `EE Dispatcher`, or `EE Tenant Admin` role and tenant site isolation.

### 3. PaymentIntent Creation & Server-Side Capture
- **Endpoints**:
  - `POST /api/method/entertainment_express.api.terminal.create_payment_intent`: Generates a Terminal PaymentIntent with `payment_method_types: ['card_present']`, `capture_method: 'manual'`, and metadata `{booking, invoice, crew_user, tip_amount}`.
  - `POST /api/method/entertainment_express.api.terminal.capture_payment`: Once the reader collects the payment method, the server captures the payment, verifies the amount, and invokes the ERPNext ledger creation.

### 4. Accounting & Tip Allocation Hook
- When captured, `entertainment_express.api.terminal.record_terminal_payment`:
  1. Creates an ERPNext `Payment Entry` of type `Receive` for the base booking amount allocated to the `Sales Invoice`.
  2. If a tip is present, records the tip as a liability or allocates it directly to the booking's `Digital Tip Pool` child rows.
  3. Updates `Event Booking.outstanding_amount` and recalculates margin intelligence.

## Data Model & DocTypes

### `EE Terminal Reader`
Stored in MariaDB per tenant site:
- `reader_name` (Data): Friendly label (e.g., "DJ Mike - Mobile Reader", "Van 1 WisePOS")
- `device_type` (Select): `stripe_reader_m2`, `bbpos_wisepos_e`, `bbpos_chipper_2x`
- `serial_number` (Data): Physical hardware serial number
- `connection_type` (Select): `bluetooth`, `ip_cloud`
- `assigned_crew` (Link → Employee): Assigned worker
- `assigned_vehicle` (Link → Vehicle): Assigned van/truck
- `status` (Select): `online`, `offline`, `in_use`

## Risks / Trade-offs

- **[Risk] Web Bluetooth Browser Support**: Web Bluetooth is fully supported in Chromium browsers (Chrome for Android, Edge, Opera) but restricted in iOS Safari without a WebBLE wrapper or PWA standalone mode.
  - *Mitigation*: Support Cloud/WiFi reader pairing (WisePOS E) across all mobile browsers, and provide a simple manual card-entry fallback via Stripe Elements if Web Bluetooth is unavailable on an iOS device.
- **[Risk] Weak Venue Cellular Coverage**: Venue basements or outdoor parks may experience spotty connectivity.
  - *Mitigation*: The reader verifies the card offline if supported by Stripe Terminal Store-and-Forward, and queues the capture until network connectivity is re-established.
