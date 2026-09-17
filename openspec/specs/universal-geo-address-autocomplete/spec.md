# universal-geo-address-autocomplete Specification

## Purpose
TBD - created by archiving change universal-geo-address-autocomplete. Update Purpose after archive.
## Requirements
### Requirement: Geo-Biased Place & Business Autocomplete API
The search endpoint `entertainment_express.api.venues.search_places_autocomplete` SHALL accept `user_lat` and `user_lon` parameters to bias results toward the user's geographic location.

#### Scenario: Location-biased place search
- **WHEN** a user searches for a place while passing `user_lat` and `user_lon`
- **THEN** nearby venues and addresses matching the search query are prioritized in the response.

### Requirement: Reverse Geocoding API
The system SHALL provide a whitelisted API endpoint `entertainment_express.api.venues.reverse_geocode_location` to convert latitude and longitude into a full street address.

#### Scenario: 1-Tap current GPS location lookup
- **WHEN** a user taps "Use Current Location" in the address lookup field
- **THEN** the system reverse-geocodes the coordinates and auto-fills the formatted address.

### Requirement: Shared AddressLookupInput Component
The shared `@portal-kit` design system SHALL export a mobile-optimized `<AddressLookupInput />` component for `/owner`, `/client`, and `/employee` portals.

#### Scenario: Auto-fill form fields on suggestion selection
- **WHEN** a user selects an address or business from the autocomplete dropdown
- **THEN** all associated form fields (Title, Address, City, State, Zip, Geo, Phone) are populated.

