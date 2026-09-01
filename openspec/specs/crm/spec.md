# Capability: CRM

## Purpose
Manage the sales funnel for a tenant: capture leads, qualify opportunities, produce quotes, get signed
contracts, and convert to bookings. Built on ERPNext CRM/Selling primitives (Lead, Opportunity, Quotation,
Customer, Contact) extended with EE-specific event fields and an e-signature flow.

### Data Model
- **Lead** (ERPNext, extended): source, event_type, event_date_estimate, service_interest (child), status.
- **Opportunity** (ERPNext, extended): event details, estimated value, probability, stage.
- **EE Quote** = ERPNext **Quotation** extended with event fields (event_date, venue, service items, assets,
  add-ons, travel fee, deposit terms) + generated quote document/PDF.
- **EE Contract**: quote (link), template, rendered_html/PDF, signer(s), signature (image/typed + audit:
  ip, timestamp, hash), status (`draft|sent|viewed|signed|declined|expired`).
- **Customer / Contact** (ERPNext): end client company/person.

## Requirements

### Requirement: Lead Capture & Management
The system SHALL capture leads from multiple sources (manual, web form, booking site, import) with full CRUD
and track them through qualification.

#### Scenario: Web form lead capture
- **WHEN** a prospect submits the public "request a quote" form on a tenant's booking site
- **THEN** a Lead is created with the event details and source, and the assigned sales user is notified

#### Scenario: Lead lifecycle
- **WHEN** a sales user updates a lead's status through qualification stages
- **THEN** the status transitions are persisted and reflected in the pipeline view

### Requirement: Opportunity Pipeline
The system SHALL manage opportunities in a visual pipeline with stages, estimated value, and expected close.

#### Scenario: Pipeline board
- **WHEN** a sales user opens the pipeline
- **THEN** opportunities are grouped by stage with drag-to-advance and weighted forecast totals

#### Scenario: Convert lead to opportunity
- **WHEN** a qualified lead is converted
- **THEN** an Opportunity is created linked to the lead's customer/contact and event details, with no data
  re-entry

### Requirement: Quoting
The system SHALL produce event quotes composed of service items, assets, add-ons, packages, travel fees,
taxes, and deposit terms, with a branded PDF and full CRUD.

#### Scenario: Build a quote
- **WHEN** a sales user builds a quote adding service items, a package, add-ons, and a service-area travel
  fee
- **THEN** the quote totals (subtotal, discounts, travel, tax, total, required deposit) compute correctly and
  a branded PDF is generated

#### Scenario: Availability check at quote time
- **WHEN** a quote references a specific asset/crew for the event date
- **THEN** the system flags a conflict if that asset/crew is already committed for that date/time

#### Scenario: Send quote to client
- **WHEN** a quote is sent
- **THEN** the client receives a link to view/accept the quote online, and the quote status becomes `sent`

### Requirement: Contracts & E-Signature
The system SHALL generate contracts from templates, send them for signature, capture a legally-auditable
signature, and record the fully-executed document.

#### Scenario: Send contract for signature
- **WHEN** a signed-off quote is turned into a contract and sent
- **THEN** the signer receives a secure link, and the contract status is `sent`

#### Scenario: Capture signature with audit trail
- **WHEN** the client signs (typed or drawn) on the contract page
- **THEN** the signature, signer identity, IP, timestamp, and a content hash are stored, the status becomes
  `signed`, and both parties receive the executed PDF

#### Scenario: Declined or expired contract
- **WHEN** a client declines, or the contract passes its expiry without signature
- **THEN** the status becomes `declined`/`expired` and the sales owner is notified

### Requirement: Quote-to-Booking Conversion
The system SHALL convert a signed contract/accepted quote into a confirmed Event Booking and trigger deposit
invoicing.

#### Scenario: Convert to booking
- **WHEN** a contract is signed (or a quote accepted with deposit paid, per tenant policy)
- **THEN** an Event Booking is created with the event date, service items, assets, and crew placeholders, and
  a deposit invoice is generated (see `billing-payments`)

### Requirement: Activities & Follow-ups
The system SHALL log activities (calls, emails, notes, tasks) against leads/opportunities/customers and
support automated follow-up reminders.

#### Scenario: Automated follow-up
- **WHEN** a quote has been `sent` without response for the configured interval
- **THEN** a follow-up task/notification is created for the owner and an optional automated reminder is sent
  to the client

### Requirement: Interactive Proposals
The system SHALL support a unified, client-facing **Proposal** that combines package/item selection, quote
pricing, contract, and deposit into a single interactive flow, with view tracking.

#### Scenario: Client accepts a proposal end-to-end
- **WHEN** a client opens a proposal, selects/adjusts packages, e-signs the contract, and pays the deposit in
  one flow
- **THEN** the quote is accepted, the contract is executed, the deposit is captured, and the booking is
  created without staff re-entry

#### Scenario: Proposal view tracking
- **WHEN** a client opens or interacts with a sent proposal
- **THEN** the view/interaction is logged and the sales owner can be notified

#### Scenario: Allowed add-ons only
- **WHEN** the proposal marks some catalog add-ons as client-adjustable
- **THEN** the client may toggle only those add-ons; other lines stay fixed; totals recompute with `flt`

### Requirement: Proposal Send From Company OS
The system SHALL let `EE Tenant Admin` and `EE Sales` create and send an interactive Proposal from `/owner` or `/employee` without using `/app`. A Proposal SHALL wrap the existing Quotation, EE Contract, and deposit invoice. Amounts SHALL be formatted by the backend.

#### Scenario: Owner sends a proposal
- **WHEN** an owner opens an inquiry or job and sends a Proposal with at least one package
- **THEN** the customer receives a link to `/client` (or tokenized proposal URL) and the Quotation is marked sent

#### Scenario: Guest cannot send
- **WHEN** an `EE Event Guest` calls the send-proposal API
- **THEN** the request is denied (403) and no Quotation is emailed

### Requirement: Tasks & Workflow Templates
The system SHALL support task lists and reusable workflow templates (per event type) that auto-generate
tasks/milestones with due dates relative to the event date.

#### Scenario: Apply a workflow template
- **WHEN** a wedding booking is created and the "Wedding Workflow" template is applied
- **THEN** its tasks/milestones (send planning form, confirm timeline, final payment, day-of checklist) are
  generated with due dates offset from the event date and assigned to owners

#### Scenario: Auto-apply by event type
- **WHEN** a booking is confirmed with an event type that has an active workflow template
- **THEN** the template is applied once (idempotent) without staff using Desk

#### Scenario: Owner sees open tasks
- **WHEN** an owner opens Today or Reminders
- **THEN** open workflow tasks for this tenant appear with due date and a complete action
