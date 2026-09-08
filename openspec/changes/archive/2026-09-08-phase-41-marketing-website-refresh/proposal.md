## Why

The portals (`/owner`, `/employee`, `/client`) are now enterprise-grade, sales-ready surfaces (Phase 40).
But the **public marketing front door** at `www.entx.app` is still a basic server-rendered skeleton with
placeholder copy, no structured data beyond an Organization blob, no vertical-specific landing pages, no
competitor comparison content, and a simple pricing grid that doesn't communicate the value of each tier.

The marketing website is **the #1 acquisition surface**. Every prospective tenant visits it before they trial.
Right now it does not rank for any high-intent search terms ("bounce house rental software", "mobile DJ
booking app", "InflatableOffice alternative"), it does not showcase the premium portal UI, and it does not
explain pricing in a way that converts a skeptical operator who's been burned by clunky legacy tools.

**Why now:** Phase 40 gave us a product worth showing off. This phase makes the front door match the product.

## What Changes

### 1. Portal-Kit Visual Upgrade
- Replace the current `marketing.css` with a stylesheet that imports `portal-kit` design tokens (colors,
  typography scale, elevation, radius, motion) so the marketing site and portals share the same visual DNA.
- Redesign `base.html`, `header.html`, `footer.html`, and `nav.html` to use sticky glass nav, animated hero,
  modern card grids, and responsive footer matching the portal aesthetic.
- Dark/light mode support via `prefers-color-scheme` (no toggle on marketing — follows OS).

### 2. High-Converting Homepage Redesign
- Animated hero with dual CTA ("Start free 14-day trial" / "See it in action"), social proof band, and
  a vertical-chip bar ("Built for DJs • Inflatables • Photo Booths • Game Trucks").
- **Interactive product showcase**: tabbed widget showing live screenshots/animated GIFs of the Owner Today
  dashboard, Dispatch Board, Client Portal Home, and Crew Mobile App — visitors see the product before signup.
- Redesigned feature grid, workflow steps, KPI outcomes, and trust/security band.
- Pricing teaser section sourced from `Plan` records with a "Compare plans" CTA.

### 3. Vertical Solution Pages (`/solutions/<vertical>`)
- Expand the existing `solutions.py` vertical pages into full SEO-optimized landing pages with:
  - Vertical-specific headline, pain points, and feature highlights.
  - Per-vertical hero copy and meta descriptions targeting search keywords.
  - Tailored feature grids showing only capabilities relevant to that vertical.
  - CTA directly into trial signup with the vertical pre-tagged for analytics attribution.
- Routes: `/solutions/djs`, `/solutions/rentals`, `/solutions/photo-booths`, `/solutions/game-trucks`,
  `/solutions/casino`, `/solutions/performers`.

### 4. Competitor Comparison Pages (`/compare/<competitor>`)
- New page type: structured "Alternative to X" comparison pages targeting the highest-intent money keywords.
- Initial pages: `/compare/inflatable-office`, `/compare/goodshuffle-pro`, `/compare/dj-event-planner`,
  `/compare/honeybook`, `/compare/event-rental-systems`.
- Each page: headline ("Modern alternative to {X}"), feature comparison table (EE vs competitor), migration
  CTA highlighting 1-click data import presets (Phase 36), and JSON-LD `SoftwareApplication` schema.
- Context builder: `compare.py` with a `COMPETITORS` dict (name, tagline, weaknesses, EE advantages).
  Data is hard-coded in the Python dict — NOT in the database (these are marketing copy, not runtime config).

### 5. Feature Deep-Dive Pages (`/features/<feature>`)
- New page type for SEO-rich feature landing pages targeting operational pain-point keywords.
- Initial pages: `/features/weather-risk`, `/features/dispatch-load-planning`,
  `/features/dj-playlist-export`, `/features/customer-portal`, `/features/white-label-branding`,
  `/features/ai-copilot`.
- Each page: hero with feature name, problem statement, how EE solves it, screenshot/visual, and CTA.
- Context builder: `feature_pages.py` with a `FEATURES` dict.

### 6. Pricing Page Overhaul & Free Starter Tier
- Redesign `/pricing` into a premium 3-tier card layout with monthly/annual toggle, feature comparison
  matrix, FAQ accordion with `FAQPage` JSON-LD schema, and "Start free trial" / "Start free" CTAs.
- Add the **Free Starter tier** to the Plan records:
  - Starter (Free): 1 owner, 1 worker, 3 active bookings, 500 MB, EE badge in portal footer.
  - Pro ($99/mo, $79/mo annual): 1 owner + 5 staff, unlimited bookings, 15 GB, full white-label +
    custom domain, weather risk, Serato export, SMS.
  - Scale ($249/mo, $199/mo annual): unlimited staff, unlimited bookings, 100 GB, AI Copilot, Partner
    Overflow Exchange, concierge migration.
- **Reverse trial model**: new signups start with 14-day Pro trial (no credit card), then auto-drop to
  Starter if they don't upgrade. Existing `start_trial.py` and control-plane `Signup Application` flow
  supports this — we add the Starter plan and update the post-trial downgrade logic.

### 7. SEO Engine & Structured Data
- **JSON-LD schemas** on every page type:
  - Home: `SoftwareApplication` + `Organization` + `WebSite` with `SearchAction`.
  - Pricing: `SoftwareApplication` with `offers` array from Plan records + `FAQPage`.
  - Solutions: `SoftwareApplication` scoped to vertical + `BreadcrumbList`.
  - Compare: `SoftwareApplication` + `BreadcrumbList`.
  - Features: `SoftwareApplication` feature page + `BreadcrumbList`.
  - Blog (existing): `BlogPosting` + `BreadcrumbList`.
- **Enhanced `sitemap.xml`**: auto-include all marketing, solutions, compare, features, and blog pages.
  Exclude drafts, tenant routes, and portal routes.
- **Breadcrumb navigation** on all subpages for Google breadcrumb rich results.
- **Per-page unique title tags** and meta descriptions optimized for target keywords.
- **Canonical URLs** already implemented — verify consistency on new page types.
- **Internal linking strategy**: every page links to related verticals, features, and pricing.

### 8. Interactive Product Showcase Component
- A tabbed UI component on the homepage that cycles through product screenshots with captions:
  - Tab 1: "Owner Dashboard" — Today page with metrics and inbox.
  - Tab 2: "Dispatch Board" — drag-assign crew to events.
  - Tab 3: "Client Portal" — customer sign & pay experience.
  - Tab 4: "Crew Mobile" — field check-in on a phone.
- Built as a vanilla JS component in `marketing.js` with lazy-loaded images.
- Screenshots are static PNGs stored in `public/marketing/img/showcase/`.

### 9. Performance & Core Web Vitals
- Target Lighthouse 95+ on mobile for all marketing pages.
- Preload critical CSS, defer non-essential JS, lazy-load images below fold.
- Add `loading="lazy"` and explicit `width`/`height` on all images to prevent CLS.
- Minify `marketing.css` and `marketing.js` for production.

## Capabilities

### New Capabilities
_(none — all changes extend the existing `marketing-website` capability)_

### Modified Capabilities
- `marketing-website`: New requirements for vertical solution pages, competitor comparison pages, feature
  deep-dive pages, interactive product showcase, enhanced JSON-LD structured data, breadcrumb navigation,
  revised pricing tiers (Starter/Pro/Scale), reverse trial model, and portal-kit visual integration.
- `saas-control-plane`: New requirement for Starter (free) plan with entitlement guardrails (active booking
  limit, worker limit, storage limit, EE badge enforcement), and reverse-trial auto-downgrade to Starter
  after trial expiry instead of suspension.

## Impact

### Templates (Jinja)
- **Modified:** `templates/marketing/base.html`, `header.html`, `footer.html`, `nav.html`, `seo_head.html`,
  `cta.html` — visual upgrade + breadcrumbs + enhanced JSON-LD.
- **Modified:** `www/index.html` — full homepage redesign with interactive showcase.
- **Modified:** `www/pricing.html` — 3-tier card layout, comparison matrix, FAQ accordion.
- **Modified:** `www/features.html` — expand from bullet list into feature hub with links to deep-dives.
- **Modified:** `www/solutions.html` — expand from generic card into full vertical landing page.
- **New:** `www/compare.html` — competitor comparison page template.
- **New:** `www/feature_page.html` — individual feature deep-dive template (distinct from `features.html`
  which is the hub).

### Python (context builders)
- **Modified:** `marketing/site_context.py` — add `apply_breadcrumbs()`, `apply_json_ld_software_app()`,
  `apply_json_ld_faq()` helpers, update `apply_common_page_context()` with breadcrumb support.
- **Modified:** `www/index.py` — add showcase data, enhanced JSON-LD.
- **Modified:** `www/pricing.py` — restructured plan data with feature matrix and FAQ JSON-LD.
- **Modified:** `www/solutions.py` — expand `SOLUTIONS` dict with keywords, pain points, features, hero copy.
- **Modified:** `www/features.py` — convert to feature hub linking to deep-dives.
- **New:** `www/compare.py` — competitor comparison context builder.
- **New:** `www/feature_page.py` — individual feature page context builder.

### Static assets
- **Modified:** `public/marketing/marketing.css` — full redesign importing portal-kit tokens.
- **Modified:** `public/marketing/marketing.js` — add showcase tabs, FAQ accordion, pricing toggle upgrade.
- **New:** `public/marketing/img/showcase/*.png` — product screenshots for interactive showcase.
- **New:** `public/marketing/img/features/*.svg` — feature icons/illustrations.

### Backend (control plane)
- **Modified:** `EE Plan` seed data / fixture — add Starter plan, update Pro/Scale entitlements.
- **Modified:** Subscription post-trial logic — downgrade to Starter instead of suspend.
- **New:** Entitlement enforcement for `active_bookings_limit`, `worker_limit`, `storage_limit_gb`,
  `show_ee_badge` on tenant sites.

### Sitemap
- **Modified:** `www/robots.txt` — verify sitemap URL.
- **Modified:** Sitemap generation — include `/solutions/*`, `/compare/*`, `/features/*` routes.

### No changes to
- Portal SPAs (`/owner`, `/employee`, `/client`) — portal-kit is read-only consumed.
- Tenant business data or isolation model.
- Backend DocTypes (except Plan seed data and entitlement enforcement).
- Deployment manifests (`k8s-deployment.yaml`).
