# Change Proposal: Universal Geo-Biased Place, Business & Address Lookup Autocomplete

## Why
Users across `/owner`, `/client`, and `/employee` portals currently have to manually type out full company names, street addresses, cities, states, zip codes, and phone numbers. This causes friction, address typos, and missing GPS coordinates needed for truck dispatch, travel calculation, and weather risk monitoring.

## What Changes
1. **Geo-Biased & Multi-Provider Search Backend**: Update `entertainment_express.api.venues.search_places_autocomplete` to accept GPS coordinates (`user_lat`, `user_lon`) and `lookup_type` (`"address"`, `"business"`, `"all"`), adding 1-tap reverse geocoding.
2. **Shared Mobile-First `<AddressLookupInput />` Component**: React component in `@portal-kit` with GPS "Use My Location" proximity bias, 1-tap current location fill, and structured auto-fill for Title, Street Address, City, State, Zip, Geo, and Phone.
3. **Multi-Portal Integration**: Embed `<AddressLookupInput />` across `/owner` (Places, Quotes, Studio), `/client` (Booking & Event forms), and `/employee` (Crew PWA shift check-in).
