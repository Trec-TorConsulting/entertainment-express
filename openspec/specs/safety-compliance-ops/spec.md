# Capability: Safety Compliance Ops

## Purpose
Asset inspection certificates, sanitization logs, and attendee waiver QR flows beyond payer waivers.

## Requirements

### Requirement: Asset Inspection Certificates
The system SHALL store inspection certificates per asset with expiry and SHALL exclude assets from booking when a required certificate is expired or missing.

#### Scenario: Expired cert blocks asset
- **WHEN** an asset has required inspection expired
- **THEN** it cannot be assigned to a new overlapping booking

### Requirement: Sanitization Logging
The system SHALL record post-use sanitization for assets with who/when/method and optional photos.

#### Scenario: Log after bounce house return
- **WHEN** crew completes sanitization after check-in
- **THEN** a sanitization log is stored linked to asset and booking

### Requirement: Attendee Waiver QR
The system SHALL issue a booking-scoped QR/link for attendee liability waivers distinct from the paying customer's waiver.

#### Scenario: Guest signs attendee waiver
- **WHEN** an event guest opens the attendee waiver link and signs
- **THEN** the attendee waiver is stored with audit fields and the guest still cannot pay or sign payer documents
