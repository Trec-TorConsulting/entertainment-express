## Why

Phase 38 white-labels portals and custom domains, but public book/home pages, footers, and other tenant surfaces still leak “Entertainment Express.” Buyers treat full-site white-label as table stakes; they also abandon setup when matching an existing website brand means hand-picking hex codes. This phase makes the **entire tenant site** company-branded and adds a **style matcher** so owners can import look-and-feel from their current website or logo in minutes.

## What Changes

- **Full-site white-label mode** on the tenant site: `/book`, `/catalog`, tenant home, login, sign, appointments, public forms, portal footers, and client-facing emails/PDFs use company identity and hide EE product marks when enabled (Desk/`/app` for SaaS Operator unchanged; EE SaaS marketing `www` unchanged).
- Extended brand kit: primary + secondary colors, accent, background, text, heading/body font choices (safe web fonts or uploaded font files), logo variants (light/dark), favicon, social share image, footer/copyright text.
- **Brand style matcher** in `/owner`: paste company website URL and/or upload logo → suggest colors, fonts, and logo candidates → preview → one-click apply to white-label settings.
- Live preview panel for public home + portal chrome before publish.
- Non-goals: rewriting the EE SaaS marketing site; hosting WordPress; scraping authenticated sites; AI-generated logos; changing site-per-tenant isolation.

## Capabilities

### New Capabilities

- `brand-style-matcher`: Import brand look-and-feel from a public company URL and/or logo upload into white-label settings with preview and apply.

### Modified Capabilities

- `white-label`: Expand from portals-only to full tenant-site surfaces + richer brand kit tokens.
- `owner-portal`: Brand workspace gains style matcher, preview, and full kit editors.
- `booking-availability`: Public book/catalog/tenant home fully white-labeled.
- `customer-portal` / `employee-portal`: Align remaining chrome/footers with full white-label mode.
- `ui-design-system`: Tenant CSS variables for secondary/accent/bg/text/fonts; product-chrome suppression site-wide on tenant hosts.
- `notifications`: Email HTML chrome (from-name + header/footer) uses full white-label kit.
- `tenant-website`: Tenant CMS/public pages inherit the same kit when present.
- `marketing-website`: Clarify tenant public pages use white-label kit; EE `www` product site excluded.
- `multi-brand`: Brand kit can override company white-label on brand hosts; matcher seeds company default brand.

## Impact

- App: extend `EE Portal Settings`, `www/branding.py` + public page contexts, portal templates, notification wrappers, owner Brand UI, new `api/brand_style.py` matcher, tests `test_phase39_full_site_white_label.py`.
- Isolation: matcher fetches only owner-supplied public URLs; no cross-tenant; rate-limit fetch; never store scraped HTML long-term beyond derived kit.
- Depends on: phase-38 white-label + custom domains.
