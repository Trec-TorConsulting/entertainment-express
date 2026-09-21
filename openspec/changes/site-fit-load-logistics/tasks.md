## 1. DocType Schemas & Physical Specs

- [x] 1.1 Create `EE Venue Site Profile` DocType storing gate width, stair count, surface type, power distance, and gate codes.
- [x] 1.2 Add packed dimensions (`packed_length_in`, `packed_width_in`, `packed_height_in`), weight (`packed_weight_lbs`), and electrical draw (`amperage_draw`) to `Item`.
- [x] 1.3 Create `EE Vehicle Load Manifest` DocType to track weight and volume limits.

## 2. Server APIs & Compatibility Logic

- [x] 2.1 Implement `validate_site_fit` checking gate width, power reach, and surface anchoring rules.
- [x] 2.2 Implement `check_vehicle_load_balance` calculating total weight and volume utilization percentages.
- [x] 2.3 Add validation hook in Booking submission flagging site-fit blockers or requiring customer acknowledgment.
- [x] 2.4 Implement `get_driver_site_packet` with crew role authorization check.

## 3. Portal UI & Dispatch Board Integration

- [x] 3.1 Build `SiteFitQuestionnaire.tsx` in client portal intake with visual reference guides.
- [x] 3.2 Build `LoadPlanning.tsx` in `/owner/dispatch/load-planning` with visual vehicle capacity gauges.
- [x] 3.3 Add `DriverSitePacket.tsx` to `/employee/field` with 1-click gate code copy and map launcher.

## 4. Verification & Testing

- [x] 4.1 Write automated tests `test_site_fit_validation.py` testing gate clearance blocks, asphalt sandbag requirements, and overloaded vehicle warnings.
