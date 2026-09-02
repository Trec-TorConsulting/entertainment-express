## Why

Top inflatable operators compete on state inspection proof, cleaning/sanitization between rentals, and on-site participant waivers. EE tracks COI, payer waivers, and maintenance but not inspection certificates as bookable gates, sanitization logs, or attendee QR waiver flows.

## What Changes

- Asset **inspection certificate** registry with expiry; block booking when expired if required.
- **Sanitization / cleaning log** after check-in with photos optional.
- **Attendee waiver QR** for event guests/participants distinct from payer waiver.
- Owner Coverage/Safety workspace surfaces.
- Non-goals: replacing state inspector systems; medical incident EMR.

## Capabilities

### New Capabilities

- `safety-compliance-ops`: State/third-party inspection certificates, post-use sanitization logs, attendee on-site waiver QR (beyond payer).

### Modified Capabilities

- `insurance-compliance`: Link inspection currency; attendee waiver type distinct from payer.
- `equipment-inventory-fleet`: Inspection certs and sanitization logs on assets.
- `mobile-field-app`: Crew complete sanitization checklist and show attendee waiver QR.
- `customer-portal`: Payer still signs primary waiver; guests can sign attendee waivers only.
- `identity-access`: Attendee waiver sign allowed for guests; payer-only money unchanged.
- `owner-portal`: Safety certs and sanitization status without Desk.
- `notifications`: Inspection expiry and missing sanitization reminders.

## Impact

- Custom Frappe DocTypes/APIs in `entertainment_express`; portal SPA updates; migrate per tenant site.
- Depends on prior roadmap phases for bookings, portals, fleet, and notifications as applicable.
- Multi-tenant isolation tests required; no cross-site data.
