# Tasks: Phase 28 — Site Fit & Delivery Windows

## 1. Schema
- [x] 1.1 Service Item fulfillment_mode + site-fit child; Venue structured fields; Booking delivery/pickup windows; Asset weight; Vehicle max_payload.
      **Accept:** migrate; defaults non-breaking.
## 2. Engines
- [x] 2.1 `evaluate_site_fit` ok|warn|block; policy on Booking Site Config.
- [x] 2.2 Load weight check on assignment/packing; warn by default.
## 3. Dispatch & portals
- [x] 3.1 Board shows windows + overweight flag; owner/employee edit windows.
- [x] 3.2 Client site-fit questionnaire when required.
## 4. Tests
- [x] 4.1 Isolation; attended requires crew; overweight warn; unfit site block when configured.
