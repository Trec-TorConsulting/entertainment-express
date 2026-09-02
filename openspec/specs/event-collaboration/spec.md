# Capability: Event Collaboration

## Purpose
Booking-scoped collaboration for a tenant’s paying customer, invited guests, and assigned talent. Guests
are Website Users on the **same tenant site**, never payers, and never see another customer’s event.
Chat, invites, votes, and plan suggestions stay on the tenant database; isolation is site-per-tenant plus
membership checks on every API.

## Requirements

### Requirement: Event Guest Role And Invite
The system SHALL let the booking’s paying customer (or tenant staff/owner) invite people to a booking as `EE Event Guest`. Each invite SHALL create or link a Website User on the **same tenant site**, scoped to that booking only. Guests SHALL NOT receive `EE Customer` payer permissions.

#### Scenario: Customer invites a wedding-party member
- **WHEN** the paying customer invites `alex@example.com` to booking `EB-0001`
- **THEN** an `EE Event Invite` is stored, the user is created or linked with role `EE Event Guest` only, and they receive a link to that event’s `/client` planning hub

#### Scenario: Invitee cannot pay
- **WHEN** an accepted guest calls a payment or contract-sign API for the booking
- **THEN** the request is denied (403) and no Stripe/ledger write occurs

#### Scenario: Guest cannot see another booking
- **WHEN** a guest for `EB-0001` requests `EB-0002`
- **THEN** access is denied and no fields from `EB-0002` are returned

#### Scenario: Revoke invite
- **WHEN** the customer revokes an invite
- **THEN** that user can no longer read messages, plan items, or media for that booking

### Requirement: Collaborative Planning
The system SHALL provide a booking planning hub where the customer, accepted guests, and assigned entertainers can suggest catalog/plan items, comment, and vote. Only the paying customer and tenant staff/owner SHALL mark items approved or rejected (which MAY affect quotes per existing booking policy).

#### Scenario: Guest suggests an add-on
- **WHEN** a guest suggests a catalog add-on on the booking
- **THEN** a plan item is created with source `guest` and status `suggested`, visible to the customer and assigned talent

#### Scenario: Vote on a suggestion
- **WHEN** a participant votes on a plan item
- **THEN** the vote is stored once per user per item and the hub shows the tally

#### Scenario: Customer approves a suggestion
- **WHEN** the paying customer approves a suggested add-on
- **THEN** the plan item is `approved` and existing quote/booking policy applies for whether it becomes a billable line

### Requirement: Booking Chat
The system SHALL provide a message thread per booking whose members are the paying customer, accepted guests, assigned crew/entertainers, and staff with owner/sales/dispatch roles. Messages SHALL be stored on the tenant site and SHALL never leak across bookings or tenants.

#### Scenario: Guest posts in chat
- **WHEN** an accepted guest posts a message on `EB-0001`
- **THEN** the customer and assigned entertainer(s) can read it on that booking and are notified via existing notification channels

#### Scenario: Non-member cannot read chat
- **WHEN** a user who is not a member of `EB-0001` lists messages for that booking
- **THEN** the list is empty or 403 — no message bodies are returned

### Requirement: Planning Hub Includes Forms Timeline Music
The system SHALL treat `/client/planning` as one hub: phase-15 forms, timeline, music, plus existing suggest/vote plan items and chat nearby. Guests SHALL NOT receive payer screens from this hub.

#### Scenario: Guest uses the hub
- **WHEN** an accepted guest opens Planning
- **THEN** they see that booking’s collaborative items (and allowed music/form fields) and no Pay or Documents money
