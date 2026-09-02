## ADDED Requirements

### Requirement: White-Label And Domain Workspaces
The system SHALL let the owner manage company white-label settings and custom domains (DNS instructions, verify, primary domain, TLS status) from `/owner` without Desk.

#### Scenario: Owner completes domain setup
- **WHEN** an owner adds a hostname, follows CNAME instructions, and verifies successfully
- **THEN** Security (or Brand) shows verified + TLS status and they can set it as the primary domain

#### Scenario: Brand settings preview
- **WHEN** an owner updates logo and hide-product-chrome
- **THEN** `/owner` restyles immediately from bootstrap without a Desk visit
