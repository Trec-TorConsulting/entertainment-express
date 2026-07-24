# Capability: Vendor & Partner Network

## Purpose
Track **other vendors and referral partners** (photographers, planners, caterers, florists, venues,
lighting, other DJs used for overflow/subcontracting) for coordination, preferred networks, referral
tracking, and subcontracting. Standard in DJ Event Planner ("Vendors") and event coordination tools;
currently missing from our spec.

### Data Model
- **Vendor**: name, category, contacts, service_area, preferred (bool), rating, notes, w9/coi on file,
  subcontractor (bool), default_pay_terms.
- **Referral**: direction (`received|sent`), vendor (link), booking/lead (link), status, reward/commission,
  notes.
- **Vendor Assignment**: booking (link), vendor (link), role, agreed_cost, status — for subcontracted work.

## Requirements

### Requirement: Vendor Registry
The system SHALL maintain a vendor/partner directory with categories, contacts, and preferred status, with
full CRUD.

#### Scenario: Add a preferred photographer
- **WHEN** a tenant adds a photographer as a preferred partner
- **THEN** the vendor is available for referrals and event coordination

### Requirement: Referral Tracking
The system SHALL track referrals received from and sent to vendors, with optional commission/reward.

#### Scenario: Track a received referral
- **WHEN** a lead is marked as referred by a partner vendor
- **THEN** the referral is recorded and any agreed commission is tracked for that vendor

### Requirement: Subcontracting / Overflow
The system SHALL support assigning a subcontractor vendor to fulfill a booking (overflow) with agreed cost.

#### Scenario: Subcontract overflow event
- **WHEN** a booking is assigned to a subcontractor vendor because internal crew is unavailable
- **THEN** the assignment, agreed cost, and status are tracked and reflected in event costing

### Requirement: Vendor Coordination on Events
The system SHALL list the other vendors involved in an event for day-of coordination.

#### Scenario: Event vendor list
- **WHEN** staff/crew view an event
- **THEN** the other vendors (photographer, planner, caterer) and their contacts are visible for coordination
