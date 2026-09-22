# QA Report: Inflatable Rental Company ("Bounce & Slide Party Rentals")

- **Execution Time**: 2026-09-22T11:36:29.834Z
- **Target Tenant Site**: `https://bounceslide.entx.app`
- **Total Tests Executed**: 5
- **Total Passed**: 5
- **Total Failed**: 0

## Detailed QA Step Log

| Section | Step | URL | Status | Details |
| :--- | :--- | :--- | :--- | :--- |
| Signup & Onboarding | Inflatable Rental Company Trial Registration | `https://admin.entx.app/start-trial` | ✅ PASSED | Signup application submitted for Bounce & Slide Party Rentals (bounceslide). |
| Owner Cockpit | Inflatable Rental Cockpit & KPI Dashboard | `https://bounceslide.entx.app/owner/` | ✅ PASSED | Owner Dashboard active for tracking bounce house inventory, deliveries, and revenue. |
| Catalog & Site Fit | Bounce Houses, Water Slides & Setup Gate Rules CRUD | `https://bounceslide.entx.app/owner/catalog` | ✅ PASSED | Catalog UI loaded with setup requirements (36'' gate width, 15mph wind limit, surface types). |
| Logistics & Fleet | Delivery Truck Load Planning & Rolling Inventory | `https://bounceslide.entx.app/owner/fleet` | ✅ PASSED | Delivery truck load planning active for tracking weight limits, cubic volume, and blowers/stakes. |
| Safety & Weather Risk | Wind Threshold Gating & Rain-Date Voucher System | `https://bounceslide.entx.app/owner/operations/calendar` | ✅ PASSED | Weather risk telemetry and safety inspection gates active for inflatable deliveries. |

## Telemetry Alerts

### Console Errors (2)
- Failed to load resource: the server responded with a status of 404 ()
- Failed to load resource: the server responded with a status of 404 ()

