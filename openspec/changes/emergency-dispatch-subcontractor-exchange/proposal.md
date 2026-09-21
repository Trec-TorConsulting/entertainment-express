## Why

A last-minute crew cancellation—such as a lead DJ waking up with a 103-degree fever or a delivery driver blowing a transmission 3 hours before a wedding—is the single most terrifying emergency an entertainment business owner can face. Finding an emergency replacement requires frantic, manual phone calls to 15 different freelancers while trying to explain call times and rates. If internal staff cannot cover, owners resort to Facebook groups where unvetted subcontractors lack liability insurance and demand extortionate cash rates. Operators need an automated emergency dispatch cascade that pings qualified workers with 1-tap accept links, paired with a verified B2B peer subcontractor exchange.

## What Changes

- Introduce an **Emergency Crew Replacement Cascade** in Frappe dispatch: when an assignment is dropped within 24 hours of call time, the dispatcher initiates a 1-click automated call-out ladder.
- Provide **Tokenized 1-Tap Shift Claiming**: available, skill-matched W2 staff and 1099 contractors receive an instant SMS containing gig details, call time, venue location, and an optional emergency surge bonus (e.g. +$100 short-notice premium).
- The first qualified crew member to tap "Claim Shift" locks the assignment; subsequent taps display a polite "Shift Already Covered" message.
- Provide a **B2B Peer Subcontractor Exchange**: if internal crew cannot fill the slot within 30 minutes, the owner can broadcast the gig packet to verified peer entertainment operators on the B2B exchange network with automated margin escrow and white-label client packets.

## Capabilities

### New Capabilities
- `emergency-dispatch-subcontractor-exchange`: Automated skill-matched SMS cascade ladder, tokenized 1-tap emergency gig claiming with surge bonus multipliers, and B2B peer subcontractor liquidity broadcast.

### Modified Capabilities
- `scheduling-dispatch`: Enhanced with emergency shift broadcast and tokenized claim validation.
- `hr-workforce`: Tracks emergency reliability scores and surge bonus compensation.

## Impact

- **DocTypes**:
  - `EE Emergency Callout`: Linked to `Booking` and `Shift`, tracks skill required, surge bonus, broadcast tier, expiration, claimed by worker, claim timestamp.
  - `EE Subcontractor Exchange Posting`: Public or peer-network gig broadcast, agreed payout, required insurance certificate, white-label gig packet.
- **Server APIs**:
  - `entertainment_express.scheduling_dispatch.api.trigger_emergency_cascade(booking_id, role, surge_bonus=0)`
  - `entertainment_express.scheduling_dispatch.api.claim_emergency_shift(token)`
  - `entertainment_express.scheduling_dispatch.api.broadcast_to_subcontractor_network(booking_id, role, payout)`
- **Portal UI**:
  - Owner Route: Emergency broadcast drawer on `/owner/dispatch` with real-time claim ticker.
  - Mobile Worker Route: Clean, high-contrast mobile claim page at `/claim/:token`.
