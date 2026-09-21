## ADDED Requirements

### Requirement: Micro-Climate Forecast Telemetry
The system SHALL periodically query hourly weather forecast data for all confirmed outdoor events using the latitude and longitude coordinates of the venue.

#### Scenario: Polling 48-hour forecast for weekend festival
- **WHEN** the automated weather cron runs for a Saturday outdoor festival
- **THEN** the system logs forecasted temperature, wind speed, wind gust, and precipitation probability to `EE Weather Forecast Log`.

### Requirement: Automated Safety Threshold Gating
The system SHALL compare forecasted weather conditions against category threshold rules and flag high-risk bookings when wind or rain limits are exceeded.

#### Scenario: Wind gust exceeds 20 mph for bounce house
- **WHEN** the 24-hour forecast predicts 24 mph wind gusts for an inflatable booking
- **THEN** the system sets booking weather status to `Severe Risk` and dispatches an advisory alert to the dispatcher and client.

### Requirement: Self-Service Rain Date Rescheduling
The system SHALL provide clients with an automated option to reschedule weather-threatened outdoor bookings without losing their deposit.

#### Scenario: Client claims rain-date voucher
- **WHEN** a client on `/client/weather/:booking_id` clicks "Reschedule with Rain-Date Guarantee"
- **THEN** the booking is cancelled without penalty and an `EE Rain Date Voucher` is issued for 100% of the paid deposit.
