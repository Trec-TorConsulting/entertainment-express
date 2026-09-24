# approval-system-checks-and-balances Specification

## Purpose
TBD - created by archiving change approval-system-checks-and-balances. Update Purpose after archive.
## Requirements
### Requirement: Unified Approval & Checks-and-Balances Endpoint
The system SHALL aggregate pending time off requests, gig assignment offers, client booking change requests, and timesheets into a unified pending approvals list for owners and entertainers.

#### Scenario: Listing pending approvals
- **WHEN** an owner or entertainer loads the `/approvals` view or calls `list_pending_approvals`
- **THEN** the system returns structured pending items requiring review.

### Requirement: Time Off Approval & Decision Workflow
The system SHALL allow owners and managers to approve or decline worker time off requests with optional decision notes.

#### Scenario: Owner approves worker time off
- **WHEN** the owner clicks approve on a pending worker time off request
- **THEN** the time off status changes to Approved and the employee receives confirmation.

### Requirement: Entertainer Gig Assignment Acceptance
The system SHALL allow assigned entertainers and field crew to accept or decline offered gig assignments.

#### Scenario: Entertainer accepts gig assignment
- **WHEN** the entertainer accepts an offered gig assignment
- **THEN** the crew assignment status changes to `accepted` and dispatch schedule is confirmed.

### Requirement: Client Request Review & Approval
The system SHALL allow owners and assigned talent to review and approve or reject client booking change requests and custom add-ons.

#### Scenario: Owner approves client reschedule request
- **WHEN** the owner approves a client's pending reschedule request
- **THEN** the booking event date updates and the request status changes to `applied`.

