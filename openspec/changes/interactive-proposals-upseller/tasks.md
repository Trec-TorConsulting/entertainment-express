## 1. DocType & Schema Implementation

- [x] 1.1 Create `EE Interactive Proposal` DocType with token index, status workflow, and view metrics.
- [x] 1.2 Create child table `EE Proposal Package Option` for multi-tier package selection.
- [x] 1.3 Create child table `EE Proposal Addon Option` for upsell catalog items.

## 2. Server-Side APIs & Security Validation

- [x] 2.1 Implement `get_public_proposal` API with guest token lookup and view counter increment.
- [x] 2.2 Implement `record_proposal_view` telemetry hook to track engagement and section dwell times.
- [x] 2.3 Implement `accept_proposal` server endpoint with authoritative price recalculation from ERPNext `Item Price`.
- [x] 2.4 Add automated conversion pipeline: automatically update `Quotation` to Ordered, create `Sales Order` and `Booking`.
- [x] 2.5 Add multi-tenant isolation unit tests confirming tokens cannot be resolved on mismatched tenant hosts.

## 3. Client Portal UI & E-Signature Pad

- [x] 3.1 Build `InteractiveProposal.tsx` in `/client/proposals/:id` and `/proposal/:token`.
- [x] 3.2 Build `TierSelectorGrid.tsx` with responsive cards, badge chips, and feature comparison list.
- [x] 3.3 Build `AddonUpsellCarousel.tsx` with visual toggles and dynamic live price recalculation.
- [x] 3.4 Implement HTML5 Canvas / SVG `EsignModal.tsx` capturing signature and device audit metadata.
- [x] 3.5 Embed Stripe Elements / payment checkout directly into proposal completion step.

## 4. Owner Telemetry & Notification Alerts

- [x] 4.1 Build `/owner/pipeline/proposals` drawer displaying client view history, time on page, and conversion status.
- [x] 4.2 Send automated notification (SMS/Email) to owner when client opens proposal for the first time.

## 5. Verification & Tests

- [x] 5.1 Write unit tests `test_interactive_proposal.py` verifying tier pricing math, add-on additions, and tamper-resistance.
