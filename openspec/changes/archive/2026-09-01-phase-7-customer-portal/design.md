## Context

`/client` already signs, pays, plans, chats, and books consults. Photos is an EmptyState. Customers cannot request reschedule/add-on/cancel on the job (staff-only APIs). Isolation is site-per-tenant. Money uses `flt` + `fmt_money` strings. Guests are not payers.

Stakeholders: `EE Customer` (payer), `EE Tenant Admin` (publish/decide). `EE Event Guest` may view published photos for their event only.

## Goals / Non-Goals

**Goals:**
- Owner uploads a file on a job and publishes it.
- Event members download published deliverables; unpublished stay owner-only.
- Payer requests reschedule, add-on, or cancel; owner approves or declines on Today.
- Approve runs existing booking APIs; add-on rates go through `flt`.

**Non-Goals:**
- External gallery OAuth, CDN, transcoding.
- Auto-approve without staff.
- Guest-initiated change requests or uploads.

## Decisions

### D1 — DocTypes
**EE Deliverable**: `booking`, `title`, `kind` (`photo|video|receipt|other`), `file_name`, `mime`, `content_b64` (Long Text, private), `published`, `published_at`.
**EE Booking Change**: `booking`, `request_type` (`reschedule|add_on|cancel`), requested date/times, `item_code`, `notes`, `status` (`pending|approved|declined|applied`), `requested_by`.

**Alt:** Frappe File Attach only. **Rejected for v1** — whitelist download with membership check is simpler than signed URLs; 5 MB cap.

### D2 — Membership
Reuse `portal_collaboration.is_booking_member` for list/download. Publish/upload is staff (`EE Tenant Admin` / `EE Sales` / `EE Dispatcher`). Change requests are payer-only.

### D3 — Apply on approve
| Type | Action |
|---|---|
| reschedule | `booking.reschedule_booking` (availability) |
| cancel | `booking.cancel_booking` |
| add_on | append `service_items` with `flt(Item.standard_rate)` if `item_code` set; else mark approved for staff to add on the proposal |

### D4 — Files
| Area | Path |
|---|---|
| API | `api/deliverables.py`, `api/booking_changes.py` |
| DocTypes | `ee_deliverable`, `ee_booking_change` |
| Portal | owner job panel; client `/photos` and Events |
| Tests | `tests/test_phase7_customer_portal.py` |

### D5 — Money
Add-on rates `flt` on the server. Portal never multiplies. Display strings from `fmt_money` when returned.

## Risks / Trade-offs

- [Huge uploads] → 5 MB cap; reject with “file is too large”.
- [Base64 in DocType] → private Long Text; never list `content_b64` in list APIs.
- [Guest leakage] → unpublished 403; other bookings 403.

## Migration Plan

1. DocTypes + patch; migrate.
2. APIs + SPA rebuild; bump `0.0.63-ee` → `0.0.64-ee`.
3. Rollback: hide Photos upload; records remain.

## Open Questions

- None blocking.
