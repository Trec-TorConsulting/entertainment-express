## Context

Tenant owners need a streamlined way to advertise overbooked jobs to their private partners or to the wider B2B network. Each owner must explicitly opt in (`b2b_exchange_opt_in`) to participate in cross-tenant B2B blasts while preserving strict multi-tenant database isolation.

## Goals / Non-Goals

**Goals:**
- Provide a Private & B2B Job Board tab in `/owner/subcontractors`.
- Implement `b2b_exchange_opt_in` toggle stored in `EE Portal Settings`.
- Enforce COI verification before job claiming.
- Dispatch offer tokens and sync dispatch calendar state.

**Non-Goals:**
- Direct cross-tenant SQL joins (listings are routed securely via Control Plane APIs).

## Decisions

- **Opt-In Preference Storage**: Stored as `b2b_exchange_opt_in` (0 or 1) in `EE Portal Settings` doc.
- **Listing Data Structure**: `EE Subcontract Job` with `visibility_scope` ("private" or "b2b_network") and `status` ("board_listed", "offered", "accepted").

## Risks / Trade-offs

- [Risk] Unqualified subcontractors claiming jobs → [Mitigation] Automated COI check + human-in-the-loop owner approval gate.
