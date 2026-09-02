## Why

Pay, documents, planning, chat, people, and consults already work on `/client`. Photos is still an empty state, and the host cannot ask to move the date, add a package, or cancel without emailing staff. HoneyBook-class portals let the paying customer request those changes and download published galleries. Phase 18 closed owner move-in; this phase closes remaining client self-service without Desk.

## What Changes

- Add **EE Deliverable** (photo, video, receipt, other) attached to a job. Owner publishes from the job. `/client/photos` lists published files for members of that event, with a private download. Guests see published photos for their event only; they cannot upload or see drafts.
- Add **EE Booking Change** for reschedule, add-on, and cancel requests from the paying customer. Requests land in the owner approvals queue. Approve applies via existing `reschedule_booking` / `cancel_booking` / booking line insert (`flt` rates). Decline stores a reason. Guests 403.
- **Explicit non-goals:** Dropbox/Google Photos OAuth, public unauthenticated galleries, video transcoding, auto-approve without staff, Eventsquid ticketing, phase 8 campaigns.

## Capabilities

### New Capabilities

- (none) — `customer-portal` already exists in baseline specs.

### Modified Capabilities

- `customer-portal`: Working Photos; booking change requests on Events; no `/app`.
- `owner-portal`: Publish deliverables on the job; decide change requests from Today approvals.
- `identity-access`: Guests cannot request changes or upload; guest photo access is published + membership only.
- `booking-availability`: Reschedule still goes through `reschedule_booking` availability checks.
- `billing-payments`: Add-on apply uses `flt` + existing booking lines; SPA shows backend money strings only.
- `notifications`: Change requested / decided uses existing `notifications.send`; missing Twilio does not crash.

## Impact

- Backend: `api/deliverables.py`, `api/booking_changes.py`; DocTypes `EE Deliverable`, `EE Booking Change`.
- Frontends: owner job editor + client Events/Photos; rebuild `public/{owner,client}/`.
- Tests: `tests/test_phase7_customer_portal.py` — isolation, guest 403, unpublished hidden.
- Cluster: bump bench image `0.0.63-ee` → `0.0.64-ee`; migrate tenant sites.
- Depends on: phase-1 bookings, phase-5/26 pay/sign, phase-25 membership/chat.
