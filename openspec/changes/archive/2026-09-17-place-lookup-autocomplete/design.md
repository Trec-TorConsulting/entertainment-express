# System Design: Place & Address Lookup Autocomplete

## Architecture Overview

```
 ┌─────────────────────────────────────────────────────────────┐
 │ /owner/places React Component (PlacesPage.tsx)              │
 │  - Live debounced search input (300ms)                     │
 │  - Dropdown suggestion menu (Title, Address, City/State)   │
 │  - Auto-fills Venue Name, Address, Geo                     │
 └──────────────────────────────┬──────────────────────────────┘
                                │
                                ▼ HTTP GET
 ┌─────────────────────────────────────────────────────────────┐
 │ frappe.call("entertainment_express.api.venues.search...")   │
 └──────────────────────────────┬──────────────────────────────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          ▼                     ▼                     ▼
┌──────────────────┐  ┌──────────────────┐  ┌────────────────────┐
│ Mapbox Geocoding │  │  Google Places   │  │   OSM Nominatim    │
│ (if token set)   │  │ (if key set)     │  │ (zero-key fallback)│
└──────────────────┘  └──────────────────┘  └────────────────────┘
```

## Data Schema & API Contract

### Request: `search_places_autocomplete`
- `query` (str): Search term e.g., `"Ritz Carlton Atlanta"` or `"4500 Pine Crest Way"`

### Response: `list[dict]`
```json
[
  {
    "title": "The Ritz-Carlton, Atlanta",
    "address": "181 Peachtree St NE, Atlanta, GA 30303",
    "geo": "33.7591,-84.3880",
    "lat": 33.7591,
    "lon": -84.3880,
    "city": "Atlanta",
    "state": "GA",
    "postcode": "30303",
    "country": "United States"
  }
]
```

## Multi-Tenant Security & Rate Limiting
- Whitelisted Frappe endpoint enforcing `_require_staff()` permissions.
- In-memory caching and request timeouts (3s) to prevent external blocking.
