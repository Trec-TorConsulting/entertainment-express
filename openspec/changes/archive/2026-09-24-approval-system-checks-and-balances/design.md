## Context

Multi-tenant mobile entertainment platform requires checks and balances across three key approval workflows:
1. **Time Off & PTO Approvals**: Employee submits time off request -> Owner/Manager approves or declines -> Employee notified.
2. **Entertainer Gig Acceptance**: Dispatcher assigns gig -> Entertainer accepts or declines -> Dispatcher notified.
3. **Client Change & Custom Requests**: Client submits reschedule/add-on/timeline request -> Owner/Entertainer approves or declines -> Booking updated and client notified.

## Goals / Non-Goals

**Goals:**
- Provide a unified API `entertainment_express.api.portal_approvals` aggregating all pending items.
- Provide a dedicated `/approvals` screen in the Owner Portal and Employee App.
- Send real-time notifications (email & in-app alerts) whenever an approval state changes.

**Non-Goals:**
- Multi-stage hierarchical workflow routing (e.g. 5-level corporate signoff). Single-stage checks-and-balances is sufficient.

## Decisions

- **Unified Status Representation**: Map domain items into a standardized approval structure (`id`, `category`, `title`, `subtitle`, `requester`, `date`, `status`, `notes`).
- **Domain Handlers**:
  - Time off: Updates `Worker Time Off` status (`Approved` / `Rejected`).
  - Gig assignment: Updates `Crew Assignment` status (`accepted` / `declined`).
  - Client request: Updates `EE Booking Change` status (`applied` / `rejected`).

## Risks / Trade-offs

- [Risk] Concurrent approval actions on gig assignments. → Mitigation: Wrap status transitions in MariaDB transactions with permission validation.
