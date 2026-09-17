# System Design: Universal Geo-Biased Place, Business & Address Lookup Autocomplete

## Architecture

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │ Shared <AddressLookupInput /> (@portal-kit)                           │
 │  - Proximity GPS toggle (navigator.geolocation)                       │
 │  - Debounced search & reverse geocoding                              │
 │  - Structured auto-fill callback (Title, Address, City, State, Zip, Phone) │
 └───────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │ Backend: search_places_autocomplete / reverse_geocode_location        │
 │  - Accepts: query, user_lat, user_lon, lookup_type                     │
 │  - Multi-provider: Mapbox, Google Places, OpenStreetMap Nominatim     │
 └────────────────────────────────────────────────────────────────────────┘
```

## Data Schema & API Contract
- `search_places_autocomplete(query, user_lat, user_lon, lookup_type)` -> returns `list[dict]` containing `title`, `address`, `street`, `city`, `state`, `postcode`, `country`, `phone`, `lat`, `lon`, `geo`.
- `reverse_geocode_location(lat, lon)` -> returns `dict` with formatted address and city/state components.
