# Capability: Integrations

## Purpose
A consistent framework for connecting external services, with per-tenant credentials, webhook handling,
sync logging, and graceful failure. Covers payments, communications, calendars, maps/routing, e-signature,
and accounting exports. Each integration is optional and gated by tenant configuration and plan.

### Data Model
- **Integration Config**: tenant-scoped; provider, enabled, credentials (encrypted), settings, status.
- **Integration Sync Log**: provider, direction, action, status, payload_ref, error, timestamp. (Append-only.)
- **Webhook Event**: provider, event_id (unique), type, payload, processed (bool), received_at. (Dedupe key.)

## Requirements

### Requirement: Per-Tenant Credential Management
The system SHALL store integration credentials encrypted, scoped per tenant, never in plaintext or shared
across tenants.

#### Scenario: Store credentials securely
- **WHEN** a tenant connects a provider (e.g., Stripe, Twilio, Google)
- **THEN** credentials are encrypted at rest, scoped to that tenant only, and never logged in plaintext

### Requirement: Payment Processor Integrations
The system SHALL integrate Stripe, Square, PayPal, and ACH for tenant customer payments (see
`billing-payments`) and Stripe for SaaS subscription billing (see `saas-control-plane`).

#### Scenario: Connect a processor
- **WHEN** a tenant connects a supported payment processor
- **THEN** it becomes selectable for customer payments and its webhooks are registered and verified

### Requirement: Communication Integrations
The system SHALL integrate SMTP/email, Twilio (SMS/WhatsApp), and FCM (push) for `notifications`.

#### Scenario: Comms provider active
- **WHEN** a tenant configures Twilio and SMTP
- **THEN** SMS/WhatsApp and email sends route through them with delivery webhooks tracked

### Requirement: Calendar Sync
The system SHALL two-way sync bookings/crew schedules with Google Calendar and Microsoft 365, plus iCal
feeds.

#### Scenario: Booking appears on calendar
- **WHEN** a booking is confirmed and calendar sync is enabled
- **THEN** an event is created/updated on the connected calendar; external changes reflect back per policy

### Requirement: Maps & Routing
The system SHALL use a maps/routing provider (Google Maps/Mapbox) for geocoding, service-area checks, travel
time, and route optimization.

#### Scenario: Geocode and travel time
- **WHEN** a venue address is entered
- **THEN** it is geocoded, checked against service areas, and travel time/fees are computed

### Requirement: E-Signature Integration
The system SHALL support native in-app e-signature by default and optional DocuSign, with executed-document
retrieval.

#### Scenario: DocuSign optional
- **WHEN** a tenant enables DocuSign
- **THEN** contracts route through DocuSign and executed documents/status sync back to the contract record

### Requirement: Webhook Framework
The system SHALL receive provider webhooks, verify signatures, dedupe by event id, and process idempotently
in the background.

#### Scenario: Idempotent webhook processing
- **WHEN** the same provider webhook is delivered twice
- **THEN** it is processed exactly once (deduped by event id) and the outcome is recorded

### Requirement: Sync Observability & Failure Handling
The system SHALL log integration syncs and surface failures without breaking core workflows.

#### Scenario: Integration failure isolated
- **WHEN** an external provider call fails
- **THEN** the error is logged to the sync log, retried per policy, and the core workflow degrades gracefully
  rather than failing the whole operation

### Requirement: Accounting Integrations (QuickBooks / Xero)
The system SHALL optionally sync invoices, payments, and customers to QuickBooks Online and Xero for tenants
that keep their books there.

#### Scenario: Sync invoice to QuickBooks
- **WHEN** a tenant connects QuickBooks and an invoice is finalized/paid
- **THEN** the invoice, payment, and customer sync to QuickBooks idempotently, with sync status and errors
  logged

### Requirement: Music Streaming Integrations
The system SHALL integrate Spotify, Apple Music, and YouTube Music for playlist import and track preview (see
`music-planning`).

#### Scenario: Import a streaming playlist
- **WHEN** a client provides a Spotify/Apple/YouTube playlist link
- **THEN** the tracks are imported as music selections with preview links where the provider allows
