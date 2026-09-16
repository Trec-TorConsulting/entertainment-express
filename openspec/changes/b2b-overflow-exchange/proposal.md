## Why

Every entertainment and event rental operator confronts painful capacity bottlenecks during peak season:
1. **Lost Revenue on Overbooked Dates**: High-value client inquiries (weddings, corporate celebrations) are turned away because all company rigs or lead DJs are booked.
2. **Missing Mission-Critical Gear**: A booking requires a specific asset (e.g., 50k-lumen laser, 40-foot obstacle course, white LED dance floor) that the operator does not own, risking the entire contract.

Meanwhile, neighboring operators on Entertainment Express have idle gear and available talent on those exact dates. However, operators hesitate to farm out work due to fear of client poaching, uninsured liability risks, and messy manual billing.

The **B2B Overflow & Sub-Rental Gear Exchange** creates a secure, trusted cross-tenant liquidity network mediated strictly through the EE Control Plane. Operators can broadcast overflow gigs or sub-rental requests to verified local network peers with automated margin escrow, automated COI/insurance verification, and white-labeled client packet generation, all while rigorously enforcing tenant data isolation.

## What Changes

- **Control Plane Liquidity Broker API**: A central, cross-tenant clearinghouse hosted on the EE Control Plane (`admin.{base_domain}`) that mediates gig offers and equipment requests without exposing tenant database records directly across sites.
- **Automated Margin Escrow & Settlement**: Operator defines an offered payout (e.g. $1,200 on a $1,800 booking); upon fulfillment, the control plane orchestrates invoice split and payout, retaining agreed broker fees.
- **Automated Partner COI & Insurance Verification**: Peer operators cannot accept an overflow job or high-value sub-rental without an active, verified Certificate of Insurance (COI) matching the minimum liability coverage (e.g. $1M/$2M).
- **White-Label Gig Packet Generation**: The originating operator's branding, logos, client contact rules, and dress codes are packaged into a tokenized, white-labeled dispatch run sheet for the fulfilling partner.
- **Non-Solicitation & Anti-Poaching Guardrails**: Built-in platform non-solicitation agreement binding network participants, with client contact details masked until 24 hours prior to call time.
- **Exchange Hub in `/owner`**: Dedicated UI at `/owner/exchange` displaying available local overflow gigs, gear requests, and outbound listings.

## Capabilities

### New Capabilities
- `b2b-overflow-exchange`: Control-plane mediated cross-tenant gig exchange, equipment sub-rental marketplace, automated margin escrow, and partner COI enforcement.

### Modified Capabilities
- `vendor-network`: Extend vendor management to link with verified peer tenant operators.
- `insurance-compliance`: Enforce automated COI validity checks on fulfilling network partners.
- `owner-portal`: Add `/owner/exchange` tab for listing and accepting network jobs.

## Impact

- **Backend Architecture & Multitenancy (Sacred Rule #1)**:
  - Originating tenant site communicates ONLY with Control Plane API via secure HMAC-signed webhook/REST calls.
  - No direct cross-site DB access between tenant MariaDB databases.
  - `entertainment_express/exchange/client.py`: Tenant-side client communicating with the central exchange.
  - `entertainment_express/exchange/escrow.py`: Escrow tracking and settlement logic.
- **DocTypes**:
  - New `EE Exchange Listing`: Records local listing type (`overflow_gig`, `gear_request`), budget, date, requirements, status.
  - New `EE Exchange Transaction`: Tracks accepted peer, escrow state, completion sign-off, and payout.
- **Control Plane**:
  - Central broker service matching requests by geohash, equipment classification, and operator rating.
