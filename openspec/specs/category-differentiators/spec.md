# Capability: Category Differentiators

## Purpose
Moat features: Event Day Copilot, demand nudges, overflow exchange, live event page, ops badge, PaaS surface, starter kits, after-action loop.

## Requirements

### Requirement: Event Day Copilot
The system SHALL provide an AI copilot for crew and staff grounded in the booking's timeline, music lists, and venue logistics, degrading gracefully when the LLM is unavailable.

#### Scenario: Copilot answers run-of-show question
- **WHEN** crew asks when grand entrance is scheduled
- **THEN** the assistant answers from this booking's timeline only

### Requirement: Demand Heatmap And Nudges
The system SHALL expose demand forecasts by service area/event type and suggest package add-ons without auto-charging.

#### Scenario: Nudge add-on
- **WHEN** owner views a wedding quote in a peak zip
- **THEN** suggested add-ons appear and require explicit accept before price changes

### Requirement: Partner Overflow Exchange
The system SHALL allow opt-in overflow offers between EE tenants mediated by the control plane with audit, without exposing customer PII until both sides accept and customer consent is recorded.

#### Scenario: Offer without PII leak
- **WHEN** tenant A posts an overflow offer
- **THEN** tenant B sees capability/date/area metadata only until claim + consent

### Requirement: Client Live Event Page
The system SHALL provide a shareable guest Live Event Page (QR) with timeline highlights, song voting, safety rules, and published gallery link.

#### Scenario: Guest opens live page
- **WHEN** a guest scans the event QR
- **THEN** they can vote songs and view published info without paying or signing payer documents

### Requirement: Ops Reliability Badge
The system SHALL compute an optional ops score (on-time, waiver completion, inspection currency) and allow showing a badge on the public booking site.

#### Scenario: Badge hidden when disabled
- **WHEN** the owner disables the reliability badge
- **THEN** the public site does not show the score

### Requirement: PaaS Developer Surface
The system SHALL publish a tenant-scoped API/webhook catalog and embed SDK documentation for building on EE as a platform.

#### Scenario: List webhook events
- **WHEN** a developer opens PaaS docs for their tenant
- **THEN** available webhook event types and auth methods are listed for that site only

### Requirement: Vertical Starter Kits
The system SHALL offer one-click starter kits that seed catalog items, planning form templates, waivers, and timelines for configurable vertical tags without hard-coding engines.

#### Scenario: Apply inflatable kit
- **WHEN** an owner applies the Inflatable starter kit
- **THEN** sample items, waiver template, and site-fit defaults are created once (idempotent)

### Requirement: After-Action Revenue Loop
The system SHALL after job completion optionally generate a highlight reel link from published media, request a review, and offer rebooking using existing marketing journeys.

#### Scenario: Post-event loop
- **WHEN** a job completes and the loop is enabled
- **THEN** review and rebook steps enqueue without crashing if media or Twilio is missing
