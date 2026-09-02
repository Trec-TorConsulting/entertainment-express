## Why

Bookings, contracts, invoices, and music lists already live on each tenant site, but they do not talk to the calendars, maps, DocuSign, books, or streaming services owners already use. Failures in those providers must never take down quoting, signing, or dispatch.

## What Changes

- Per-tenant **Integration Config** (encrypted credentials, never logged or returned to the SPA).
- Append-only **Integration Sync Log** and **Integration Webhook Event** (signature verify + event-id dedupe).
- **Calendar:** Google Calendar and Microsoft 365 two-way for confirmed jobs; iCal feed for crew. Missing keys skip the sync; the job still saves.
- **Maps:** geocode + travel time via Mapbox or Google Maps when a key is present; otherwise zip/service-area fees stay as today.
- **DocuSign** optional envelope send; native in-app sign remains the default.
- **QuickBooks / Xero** optional invoice/payment/customer sync after finalize/paid.
- **Streaming:** Spotify (existing) plus Apple Music and YouTube playlist import with preview links where the provider allows.
- Owner **Connections** at `/owner/connections`. Guests/crew 403. No DocType names, no `/app`.

## Impact

- New module `Integrations`; APIs in `api/integrations.py`; hooks on Event Booking / Sales Invoice / EE Contract.
- Owner SPA rebuild; bench `0.0.69-ee` → `0.0.70-ee`.
- Tests: `tests/test_phase13_integrations.py`.
- Depends on: phase-1 bookings/contracts/invoices, phase-15 music, phase-5 Stripe webhooks as the pattern.

## Non-Goals

- Live OAuth app registration in this repo (operator supplies client ids).
- Replacing native e-sign.
- Cross-site calendar sharing.
- Building a full GL in EE.

## Requirements delivered

- `integrations`: Per-Tenant Credential Management, Calendar Sync, Maps & Routing, E-Signature Integration (DocuSign optional), Webhook Framework, Sync Observability & Failure Handling, Accounting Integrations, Music Streaming Integrations.
- `owner-portal`: Connections workspace.
- `identity-access`: guests cannot call connection APIs.
- `music-planning`: Apple/YouTube import (Spotify already present).
