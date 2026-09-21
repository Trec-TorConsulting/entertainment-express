## Why

High-performing entertainment and event rental operators routinely manage multiple brand identities (DBAs) under a single legal umbrella. For instance, an operator might run "Prestige Wedding DJs" (luxury, black-tie), "Campus Sound & Lighting" (high-energy college formals), and "Jump City Inflatables" (family festivals). Today, operators are forced to either buy multiple software licenses—fragmenting their inventory, crew dispatch, and finances—or compromise their marketing by forcing luxury wedding couples into generic party rental portals.

## What Changes

- Introduce a first-class **Multi-Brand Entity Model** in Frappe where a single tenant site can manage multiple distinct customer-facing brands (DBAs).
- Provide **Brand-Scoped Storefronts & Client Portals**: each brand gets its own logo, typography, color palette, custom domain or subdomain, terms of service, and public storefront.
- Implement **Brand-Scoped Outbound Communications**: transactional emails, contracts, and SMS messages automatically dynamically populate the specific brand's From Address, From Name, email header/footer, and Twilio sender phone number.
- Implement **Brand-Specific Payment Descriptors**: Stripe Connect transactions use brand-specific dynamic statement descriptors (e.g. `PRESTIGE WEDDINGS` vs. `JUMP CITY RENTALS`) to eliminate client billing confusion and dispute chargebacks.
- Maintain a **Unified Back-Office Cockpit**: dispatch, warehouse gear, crew timesheets, and overall corporate financials remain centralized in the Owner Portal (`/owner`), with instant 1-click brand filtering.

## Capabilities

### New Capabilities
- `multi-brand-umbrella-operations`: Architecture supporting multiple distinct customer-facing brand personas, domains, themes, comms, and statement descriptors on a unified back-office ERP tenant.

### Modified Capabilities
- `notifications`: Communications dispatch routes through brand-scoped sender accounts and templates.
- `customer-portal`: Client portal dynamically adopts the visual theme of the booking's assigned brand.
- `billing-payments`: Charges pass brand-specific statement descriptors to Stripe.

## Impact

- **DocTypes**:
  - `EE Brand`: Brand title, code, DBA legal name, custom domain, primary color, secondary color, logo, favicon, support email, support phone, twilio_phone_number, stripe_statement_descriptor, default_cost_center.
- **Server APIs**:
  - `entertainment_express.multi_brand.api.get_brand_config(brand_id_or_domain)`
  - `entertainment_express.multi_brand.api.set_active_owner_brand(brand_id)`
  - `entertainment_express.notifications.api.send_brand_templated_message(booking_id, template_name)`
- **Portal UI**:
  - Global brand switcher dropdown in Owner Portal navigation bar (`All Brands`, `Prestige Weddings`, `Jump City`).
  - Client portal automatically resolves brand theme from booking context.
