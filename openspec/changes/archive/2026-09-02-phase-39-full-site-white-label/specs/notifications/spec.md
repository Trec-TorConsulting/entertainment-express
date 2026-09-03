## ADDED Requirements

### Requirement: Email Chrome Uses White-Label Kit
The system SHALL wrap client-facing email bodies with company from-name and optional header logo/footer text from the white-label kit when configured.

#### Scenario: Confirmation email branded
- **WHEN** a booking confirmation email is sent with full white-label configured
- **THEN** the from-name and header/footer reflect the company kit, not Entertainment Express product copy
