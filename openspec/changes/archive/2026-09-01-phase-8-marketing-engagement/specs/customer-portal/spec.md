## ADDED Requirements

### Requirement: Client Applies Promo
The system SHALL let the paying customer apply a valid promo code on `/client`. Event guests SHALL NOT apply codes. Amounts SHALL be backend strings.

#### Scenario: Host applies a code
- **WHEN** a customer applies a valid unused code
- **THEN** the discount is applied and guests cannot call that API
