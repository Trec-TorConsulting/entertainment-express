# Capability: Booking & Availability

## Purpose
The public-facing **online booking site** and the **availability engine** that customers and staff use to
find open dates, select services/assets/crew, and request or instantly confirm an event. It is the demand
side of the platform; the confirmed result is an **Event Booking** consumed by CRM, scheduling, and billing.

### Data Model
- **Event Booking**: booking_no, customer/contact, status (`inquiry|quoted|tentative|confirmed|
  in_progress|completed|canceled`), event_date, start_time, end_time, timezone, venue (address, geo,
  access_notes), service items (child), assigned assets (child), assigned crew (child), add-ons, totals,
  deposit_status, contract (link), source (`portal|staff|import`), balance_due, notes.
- **Availability Rule**: per asset/crew/service — operating hours, blackout dates, lead-time, buffer
  (setup/teardown/travel), max concurrent.
- **Hold/Tentative**: short-lived reservation created during checkout to prevent race double-booking.
- **Booking Site Config**: tenant branding, which items are self-bookable vs quote-only, deposit %,
  cancellation policy, required fields.

## Requirements

### Requirement: Availability Engine
The system SHALL compute real-time availability for a requested date/time/location by checking asset and
crew commitments, buffers (setup/teardown/travel), operating hours, blackout dates, and lead time.

#### Scenario: Available slot
- **WHEN** a customer requests a service for a date/time where the required assets and crew are free
  (including setup/teardown/travel buffers)
- **THEN** the slot is offered as available

#### Scenario: Conflict blocks booking
- **WHEN** the required unique asset or crew is already committed to an overlapping event (including buffers)
- **THEN** the slot is shown unavailable and alternatives/soonest-available are suggested

#### Scenario: Buffer enforcement
- **WHEN** an asset finishes one event and a second event needs it
- **THEN** the second event may only be booked if the gap covers the configured teardown + travel + setup
  buffer

### Requirement: Public Online Booking Site
The system SHALL provide each tenant a branded public site where customers browse services, check
availability, and submit a booking request or (if enabled) instantly confirm with a deposit.

#### Scenario: Self-service instant booking
- **WHEN** a customer selects a self-bookable service, an available date, and pays the required deposit
- **THEN** a confirmed Event Booking is created, the deposit is captured, assets/crew are reserved, and
  confirmation is sent

#### Scenario: Quote-only request
- **WHEN** a customer requests a quote-only service or a custom package
- **THEN** an inquiry/Lead + tentative booking is created and routed to sales rather than instantly confirmed

#### Scenario: Branded per tenant
- **WHEN** a customer visits a tenant's booking site
- **THEN** the site reflects that tenant's branding, service catalog, service areas, and policies only

### Requirement: Booking Holds (Race Safety)
The system SHALL place a short-lived hold on required resources during checkout to prevent two customers
from confirming the same slot.

#### Scenario: Concurrent checkout
- **WHEN** two customers attempt to book the last available asset for the same slot at the same time
- **THEN** only the first to complete payment/confirmation succeeds; the second is released and re-offered
  alternatives

#### Scenario: Hold expiry
- **WHEN** a hold is not converted within its TTL
- **THEN** the hold expires and the resource returns to the available pool

### Requirement: Booking Lifecycle & Modifications
The system SHALL support the full Event Booking lifecycle with reschedules, add-ons, cancellations, and
policy enforcement, with full CRUD.

#### Scenario: Reschedule
- **WHEN** a booking is rescheduled to a new date/time
- **THEN** availability is re-checked, resources are re-reserved for the new slot and released from the old,
  and affected parties are notified

#### Scenario: Cancellation with policy
- **WHEN** a booking is canceled
- **THEN** the cancellation policy determines refundable/forfeited deposit, resources are released, and the
  ledger/refund is handled via `billing-payments`

### Requirement: Calendar & Availability Views
The system SHALL provide staff calendar views (day/week/month, by asset, by crew) of all bookings and
availability.

#### Scenario: Resource calendar
- **WHEN** a dispatcher opens the asset/crew calendar
- **THEN** all bookings, holds, blackouts, and maintenance windows are visible per resource with conflict
  highlighting

### Requirement: Potential Quote Conflicts
The system SHALL classify resource conflicts as `actual` (confirmed bookings, active holds, maintenance) or `potential` (overlapping sent/open Quotations). Sending a quote SHALL remain allowed when only potential conflicts exist. Confirming a booking SHALL still be blocked on actual conflicts.

#### Scenario: Potential overlap on two quotes
- **WHEN** sales adds a unique asset to a second Open quotation that overlaps the first Open quotation
- **THEN** availability returns `potential` conflicts and does not mark the slot unavailable for quoting

#### Scenario: Actual conflict still blocks confirm
- **WHEN** a unique asset is already on a confirmed Event Booking for the same slot
- **THEN** a new booking confirm is rejected and alternatives may be suggested

### Requirement: Public Catalog And Wishlist
The system SHALL publish tenant Service Packages that are marked public on the tenant booking site with name, image, and formatted rate, and SHALL accept a wishlist or quote request that creates a Lead / inquiry for that tenant only.

#### Scenario: Guest requests a quote from the catalog
- **WHEN** a visitor adds public packages to a wishlist and submits contact details
- **THEN** a Lead (and tentative inquiry) is created on that tenant site with those packages and no other tenant’s catalog is shown

#### Scenario: Unpublished package hidden
- **WHEN** a package is not published
- **THEN** it does not appear on the public catalog

### Requirement: Event Work Blocks Consults
The system SHALL treat overlapping confirmed/in-progress Event Booking crew assignments as busy for appointment slot calculation for that staff member.

#### Scenario: Saturday gig blocks Saturday consult
- **WHEN** staff is assigned to a confirmed booking 2pm–6pm
- **THEN** consult slots overlapping that window are not offered
