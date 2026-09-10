## Why

When new tenants register and navigate to their public domain (`https://<tenant>.entx.app/`), they are presented with a stark, minimal placeholder that lacks photos, service details, branding depth, and clear conversion paths. Furthermore, owners lack a visual, user-friendly Website Builder in the Owner Portal to customize their public storefront, landing sections, and marketing pages. 

This change delivers an attractive, modern, responsive default landing page template based on tenant company info (complete with onboarding guidance for owners), paired with a visual Website Builder in the Owner Portal matching the "Today" page aesthetic.

## What Changes

- **Rich Default Tenant Landing Page**: Upgrade `tenant_home.html` from a barebones hero to a modern, responsive entertainment company homepage that displays branded hero messaging, service highlights, packages showcase, trust badges, customer review callouts, and booking CTAs.
- **Owner Quick-Start Banner**: When an authenticated owner views their public tenant site, display a subtle, dismissible onboarding guide banner explaining how to customize their website sections using the Owner Portal Website Builder.
- **Owner Portal Website Builder (`/owner/website`)**: Modernize the Website workspace in the Owner Portal into a dedicated visual builder matching the "Today" design system, allowing owners to configure:
  - Hero headline, subhead, primary CTA, and background accent/image.
  - Featured packages and service categories display.
  - Value propositions and trust badges (e.g. insured, 5-star rated, licensed).
  - Social links, contact info, and business hours.
  - Custom pages (`/p/about`, `/p/faq`, etc.) and embed widget snippets.
- **Backend Website API & Configuration**: Add site-scoped endpoints to retrieve and save tenant website layout and section configs securely with strict multi-tenant isolation.

## Capabilities

### Modified Capabilities
- `tenant-website`: Extends tenant website requirements to mandate a rich, structured default landing page template, customizable hero/sections, and authenticated owner quick-start hints.
- `owner-portal`: Adds the visual Website Builder workspace under Settings (`/owner/website`) with full style parity to the flagship "Today" page.

## Impact

- **Templates & Backend**: `entertainment_express/www/tenant_home.html`, `entertainment_express/www/tenant_home.py`, `entertainment_express/api/portal_website.py`, `entertainment_express/entertainment_express_core/doctype/ee_portal_settings/`.
- **Frontend**: New `frontend/owner-portal/src/app/routes/website/WebsitePage.tsx`, updated routing in `App.tsx`, and shared components from `@portal-kit`.
- **Isolation & Testing**: All website builder configurations remain strictly site-scoped in MariaDB. Automated tests in `smoke_test.py` and `test_phase19_marketing_static.py`.
