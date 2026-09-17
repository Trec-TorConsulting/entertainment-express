# Tasks: Universal Geo-Biased Place, Business & Address Lookup Autocomplete

- [x] Task 1: Update `entertainment_express/integrations/maps.py` and `entertainment_express/api/venues.py` with `user_lat`, `user_lon` proximity bias and `reverse_geocode_location` API.
- [x] Task 2: Create reusable `frontend/portal-kit/src/components/AddressLookupInput.tsx` component and export in `@portal-kit`.
- [x] Task 3: Integrate `AddressLookupInput` across `/owner` (`PlacesPage.tsx`, `SmartQuoteModal.tsx`), `/client` (`EventDetailPage.tsx`), and `/employee` (`ShiftDetailScreen.tsx`).
- [x] Task 4: Add smoke test assertions for proximity search and reverse geocoding in `smoke_test.py`.
- [x] Task 5: Validate, run smoke tests, commit, push, build tag `0.1.42-ee`, and deploy to production cluster.
