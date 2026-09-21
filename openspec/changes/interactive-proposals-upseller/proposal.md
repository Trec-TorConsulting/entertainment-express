## Why

Static PDF estimates and rigid single-price invoices suffer from poor conversion rates and leave substantial revenue on the table. Platforms like Goodshuffle Pro and HoneyBook have demonstrated that clients want interactive, visually compelling proposal experiences where they can compare package tiers (e.g. Silver vs. Gold vs. Platinum), preview high-resolution media of lighting and effects, toggle optional add-ons in real time, and immediately sign the contract and pay the deposit in one continuous, friction-free flow.

## What Changes

- Introduce a **Dynamic Interactive Proposal Engine** accessible via `/client/proposals/:id` and a public tokenized URL `/proposal/:token` for friction-free client access.
- Support **Tiered Package Switching** allowing clients to toggle between predefined packages with live recalculated itemized breakdowns and deposit schedules.
- Add an **Interactive Add-On Upseller** showcasing optional high-margin items (cold spark fountains, dance floor lighting, audio guestbooks, extra hours) with real-time price updates.
- Embed native **Digital Signature Capture** with legal e-sign audit logging (IP address, timestamp, device fingerprint).
- Integrate **Immediate Deposit Payment** via Stripe Elements, Square, or ACH directly on the same proposal screen.
- Provide an **Owner Proposal Analytics Dashboard** showing view counts, open timestamps, time spent per section, and conversion status.

## Capabilities

### New Capabilities
- `interactive-proposals-upseller`: Dynamic, client-interactive proposal interface with package tier switching, live add-on toggling, in-page e-signature, embedded deposit payment, and owner view telemetry.

### Modified Capabilities
- `crm`: Quotation and Opportunity models extended with proposal tokenization and view tracking.
- `customer-portal`: Proposal view refactored to interactive Portal-Kit component.

## Impact

- **DocTypes**:
  - `EE Interactive Proposal`: Links to `Quotation`, stores public token, proposal status (`Draft`, `Sent`, `Viewed`, `Accepted`, `Declined`), allowed tiers, add-ons JSON, view telemetry.
  - `EE Proposal Section`: Rich text narrative blocks, mood boards, image carousels, testimonials.
- **Server APIs**:
  - `entertainment_express.crm.api.get_public_proposal(token)`
  - `entertainment_express.crm.api.record_proposal_view(token, duration_seconds)`
  - `entertainment_express.crm.api.accept_proposal_and_sign(token, selected_package, selected_addons, signature_data)`
  - `entertainment_express.crm.api.create_proposal_deposit_intent(token)`
- **Portal UI**:
  - New Route: `/client/proposals/:id` and `/proposal/:token` (Public responsive customer proposal experience).
  - Owner Route: `/owner/pipeline/proposals` (Telemetry drawer with view timestamps and section dwell times).
