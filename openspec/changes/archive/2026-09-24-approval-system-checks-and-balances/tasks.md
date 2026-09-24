## 1. Backend Unified Approvals Engine

- [ ] 1.1 Update `Worker Time Off` fields in `portal_hr.py` and DocType to support approval statuses (`Pending Review`, `Approved`, `Rejected`), approval functions (`approve_time_off`, `reject_time_off`), and employee notifications.
- [ ] 1.2 Implement `entertainment_express/api/portal_approvals.py` exposing `list_pending_approvals`, `approve_item`, `decline_item`, and status metrics across time off, gig offers, client change requests, and timesheets.
- [ ] 1.3 Update `booking_changes.py` to support single-click approval/rejection of client reschedule and add-on requests.

## 2. Frontend Approvals & Checks Command Center

- [ ] 2.1 Build `ApprovalsPage.tsx` in `frontend/owner-portal/src/app/routes/approvals/ApprovalsPage.tsx` with tabbed approval queues (Time Off, Gig Offers, Client Requests, Timesheets), metric cards, decision modals, and action buttons.
- [ ] 2.2 Register `/approvals` route in `App.tsx` and sidebar navigation item in `OwnerLayout.tsx`.

## 3. Verification & Deployment

- [ ] 3.1 Verify frontend Vite build (`npm run build` in `frontend/owner-portal`).
- [ ] 3.2 Run `python3 smoke_test.py` to ensure 28/28 test suites pass cleanly.
- [ ] 3.3 Execute `./scripts/build-push-bench.sh 0.1.29-ee` and promote to K3S cluster with `./entertainment-express/scripts/promote-image.sh 0.1.29-ee --apply`.
