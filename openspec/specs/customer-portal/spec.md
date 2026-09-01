# Capability: Customer Portal

## Purpose
The authenticated self-service portal where a tenant's end customers manage their relationship: view/track
bookings, sign contracts, pay invoices, message the company, upload event details, and access deliverables
(photos/media). Built on Frappe Portal + web pages, scoped to the `EE Customer` role.

## Requirements

### Requirement: Customer Account & Dashboard
The system SHALL give each customer a secure account with a dashboard of their bookings, balances, and
documents, scoped strictly to their own records.

#### Scenario: Customer dashboard
- **WHEN** a customer logs into the portal
- **THEN** they see only their own bookings, invoices, contracts, and messages — never any other customer's

### Requirement: Booking Self-Management
The system SHALL let customers view booking details and request changes (reschedule, add-ons, cancellation)
subject to tenant policy.

#### Scenario: Request add-on
- **WHEN** a customer requests an add-on for an upcoming booking
- **THEN** the request is applied or routed for approval per policy, updating the booking and balance

#### Scenario: Reschedule request
- **WHEN** a customer requests a reschedule
- **THEN** availability is checked and the change is confirmed or sent to staff per policy, with the customer
  notified of the outcome

### Requirement: Online Contract Signing & Payment
The system SHALL let customers review and sign contracts and pay deposits/balances/tips from the portal.

#### Scenario: Sign and pay in portal
- **WHEN** a customer opens a pending contract in the portal and signs
- **THEN** the contract is executed and the customer is prompted to pay the deposit, completing confirmation

### Requirement: Event Detail Collection
The system SHALL collect event-specific details from customers (music requests, timeline, venue access,
guest count, special instructions) via portal forms.

#### Scenario: Event questionnaire
- **WHEN** a customer completes the event questionnaire (e.g., DJ song requests, timeline)
- **THEN** the details attach to the booking and appear on the crew run sheet

### Requirement: Messaging
The system SHALL provide threaded messaging between the customer and the tenant's staff tied to a booking.

#### Scenario: Customer message
- **WHEN** a customer sends a message about their booking
- **THEN** the assigned staff are notified and the thread is retained on the booking

### Requirement: Deliverables Access
The system SHALL let customers access post-event deliverables (photo booth galleries, media, receipts).

#### Scenario: Access photo gallery
- **WHEN** post-event media is published to a booking
- **THEN** the customer can view/download it from the portal via a secure, expiring link

### Requirement: Client Operating System
The system SHALL make `/client` the place the paying customer does all of their work for their events: home next action, events, pay, documents/contracts, planning, invite people, chat, and deliverables. The customer SHALL NOT be sent to Frappe Desk.

#### Scenario: Client home next action
- **WHEN** a customer with an unsigned contract or unpaid deposit opens `/client`
- **THEN** the home highlights Sign or Pay for that event using existing contract/payment APIs

### Requirement: Event People And Guest Experience
The system SHALL let the paying customer invite and revoke event guests (`event-collaboration`). Accepted guests using `/client` SHALL see only that event’s planning, chat, and published photos — not Pay, not invoices, not the ability to invite others (v1).

#### Scenario: Guest lands on the event
- **WHEN** an accepted `EE Event Guest` opens their invite link
- **THEN** they see that event’s planning hub and chat, and do not see other customers or Pay

#### Scenario: Customer pays, guest does not
- **WHEN** the customer pays a deposit from `/client`
- **THEN** the payment succeeds through existing billing APIs; the same action is unavailable in the guest UI and API
