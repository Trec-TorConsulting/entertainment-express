# place-lookup-autocomplete

## ADDED Requirements

### Requirement: Place Search Autocomplete Endpoint
The system SHALL provide a whitelisted API endpoint `entertainment_express.api.venues.search_places_autocomplete` accessible to authorized staff.

#### Scenario: Multi-provider place search query
- **WHEN** an authorized user calls `search_places_autocomplete(query="Ritz")`
- **THEN** the system returns structured place suggestions containing title, address, and coordinates.

### Requirement: Live Place Lookup UI
The `/owner/places` Add/Edit Place modal SHALL include a Place & Address Lookup field with live debounced search suggestions.

#### Scenario: Auto-fill venue details on suggestion select
- **WHEN** a user selects a place suggestion from the autocomplete dropdown
- **THEN** the venue name and street address fields are automatically populated.
