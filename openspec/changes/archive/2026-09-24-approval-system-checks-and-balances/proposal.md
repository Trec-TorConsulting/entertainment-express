## Why

Managing mobile entertainment operations requires robust checks and balances: owners need to review and approve staff time off/PTO requests, entertainers need to accept or decline gig assignments, and owners/entertainers need to review and approve client change requests (reschedules, add-on equipment, song/timeline modifications). A unified Approvals & Checks System ensures full operational transparency, audit logging, and automated notifications.

## What Changes

- **Unified Approvals API Backend (`entertainment_express/api/portal_approvals.py`)**:
  - `list_pending_approvals`: Aggregates all pending time off requests, offered gig assignments, client booking change requests, and timesheet approvals.
  - `approve_item` & `decline_item`: Handles approval/rejection logic for time off, gig offers, client change requests, and timesheets.
- **Worker Time Off Approval Status (`Worker Time Off`)**:
  - Add status field (`Pending Review`, `Approved`, `Rejected`), `decision_by`, `decision_date`, and `decision_notes`.
- **Entertainer / Crew Gig Acceptance (`Crew Assignment`)**:
  - Enable Entertainers and Field Crew to accept or decline assigned gigs via Employee / Crew app and Approvals Hub, updating assignment status and notifying dispatchers.
- **Client Request Approval Flow (`EE Booking Change`)**:
  - Enables owners & assigned entertainers to review, approve, or decline client reschedules, add-on requests, and timeline modifications.
- **Approvals & Checks-and-Balances Command Center (`frontend/owner-portal/src/app/routes/approvals/ApprovalsPage.tsx`)**:
  - New flagship portal route `/approvals` providing tabbed approval queues (Time Off, Gig Offers, Client Requests, Timesheets), approval metrics, filter options, and single-click Approve/Decline dialogs with decision notes.

## Capabilities

### New Capabilities
- `approval-system-checks-and-balances`: Centralized approval workflow, time off approval, entertainer gig acceptance, and client change request approvals.

### Modified Capabilities
- None.

## Impact

- `entertainment_express/api/portal_approvals.py`: New whitelisted approval API.
- `entertainment_express/api/portal_hr.py`: Upgrade time off functions to handle status transitions and manager approvals.
- `entertainment_express/api/booking_changes.py`: Expose approve/decline functions for client requests with notifications.
- `frontend/owner-portal/src/app/routes/approvals/ApprovalsPage.tsx`: New Approvals Command Center.
- `frontend/owner-portal/src/app/App.tsx` & `OwnerLayout.tsx`: Register `/approvals` route and sidebar navigation link.
