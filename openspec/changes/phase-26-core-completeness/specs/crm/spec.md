## ADDED Requirements

### Requirement: Proposal Send From Company OS
The system SHALL let `EE Tenant Admin` and `EE Sales` create and send an interactive Proposal from `/owner` or `/employee` without using `/app`. A Proposal SHALL wrap the existing Quotation, EE Contract, and deposit invoice. Amounts SHALL be formatted by the backend.

#### Scenario: Owner sends a proposal
- **WHEN** an owner opens an inquiry or job and sends a Proposal with at least one package
- **THEN** the customer receives a link to `/client` (or tokenized proposal URL) and the Quotation is marked sent

#### Scenario: Guest cannot send
- **WHEN** an `EE Event Guest` calls the send-proposal API
- **THEN** the request is denied (403) and no Quotation is emailed

## MODIFIED Requirements

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
