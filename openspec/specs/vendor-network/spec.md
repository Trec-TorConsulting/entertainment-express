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

### Requirement: Vendor Directory On Company OS
The system SHALL let the owner maintain partners (category, contacts, preferred, W-9 / COI on file, subcontractor flag) on `/owner` without `/app`.

#### Scenario: Add a preferred photographer
- **WHEN** an owner adds a photographer as preferred
- **THEN** that partner is available for referrals and job coordination on this site only

### Requirement: Referral Tracking
The system SHALL record referrals sent or received with optional commission stored via `flt` and shown as a backend money string.

#### Scenario: Track a received referral
- **WHEN** a lead is marked as referred by a partner
- **THEN** the referral is stored on this site and the commission amount is a formatted string in the portal

### Requirement: Overflow Assignment
The system SHALL assign a subcontractor partner to a job with agreed cost (`flt`) and status.

#### Scenario: Subcontract overflow event
- **WHEN** dispatch assigns a subcontractor because internal crew is unavailable
- **THEN** the assignment, agreed cost string, and status are stored on that booking

### Requirement: Event Vendor List
The system SHALL list other vendors on a job for day-of coordination (name, role, phone).

#### Scenario: Crew sees other vendors
- **WHEN** crew opens an assigned job
- **THEN** other vendors and their contacts for that job are visible and other tenants’ vendors are not
