# Capability: Weather & Outdoor Risk

## Purpose
Forecast-driven outdoor risk for weather-sensitive bookings: thresholds, snapshots, rain-date offers, and portal alerts.

## Requirements

### Requirement: Weather Policy Configuration
The system SHALL let a tenant configure outdoor weather thresholds (wind, precipitation, lightning handling) and lead-time for checks, with full CRUD on a site-scoped policy.

#### Scenario: Enable wind threshold
- **WHEN** an owner sets max sustained wind to 25 mph and enables weather checks
- **THEN** the policy persists for this tenant site only and applies to weather-sensitive bookings

### Requirement: Weather-Sensitive Catalog Flags
The system SHALL allow service items and assets to be marked weather-sensitive with optional threshold overrides.

#### Scenario: Inflatable inherits policy
- **WHEN** a bounce-house asset is weather-sensitive without overrides
- **THEN** booking checks use the tenant Weather Policy thresholds

### Requirement: Forecast Snapshot On Bookings
The system SHALL fetch and store a forecast snapshot for confirmed weather-sensitive bookings inside the configured lead window, and set booking weather status to `clear|watch|warning|block|unknown`.

#### Scenario: Wind watch
- **WHEN** forecast wind exceeds watch but not block threshold
- **THEN** booking status is `watch` and staff are notified on existing channels

#### Scenario: Provider unavailable
- **WHEN** the weather provider fails
- **THEN** status is `unknown`, no automatic cancel occurs, and staff are alerted

### Requirement: Rain-Date Offer
The system SHALL support offering an alternate date/time that holds availability until the client accepts or the offer expires.

#### Scenario: Client accepts rain date
- **WHEN** a client accepts a valid rain-date offer
- **THEN** the booking moves to the new window, the hold converts, and the original slot is released without double-booking

### Requirement: Portal Weather Visibility
The system SHALL show weather status on owner job views and client booking detail when the booking is weather-sensitive.

#### Scenario: Owner sees weather strip
- **WHEN** an owner opens a weather-sensitive job with status `warning`
- **THEN** the job risk strip shows weather warning without Desk
