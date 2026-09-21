## Context

In standard ERP systems, a Quote is an internal administrative document. In the entertainment and luxury event industry, the proposal is the primary sales collateral. Couples, corporate event planners, and festival coordinators expect a modern, beautifully designed presentation that inspires excitement while making it effortless to upgrade their package.

## Goals / Non-Goals

**Goals:**
- Provide a tokenized public URL allowing clients to review without requiring login password credentials.
- Allow real-time selection between up to 3 package tiers with immediate subtotal, tax, and deposit recalculation.
- Present optional upsell cards with rich photography/video previews and 1-click inclusion toggles.
- Capture legal digital signatures (HTML5 Canvas + SVG + cryptographic SHA256 hash of agreed terms).
- Trigger automatic conversion: upon signature + deposit payment, transition Quote to Confirmed Booking, reserve inventory, and issue invoice receipt.

**Non-Goals:**
- In-browser PDF generation from scratch (use headless Chrome server-side print or existing Frappe PDF renderer).
- Dynamic AI negotiation chatbot (interactive selection is deterministic).

## Architecture & DocType Definitions

### 1. `EE Interactive Proposal`
- **Fields:**
  - `quotation`: Link to `Quotation` (required)
  - `booking`: Link to `Booking` (optional until accepted)
  - `token`: Data (cryptographically secure URL token, unique index)
  - `status`: Select (`Draft`, `Sent`, `Viewed`, `Accepted`, `Expired`, `Superseded`)
  - `allow_tier_switching`: Check (default 1)
  - `available_packages`: Table (`EE Proposal Package Option`)
  - `selected_package`: Link to `Item`
  - `available_addons`: Table (`EE Proposal Addon Option`)
  - `selected_addons`: Long Text (JSON list of selected item codes)
  - `view_count`: Int (default 0)
  - `first_viewed_at`: Datetime
  - `last_viewed_at`: Datetime
  - `signature_data`: Long Text (base64 PNG)
  - `signer_name`: Data
  - `signer_ip`: Data
  - `signed_at`: Datetime

### 2. `EE Proposal Package Option` (Child Table)
- **Fields:**
  - `item_code`: Link to `Item`
  - `package_title`: Data
  - `highlight_badge`: Data (e.g. "Most Popular", "Best Value")
  - `base_price`: Currency
  - `description`: Text
  - `feature_list`: Small Text (bullet points)
  - `included_assets`: Small Text

### 3. `EE Proposal Addon Option` (Child Table)
- **Fields:**
  - `item_code`: Link to `Item`
  - `addon_title`: Data
  - `price`: Currency
  - `thumbnail`: Attach Image
  - `short_description`: Small Text
  - `is_recommended`: Check (0 or 1)

## Server APIs & Python Hooks

File: `entertainment_express/crm/api.py`

```python
import frappe
import secrets
from frappe.utils import now_datetime

@frappe.whitelist(allow_guest=True)
def get_public_proposal(token):
    """Fetches proposal presentation data, packages, add-ons, and terms."""
    pass

@frappe.whitelist(allow_guest=True)
def record_proposal_view(token, duration_seconds=0):
    """Telemetry hook logging view timestamp and page dwell time."""
    pass

@frappe.whitelist(allow_guest=True)
def accept_proposal(token, selected_package, selected_addons_json, signer_name, signature_svg):
    """Records e-signature, locks selections, and returns deposit payment intent client_secret."""
    pass
```

## Frontend Portal Architecture

- **Path:** `apps/portal-kit/src/pages/client/proposals/InteractiveProposal.tsx`
- **Subcomponents:**
  - `HeroCover`: Event banner, client greeting, countdown to event date.
  - `TierSelectorGrid`: 3-card responsive grid with feature comparisons and active selection radio.
  - `AddonUpsellCarousel`: Grid of add-ons with high-res thumbnails, price tags, and "Add to Event" toggle switches.
  - `LivePriceSummarySticky`: Sticky bottom or sidebar card displaying subtotal, taxes, required deposit, and "Proceed to Sign & Pay" CTA.
  - `EsignModal`: Legal terms viewer, canvas signature pad, and "I Agree & Sign" confirmation.
  - `EmbeddedPaymentForm`: Stripe Elements / Square Web SDK checkout.

## Multi-Tenant Isolation & Security

- Public tokens are 256-bit secure hex strings generated via Python `secrets.token_urlsafe(32)`.
- Token lookup validates against `tabEE Interactive Proposal` strictly within the tenant site database matching the HTTP host.

## Risks & Mitigations

- **Risk:** Client modifies client-side JavaScript to submit invalid prices or negative add-on values.
- **Mitigation:** Server-side price recalculation: `accept_proposal` completely re-evaluates the catalog prices of selected items from ERPNext `Item Price` records and ignores any client-sent price values.
