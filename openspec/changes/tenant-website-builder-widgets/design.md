## Context

Mobile entertainment and event rental companies depend on their web storefront to generate 80%+ of their inbound leads and bookings. Right now, operators either pay high monthly fees to specialized website builders (InflatableOffice, BCN) or suffer broken sync between WordPress and their back office. By providing a block-based website builder and embeddable widgets, Entertainment Express becomes the complete front-door and back-office solution.

## Goals / Non-Goals

**Goals:**
- Enable non-technical owners to visually customize and publish pages at `/p/<slug>` without writing code.
- Support 7 standard block types: `hero`, `catalog_grid`, `availability_bar`, `reviews`, `packages`, `contact_form`, `faq_accordion`.
- Provide a drop-in embed script `<script src="https://{tenant}.app.entx.app/assets/entx-widgets.js"></script>` that parses `[data-entx-widget]` attributes.
- Ensure strict origin checking (`Origin` / `Referer` HTTP headers verified against `EE Embed Key.whitelisted_domains`).

**Non-Goals:**
- Building a full general-purpose blog or CMS engine (focus is on high-converting event landing pages and booking funnels).
- Custom CSS compiler (styling is controlled via predefined Portal-Kit theme tokens and brand kit).

## Architecture & DocType Definitions

### 1. `EE Tenant Page`
- **Fields:**
  - `title`: Data
  - `slug`: Data (unique per tenant, e.g. `weddings`, `photo-booths`)
  - `is_published`: Check (default 1)
  - `is_homepage`: Check (default 0)
  - `seo_title`: Data
  - `seo_description`: Small Text
  - `seo_image`: Attach Image
  - `blocks`: JSON (structured array of block configurations)
  - `custom_head_html`: Code (optional scripts/pixels)

### 2. `EE Embed Key`
- **Fields:**
  - `key_name`: Data (e.g. "Main Squarespace Site")
  - `api_key`: Data (generated UUID / prefix `pk_live_`)
  - `whitelisted_domains`: Small Text (newline-separated domains, e.g. `*.mypartyrentals.com`)
  - `enabled_widgets`: MultiCheck (`availability`, `catalog`, `booking`, `wishlist`)
  - `rate_limit_per_minute`: Int (default 120)
  - `is_active`: Check (default 1)

## Server APIs & Python Hooks

File: `entertainment_express/tenant_website/api.py`

```python
import frappe
from urllib.parse import urlparse

def validate_embed_origin(embed_key):
    """Verifies Origin / Referer against EE Embed Key whitelisted domains."""
    pass

@frappe.whitelist(allow_guest=True)
def get_public_page(slug="home"):
    """Returns page metadata and blocks JSON for public SSR/SPA rendering."""
    pass

@frappe.whitelist()
def save_page_blocks(slug, title, blocks_json, seo_meta=None):
    """Saves updated block structure from Owner Portal Visual Builder."""
    pass

@frappe.whitelist(allow_guest=True)
def widget_availability_query(api_key, date, category=None):
    """Public rate-limited endpoint for the embeddable availability widget."""
    pass

@frappe.whitelist(allow_guest=True)
def widget_submit_inquiry(api_key, payload_json):
    """Submits inquiry or wishlist from embeddable widget into CRM Opportunity."""
    pass
```

## Frontend Portal Architecture

- **Path:** `apps/portal-kit/src/pages/owner/website/WebsiteBuilder.tsx`
- **Subcomponents:**
  - `BlockPalette`: Sidebar containing draggable blocks (`HeroBlock`, `CatalogGridBlock`, `ReviewsBlock`, `PricingBlock`).
  - `PageCanvas`: Live interactive preview of the page with responsive viewport toggle (Desktop, Tablet, Mobile).
  - `BlockPropertyInspector`: Contextual editor for adjusting block text, background colors, images, and CTA links.
  - `EmbedCodeGeneratorModal`: Generates one-click copyable HTML snippets for external platforms (Squarespace, Wix, WordPress, Shopify).

## Multi-Tenant Isolation & Security

- Public page queries (`/p/<route>`) and widget APIs resolve tenant identity exclusively from the Host header or explicit authenticated tenant session.
- Embed keys are strictly scoped to the site database where they were created; no cross-tenant verification can succeed.

## Risks & Mitigations

- **Risk:** Malicious embedding of booking widgets on third-party attack sites to spam fake inquiries.
- **Mitigation:** Strict CORS headers, Referer/Origin validation against `whitelisted_domains`, IP rate limiting (120 req/min), and optional Cloudflare Turnstile captcha integration.
