## Why

Photo booth and DJ+booth operators sell instant prints, branded templates, and digital galleries. EE has deliverables and published photos stubs but not a full media pipeline (templates, session counts, share links, booth mode).

## What Changes

- EE Media Gallery and Media Asset pipeline tied to bookings.
- Booth templates, print/session counters, share-via-SMS/email links.
- Owner publish controls; client gallery; guest view when published.
- Non-goals: hardware printer drivers; social network OAuth posting farms.

## Capabilities

### New Capabilities

- `media-delivery`: Photo booth and event media: templates, galleries, print counts, SMS/email share links, publish to client.

### Modified Capabilities

- `customer-portal`: Working gallery with share and download for published media.
- `mobile-field-app`: Crew upload into gallery sessions; optional booth mode.
- `owner-portal`: Publish/unpublish galleries; template management.
- `notifications`: Gallery-ready and share-link messages.
- `event-collaboration`: Guests can view published gallery when invited.
- `service-catalog`: Optional media package flags on booth items.

## Impact

- Custom Frappe DocTypes/APIs in `entertainment_express`; portal SPA updates; migrate per tenant site.
- Multi-tenant isolation tests required; no cross-site data.
- Depends on earlier competitive-gap phases where noted in ROADMAP.
