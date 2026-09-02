## ADDED Requirements

### Requirement: Weather Sensitive Flag On Items And Assets
The system SHALL support a `weather_sensitive` flag (and optional numeric threshold overrides) on service items and service assets.

#### Scenario: Mark outdoor game truck
- **WHEN** a tenant marks a game-truck service item weather-sensitive
- **THEN** new bookings of that item participate in weather checks
