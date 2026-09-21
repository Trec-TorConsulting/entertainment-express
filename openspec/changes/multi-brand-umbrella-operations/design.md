## Context

In Frappe, multi-tenancy is structured at the site bench level (one site per paying company). However, an entertainment entrepreneur often owns 2 to 4 distinct market-facing entities. Rather than spinning up 4 Frappe sites that cannot share inventory, crew, or bank accounts, Entertainment Express provides multi-branding inside a single tenant site database.

## Goals / Non-Goals

**Goals:**
- Provide `EE Brand` DocType with full styling and communication credentials.
- Add `brand` Link field to `Booking`, `Quotation`, `Opportunity`, and `Sales Invoice`.
- Client Portal (`/client/*`) extracts brand configuration and injects brand CSS variables (`--brand-primary`, `--brand-secondary`, custom fonts, logos) dynamically.
- Email sender addresses dynamically configure SMTP `From:` header to match the brand.
- SMS dispatch selects Twilio phone number corresponding to the brand.
- Provide ERPNext Cost Center mapping per brand for segregated P&L reports.

**Non-Goals:**
- Cross-tenant multi-company consolidation (parent-subsidiary rollup across separate Frappe sites).
- Separate employee logins per brand (field crew work across all brands owned by the company).

## Architecture & DocType Definitions

### 1. `EE Brand`
- **Fields:**
  - `brand_name`: Data (required, e.g. "Prestige Wedding DJs")
  - `brand_code`: Data (unique slug, e.g. `prestige`)
  - `custom_domain`: Data (e.g. `weddings.mypartyco.com`)
  - `logo`: Attach Image
  - `favicon`: Attach Image
  - `primary_color`: Color (default `#0f172a`)
  - `accent_color`: Color (default `#6366f1`)
  - `font_family`: Select (`Inter`, `Playfair Display`, `Montserrat`, `Cinzel`, `Outfit`)
  - `support_email`: Data
  - `support_phone`: Data
  - `twilio_sender_number`: Data
  - `stripe_statement_descriptor`: Data (max 22 chars)
  - `cost_center`: Link to `Cost Center`
  - `contract_footer_text`: Small Text

## Server APIs & Python Hooks

File: `entertainment_express/multi_brand/api.py`

```python
import frappe

@frappe.whitelist(allow_guest=True)
def get_brand_theme_by_host(host_domain=None):
    """Resolves EE Brand matching HTTP host domain or returns tenant default brand."""
    pass

@frappe.whitelist()
def get_booking_brand_context(booking_id):
    """Returns brand logo, colors, and legal details for client portal injection."""
    pass

def apply_brand_notification_headers(doc, method):
    """
    Hook on Communication creation: overrides sender email, sender name,
    and Twilio phone number based on doc.brand.
    """
    pass
```

## Frontend Portal Architecture

- **Path:** `apps/portal-kit/src/providers/BrandThemeProvider.tsx`
- **Components:**
  - `BrandThemeProvider`: Injects CSS variables `--brand-primary`, `--brand-accent`, `--brand-logo` into the DOM root.
  - `BrandSwitcher`: Dropdown in Owner Portal header storing active brand filter in Zustand state / LocalStorage.
  - `BrandSettingsView`: Settings screen at `/owner/settings/brands` for managing logos, domains, and messaging numbers.

## Multi-Tenant Isolation & Security

- Brands are strictly scoped to the tenant's MariaDB database.
- Public custom domain routing in Traefik Gateway maps the host to the specific Frappe bench site, where internal brand resolution takes over.

## Risks & Mitigations

- **Risk:** Email deliverability issues (SPF/DKIM/DMARC) when sending emails from different brand domains.
- **Mitigation:** Guide owners in `/owner/settings/brands` to configure SendGrid / Postmark verified sending domains or DNS CNAME records.
