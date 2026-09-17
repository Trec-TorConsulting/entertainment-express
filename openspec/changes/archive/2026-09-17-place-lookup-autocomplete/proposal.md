# Change Proposal: Place & Address Lookup Autocomplete for /owner/places

## Why
When venue owners or customers add a new place/venue in `/owner/places`, they currently have to manually type out full venue names and street addresses. This is slow, error-prone, and misses GPS coordinates needed for dispatch, weather risk automation, and route planning.

## What Changes
1. **Multi-Provider Place Search API**: Whitelisted Frappe API endpoint `entertainment_express.api.venues.search_places_autocomplete` querying Mapbox Places, Google Places, and zero-key OpenStreetMap Nominatim fallback.
2. **Interactive Place Autocomplete**: Live debounced search input inside `/owner/places` modal with auto-fill for Venue Name, Street Address, and Geo Coordinates.
3. **Automated Testing**: Added smoke test verification for map search logic.
