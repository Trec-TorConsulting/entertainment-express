## Context

In live events, failure to show up means a ruined wedding or cancelled corporate event, followed by devastating lawsuits and reputational ruin. Time is of the essence: a replacement must be secured in minutes, not hours.

## Goals / Non-Goals

**Goals:**
- Target only qualified workers: match `worker.skills` contains required role (e.g. `Lead DJ`, `Inflatable Driver`, `Photo Booth Attendant`).
- Filter out workers who are already assigned to overlapping bookings or have active time-off requests.
- Generate unique URL tokens for each recipient sent via Twilio SMS: `https://{tenant}.app.entx.app/claim/{token}`.
- Use atomic MariaDB row-level locks (`SELECT FOR UPDATE`) on claim execution to ensure that race conditions (two workers tapping simultaneously) award the shift to only one person without error.
- Notify dispatcher and client immediately upon successful claim.

**Non-Goals:**
- Automated gig bidding war where workers bid down the price (we offer a fixed flat rate + optional surge bonus).
- Independent consumer rideshare gig marketplace (this is strictly professional event crew and peer business operators).

## Architecture & DocType Definitions

### 1. `EE Emergency Callout`
- **Fields:**
  - `booking`: Link to `Booking` (required)
  - `required_role`: Link to `EE Worker Role`
  - `event_datetime`: Datetime
  - `call_time`: Datetime
  - `base_payout`: Currency
  - `surge_bonus`: Currency (default 0.0)
  - `total_payout`: Currency (calculated: base + surge)
  - `status`: Select (`Broadcasting`, `Claimed`, `Expired`, `Cancelled`)
  - `claimed_by_worker`: Link to `Worker`
  - `claimed_at`: Datetime
  - `recipients`: Table (`EE Emergency Recipient`)

### 2. `EE Emergency Recipient` (Child Table)
- **Fields:**
  - `worker`: Link to `Worker`
  - `phone_number`: Data
  - `token`: Data (unique 32-char hex string)
  - `sms_status`: Select (`Queued`, `Sent`, `Delivered`, `Failed`)
  - `viewed_at`: Datetime
  - `action`: Select (`None`, `Claimed`, `Declined`)

## Server APIs & Python Hooks

File: `entertainment_express/scheduling_dispatch/api.py`

```python
import frappe
import secrets
from frappe.utils import now_datetime

@frappe.whitelist()
def launch_emergency_crew_cascade(booking_id, required_role, surge_bonus=0, tier="all_internal"):
    """
    Finds matching available workers, generates tokens, and fires SMS cascade via Twilio.
    """
    pass

@frappe.whitelist(allow_guest=True)
def get_emergency_shift_preview(token):
    """Returns sanitized shift details (time, city, payout, gear required)."""
    pass

@frappe.whitelist(allow_guest=True)
def claim_emergency_shift(token):
    """
    Atomic transaction:
    Locks EE Emergency Callout row with SELECT FOR UPDATE.
    If status == 'Broadcasting': assign worker, set status='Claimed', trigger notifications.
    Else: return {'success': False, 'message': 'Shift has already been claimed'}.
    """
    pass
```

## Frontend Portal Architecture

- **Path:** `apps/portal-kit/src/pages/public/ClaimEmergencyShift.tsx` (`/claim/:token`)
  - Mobile card with large pulse-animated "CLAIM SHIFT ($250 + $100 SURGE)" button.
  - Event details: Call Time, Venue City, Required Attire, Equipment Provided.
  - 1-tap confirmation with haptic feedback.
- **Path:** `apps/portal-kit/src/pages/owner/dispatch/EmergencyDrawer.tsx`
  - Modal on dispatch board with live ticker showing "Sent to 8 DJs... 3 viewed... Claimed by Marcus T. (4 mins elapsed)".

## Multi-Tenant Isolation & Security

- Shift claim tokens are strictly verified within the tenant's MariaDB database.
- Subcontractor exchange postings broadcast to the control plane are stripped of client personal PII (only event type, city/state, call time, and technical rider are shared).

## Risks & Mitigations

- **Risk:** Worker taps claim by accident and cancels 10 minutes later.
- **Mitigation:** Require a secondary confirmation step ("Are you sure you can arrive at 4:30 PM?") and apply an emergency reliability rating penalty if cancelled post-claim.
