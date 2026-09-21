## ADDED Requirements

### Requirement: Multi-Brand Identity & Persona Configuration
The system SHALL allow an enterprise tenant to define multiple customer-facing brands with independent styling, logos, domains, communication channels, and payment descriptors.

#### Scenario: Defining wedding vs. rental brands
- **WHEN** an owner configures brand `Prestige Weddings` (dark blue, luxury font, wedding email) and `Jump City` (bright yellow, playful font, rentals email)
- **THEN** both brands exist under the same site database with isolated marketing touchpoints.

### Requirement: Dynamic Brand-Themed Client Portal
The system SHALL theme the customer portal (`/client`) using the visual identity of the brand associated with the client's booking.

#### Scenario: Client logs into wedding booking
- **WHEN** a client views a booking associated with brand `Prestige Weddings`
- **THEN** the portal renders the Prestige Weddings logo, navy color palette, and brand contact info.

### Requirement: Brand-Scoped Transactional Communications
The system SHALL dispatch emails and SMS messages using the sender name, email address, and Twilio phone number configured for the booking's brand.

#### Scenario: Dispatching booking confirmation email
- **WHEN** an automated confirmation email is sent for a `Jump City` booking
- **THEN** the SMTP `From:` header is `Jump City <hello@jumpcityrentals.com>` and the SMS arrives from the Jump City Twilio number.
