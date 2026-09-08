# Phase 41 — Marketing Website Refresh

> **Sub-phases:** 41a (design system + foundation) → 41b (pages + SEO) → 41c (pricing + plans + trial).
> Complete each sub-phase before starting the next.

> Maps to requirements in `marketing-website` and `saas-control-plane` delta specs.

## 41a — Design system foundation & base templates

## 1. Portal-Kit Token Mirror

- [x] 1.1 Create `entertainment_express/entertainment_express/public/marketing/marketing-tokens.css` by
      extracting ALL `--ee-*` CSS custom properties from `frontend/portal-kit/src/tokens.css` (colors,
      typography scale, spacing, radius, elevation/shadow, motion durations, z-index, dark-mode overrides).
      Format as `:root { ... }` and `@media (prefers-color-scheme: dark) { :root { ... } }`.
      **Accept:** Every `--ee-*` variable in `tokens.css` has a matching declaration in `marketing-tokens.css`.

- [x] 1.2 Update `entertainment_express/entertainment_express/public/marketing/marketing.css` to add
      `@import url("marketing-tokens.css");` as the very first line. Replace all hard-coded color hex values,
      font stacks, border-radius values, and box-shadow values with their `--ee-*` token equivalents. Add
      dark-mode support via `@media (prefers-color-scheme: dark)` that uses the dark token overrides from
      `marketing-tokens.css`.
      **Accept:** `grep -c '#[0-9a-fA-F]' marketing.css` returns 0 (no remaining hard-coded hex values
      except in SVG data URIs). Dark mode renders correctly.

- [x] 1.3 Document the token sync process by adding a "Marketing Token Sync" section to
      `FRONTEND_DEPLOYMENT.md` explaining: (1) `marketing-tokens.css` mirrors `tokens.css`, (2) when
      portal-kit tokens change, re-extract to marketing-tokens.css, (3) screenshot recapture checklist.
      **Accept:** Section exists in `FRONTEND_DEPLOYMENT.md`.

## 2. Base Template Visual Upgrade

- [x] 2.1 Redesign `entertainment_express/entertainment_express/templates/marketing/header.html`: sticky
      header with `backdrop-filter: blur(12px)` glass effect, EE logo (linked to `/`), navigation links
      (Solutions, Features, Compare, Pricing, Blog), "Log In" secondary link, "Start Free Trial" primary
      CTA button. Mobile: hamburger menu (toggle via JS) with slide-down nav panel.
      **Accept:** Header sticks on scroll with glass blur. Mobile hamburger works at 375px.

- [x] 2.2 Redesign `entertainment_express/entertainment_express/templates/marketing/nav.html`: add dropdown
      mega-nav for "Solutions" (list of 6 verticals with icons), "Features" (6 feature categories), and
      "Compare" (5 competitors). Dropdown opens on hover (desktop) and tap (mobile). Each dropdown item links
      to its page.
      **Accept:** Hovering "Solutions" shows a dropdown with 6 vertical links.

- [x] 2.3 Redesign `entertainment_express/entertainment_express/templates/marketing/footer.html`:
      multi-column layout with sections: Product (links: Features, Pricing, Compare, Demo), Solutions (6
      vertical links), Company (About, Contact, Blog, Legal), Connect (social icon links from
      `social_links` context). Bottom row: copyright + "Powered by Entertainment Express" text.
      Newsletter signup inline form (email input + submit). Dark background with light text using tokens.
      **Accept:** Footer renders 4 columns on desktop, stacks on mobile. Social links render from context.

- [x] 2.4 Redesign `entertainment_express/entertainment_express/templates/marketing/cta.html`: primary
      button with gradient background using `--ee-brand` → `--ee-brand-2`, hover elevation transition,
      and secondary ghost button. Both pull label/target from `primary_cta_label`/`secondary_cta_label`
      context vars.
      **Accept:** CTA renders two styled buttons with hover transitions.

- [x] 2.5 Create `entertainment_express/entertainment_express/templates/marketing/breadcrumb.html`: semantic
      `<nav aria-label="Breadcrumb">` with `<ol>` of links. Reads `breadcrumbs` from context (list of
      `{label, url}` dicts). Last item is `aria-current="page"` and not linked.
      **Accept:** Breadcrumb renders with correct aria attributes and JSON-LD matches.

- [x] 2.6 Update `entertainment_express/entertainment_express/templates/marketing/base.html`: add
      `{% include "breadcrumb.html" %}` after header (inside `<main>`), update `marketing.css` version
      query string to `v=41.0`, add `<link rel="preconnect" href="https://fonts.googleapis.com">` and
      load Inter font from Google Fonts.
      **Accept:** Base template includes breadcrumb, Inter font loads, CSS cache-busts.

**41a Definition of done:** All marketing pages render with portal-kit tokens, sticky glass nav, redesigned
footer, breadcrumbs, and dark mode support. No hard-coded hex colors remain in `marketing.css`.

## 41b — Pages, SEO engine & showcase

## 3. SEO Engine & Structured Data

- [x] 3.1 Add helper functions to `entertainment_express/entertainment_express/marketing/site_context.py`:
      - `build_breadcrumbs(items: list[dict]) -> str`: returns JSON-LD string for `BreadcrumbList`.
      - `build_software_app_jsonld(name, description, url, category, offers=None) -> str`: returns JSON-LD
        for `SoftwareApplication` with optional `offers` array.
      - `build_faq_jsonld(questions: list[dict]) -> str`: returns JSON-LD for `FAQPage` from
        `[{question, answer}, ...]`.
      - `build_website_jsonld(name, url, search_url) -> str`: returns JSON-LD for `WebSite` with
        `SearchAction`.
      - `get_sitemap_routes() -> list[str]`: returns all marketing routes including dict-driven pages.
      - Update `apply_common_page_context()` to accept optional `breadcrumbs` list and set
        `context.breadcrumbs` and `context.breadcrumb_json_ld`.
      **Accept:** All functions return valid JSON-LD strings. `get_sitemap_routes()` includes solution,
      compare, and feature routes.

- [x] 3.2 Update `entertainment_express/entertainment_express/templates/marketing/seo_head.html`:
      add `{% if breadcrumb_json_ld %}` block that emits a third `<script type="application/ld+json">`.
      Add `{% if website_json_ld %}` block for WebSite schema. Keep existing `organization_json_ld` and
      `page_json_ld`.
      **Accept:** Template can render up to 4 JSON-LD blocks.

- [x] 3.3 Add marketing routes to the sitemap. In
      `entertainment_express/entertainment_express/hooks.py`, add entries to `website_route_rules` (or
      equivalent Frappe sitemap hook) so `/solutions/*`, `/compare/*`, and `/features/*` appear in
      `sitemap.xml`. Verify `www/robots.txt` references the correct sitemap URL.
      **Accept:** Fetching `/sitemap.xml` includes `/solutions/djs`, `/compare/inflatable-office`, and
      `/features/weather-risk` entries.

## 4. Homepage Redesign

- [x] 4.1 Redesign `entertainment_express/entertainment_express/www/index.html`:
      - **Hero section:** Animated gradient background, `<h1>` with configurable headline, subtitle,
        vertical-chip bar ("Built for DJs • Inflatables • Photo Booths • Game Trucks • Casino • Performers"),
        dual CTA buttons, "No credit card required" trust line.
      - **Product showcase section:** `<div id="ee-showcase">` with tab buttons and image panels (see 4.3).
      - **Feature grid:** 6 feature cards with SVG icons, heading, and description. Cards: Booking &
        Availability, Dispatch & Run Sheets, Billing & Payments, Customer Portal, Weather Risk, AI Copilot.
      - **Workflow steps:** Capture → Book → Run → Grow with numbered steps and descriptions.
      - **KPI outcomes:** 3 metric cards: "3x faster booking responses", "Zero dispatch misses",
        "100% revenue visibility".
      - **Pricing teaser:** 3-card preview from `Plan` records with "Compare all plans" CTA.
      - **Trust band:** "Enterprise-grade controls" with security, privacy, uptime callouts.
      - **Final CTA:** Full-width section with "Ready to modernize your business?" + dual CTA.
      **Accept:** Homepage has all 8 sections. Hero renders the configurable headline. All sections use
      token-based styling. Mobile layout works at 375px.

- [x] 4.2 Update `entertainment_express/entertainment_express/www/index.py`: add `SoftwareApplication`
      JSON-LD (name="Entertainment Express", applicationCategory="BusinessApplication",
      operatingSystem="Web"), `WebSite` JSON-LD with `SearchAction` (target: `/resources?q={search_term}`),
      and pricing teaser data (first 3 active plans from control-plane `Plan` records with name, price,
      and CTA target).
      **Accept:** Page source contains valid `SoftwareApplication`, `WebSite`, and `Organization` JSON-LD.

- [x] 4.3 Add interactive product showcase to `entertainment_express/entertainment_express/public/marketing/marketing.js`:
      - Query `#ee-showcase` container. Find `.ee-showcase-tab` buttons and `.ee-showcase-panel` elements.
      - On tab click: set `aria-selected="true"`, show corresponding panel, lazy-load the `<img>` via
        `data-src` → `src`.
      - Auto-advance: cycle tabs every 5000ms. Pause on `mouseenter` or `focusin`. Resume on `mouseleave`
        or `focusout`.
      - Keyboard: ArrowLeft/ArrowRight move between tabs. Home/End go to first/last.
      - CSS: tabs use token-based active/inactive styling. Panel transition with `opacity` + `transform`.
      **Accept:** Showcase auto-advances between 4 tabs. Arrow keys navigate. Hover pauses auto-advance.

- [x] 4.4 Create placeholder product screenshots in `entertainment_express/entertainment_express/public/marketing/img/showcase/`:
      `owner-today.png`, `dispatch-board.png`, `client-portal.png`, `crew-mobile.png` — each at 1280×800px
      (desktop) and 640×400px (mobile) variants. Use actual portal screenshots if available, or create
      representative placeholder images.
      **Accept:** 8 image files exist (4 desktop + 4 mobile). Each is under 200KB (optimized).

## 5. Vertical Solution Pages

- [x] 5.1 Expand the `SOLUTIONS` dict in `entertainment_express/entertainment_express/www/solutions.py`
      with per-vertical fields:
      ```python
      SOLUTIONS = {
          "djs": {
              "name": "Mobile DJs and MCs",
              "headline": "The Operating System for Mobile DJs",
              "summary": "...",  # existing
              "meta_description": "Mobile DJ booking software with music planning, Serato playlist export, crew dispatch, contracts, and client portal. Replace DJ Event Planner and DJ Intelligence.",
              "pain_points": [
                  "Music lists trapped in email threads",
                  "Manual Serato/Rekordbox playlist creation",
                  "Timeline updates during rehearsals",
                  "Juggling 4+ apps for quotes, contracts, payments",
              ],
              "features": [
                  {"title": "Serato/Rekordbox Playlist Export", "desc": "Export event music requests directly to DJ software formats."},
                  {"title": "Collaborative Timeline", "desc": "Real-time event timeline shared with clients and MCs."},
                  {"title": "Guest Song Requests", "desc": "Branded portal where guests submit and vote on songs."},
                  {"title": "Automated Contracts & E-Sign", "desc": "Send proposals with contracts and collect deposits in one flow."},
              ],
              "keywords": ["mobile DJ booking software", "DJ contract app", "wedding DJ planning"],
              "app_category": "EntertainmentApplication",
          },
          # ... repeat for rentals, photo-booths, game-trucks, casino, performers
      }
      ```
      Fill all 6 verticals with equivalent detail. Update `get_context()` to pass the full solution dict,
      add `SoftwareApplication` JSON-LD scoped to the vertical's `app_category`, add `BreadcrumbList`
      JSON-LD (Home → Solutions → {Vertical Name}), and set targeted `<title>` and `meta_description`.
      **Accept:** `/solutions/djs` renders a headline, 4 pain points, 4 features, and page source contains
      valid `SoftwareApplication` and `BreadcrumbList` JSON-LD. All 6 verticals render without error.

- [x] 5.2 Redesign `entertainment_express/entertainment_express/www/solutions.html` template:
      - Hero with `{{ solution.headline }}` as `<h1>`, `{{ solution.summary }}` as subtitle, and CTA.
      - "Pain Points" section: 4 cards with problem descriptions.
      - "How Entertainment Express Solves It" section: feature cards from `{{ solution.features }}`.
      - "What You Get" section: bulleted entitlement highlights.
      - Final CTA section with "Start free 14-day trial" linking to `/start-trial?vertical={{ vertical }}`.
      - Breadcrumb via `{% include "breadcrumb.html" %}`.
      **Accept:** Template renders all sections for any vertical key. Breadcrumb shows.

## 6. Competitor Comparison Pages

- [x] 6.1 Create `entertainment_express/entertainment_express/www/compare.py` with a `COMPETITORS` dict:
      ```python
      COMPETITORS = {
          "inflatable-office": {
              "name": "Inflatable Office",
              "tagline": "Modern Alternative to Inflatable Office",
              "meta_description": "Switch from Inflatable Office to Entertainment Express. Auto-import your inventory, customers, and bookings in 15 minutes. Modern UI, weather automation, and mobile dispatch.",
              "weaknesses": [
                  "Outdated 2010s-era interface",
                  "No automated weather risk alerts",
                  "No mobile crew app",
                  "Manual data export for migrations",
              ],
              "comparison_features": [
                  {"feature": "Modern Portal UI", "ee": "Yes — Stripe-grade", "competitor": "No"},
                  {"feature": "Weather Risk Automation", "ee": "Yes", "competitor": "No"},
                  {"feature": "Mobile Crew App", "ee": "Yes (PWA)", "competitor": "No"},
                  {"feature": "1-Click Data Import", "ee": "Yes", "competitor": "N/A"},
                  {"feature": "Custom Domain & White-Label", "ee": "Yes", "competitor": "Limited"},
                  {"feature": "E-Signature & Contracts", "ee": "Yes", "competitor": "Basic"},
                  {"feature": "Dispatch Board", "ee": "Yes", "competitor": "Limited"},
                  {"feature": "AI Copilot", "ee": "Scale plan", "competitor": "No"},
              ],
              "migration_cta": "Import your Inflatable Office data in 15 minutes",
              "keywords": ["Inflatable Office alternative", "Inflatable Office vs"],
          },
          # ... repeat for goodshuffle-pro, dj-event-planner, honeybook, event-rental-systems
      }
      ```
      Fill all 5 competitors with equivalent detail. `get_context()`: validate slug against COMPETITORS,
      call `apply_common_page_context()` with targeted title/description, add `SoftwareApplication` JSON-LD,
      add `BreadcrumbList` (Home → Compare → {Competitor Name}). Return 404 for unknown slugs.
      **Accept:** `/compare/inflatable-office` renders. `/compare/nonexistent` returns 404. JSON-LD valid.

- [x] 6.2 Create `entertainment_express/entertainment_express/www/compare.html` template:
      - Hero: `<h1>{{ competitor.tagline }}</h1>` with CTA.
      - Feature comparison table: `<table>` with Feature | Entertainment Express | {competitor.name} columns.
        Use checkmarks (✓) and crosses (✗) for boolean features.
      - "Weaknesses They Can't Fix" section: list of `{{ competitor.weaknesses }}`.
      - Migration CTA section: `{{ competitor.migration_cta }}` with button to `/start-trial`.
      - Breadcrumb.
      **Accept:** Table renders all comparison features. Breadcrumb shows 3 levels.

## 7. Feature Deep-Dive Pages

- [x] 7.1 Create `entertainment_express/entertainment_express/www/feature_page.py` with a `FEATURES` dict:
      ```python
      FEATURES = {
          "weather-risk": {
              "name": "Weather Risk & Rain-Date Automation",
              "headline": "Stop Losing Money to Bad Weather",
              "meta_description": "Automated weather threshold alerts, rain-date rebooking, and outdoor event risk management for party rental and entertainment companies.",
              "problem": "Outdoor events are at the mercy of weather. Most operators check forecasts manually and scramble to notify clients about cancellations — losing revenue and trust.",
              "solution": "Entertainment Express monitors weather forecasts for every outdoor booking, automatically alerts you when wind, rain, or lightning thresholds are exceeded, and offers one-click rain-date rebooking to your client.",
              "highlights": [
                  "Automated forecast monitoring per event",
                  "Configurable wind/rain/lightning thresholds",
                  "Client notification with rain-date offer",
                  "Booking status auto-updates",
              ],
              "keywords": ["party rental weather cancellation", "event weather risk software"],
              "image": "features/weather-risk.svg",
          },
          # ... repeat for dispatch-load-planning, dj-playlist-export, customer-portal,
          #     white-label-branding, ai-copilot
      }
      ```
      Fill all 6 features. `get_context()`: validate slug, add JSON-LD, breadcrumbs (Home → Features →
      {Name}).
      **Accept:** `/features/weather-risk` renders. All 6 feature pages render. 404 for unknown slugs.

- [x] 7.2 Create `entertainment_express/entertainment_express/www/feature_page.html` template:
      - Hero: `<h1>{{ feature.headline }}</h1>`, description, CTA.
      - Problem section: `{{ feature.problem }}`.
      - Solution section: `{{ feature.solution }}` with image/illustration.
      - Highlights: bulleted list from `{{ feature.highlights }}`.
      - CTA: "Start free 14-day trial".
      - Breadcrumb.
      **Accept:** All sections render for any feature key.

- [x] 7.3 Update `entertainment_express/entertainment_express/www/features.html` into a feature hub:
      categorized grid of 6 feature cards, each linking to `/features/<slug>`. Keep page as the index.
      Update `entertainment_express/entertainment_express/www/features.py` to pass the `FEATURES` dict
      (import from `feature_page.py`).
      **Accept:** `/features` shows a grid linking to all 6 deep-dive pages.

## 8. Pricing Page Overhaul

- [x] 8.1 Update `entertainment_express/entertainment_express/www/pricing.py` to:
      - Load all active Plan records and build a `feature_matrix` dict mapping feature_key → per-plan values.
      - Define a `FAQ_ITEMS` list of `{question, answer}` dicts (at least 8 items covering: "Is there a free
        plan?", "Do I need a credit card?", "Can I switch plans?", "What happens after the trial?",
        "Can I cancel anytime?", "Do you offer annual discounts?", "What payment methods do you accept?",
        "How does data migration work?").
      - Add `FAQPage` JSON-LD from `FAQ_ITEMS`.
      - Add `SoftwareApplication` JSON-LD with `offers` array from Plan records.
      - Add `BreadcrumbList` (Home → Pricing).
      **Accept:** Context includes `feature_matrix`, `faq_items`, and valid JSON-LD.

- [x] 8.2 Redesign `entertainment_express/entertainment_express/www/pricing.html`:
      - Monthly/Annual toggle (existing, but restyle with token-based pill toggle).
      - 3-tier plan cards: Starter (free, outlined), Pro (highlighted "Most Popular" badge, filled),
        Scale (premium, gradient border). Each card: plan name, price, trial info, 5 key features,
        CTA button.
      - Feature comparison matrix: `<table>` with feature_key rows and plan columns. Use ✓/✗/values.
      - FAQ accordion section: `<details>/<summary>` elements with smooth expand animation. `FAQPage`
        JSON-LD is in page source.
      - Trust section: "No credit card for trial", "Cancel anytime", "Your data is yours".
      **Accept:** 3 plan cards render with prices from Plan records. FAQ accordion works. Feature matrix
      has rows for all entitlement keys.

- [x] 8.3 Add FAQ accordion behavior to
      `entertainment_express/entertainment_express/public/marketing/marketing.js`:
      add smooth expand/collapse animation for `<details>` elements inside `.ee-faq-section` using
      CSS transitions on `max-height`. Add `aria-expanded` attribute management.
      **Accept:** FAQ questions expand/collapse smoothly. `aria-expanded` toggles correctly.

**41b Definition of done:** All new page types render (6 solutions, 5 comparisons, 6 features), homepage is
redesigned with interactive showcase, pricing shows 3 tiers with FAQ, JSON-LD and breadcrumbs on all pages,
all routes in sitemap.xml.

## 41c — Plans, trial flow & entitlements

## 9. Plan Seed Data & Entitlements

- [x] 9.1 Create or update the Plan fixture in
      `entertainment_express/entertainment_express/fixtures/plan.json` (or equivalent seed script) to define:
      - **Starter**: code=starter, price_monthly=0, price_annual=0, trial_days=0, status=active.
        Entitlements: max_staff=1, active_bookings_limit=3, storage_gb=0.5, white_label=0, custom_domain=0,
        weather_risk=0, sms_enabled=0, playlist_export=0, ai_assistant=0, overflow_exchange=0,
        show_ee_badge=1, concierge_migration=0.
      - **Pro**: code=pro, price_monthly=99, price_annual=948, trial_days=14, status=active.
        Entitlements: max_staff=5, active_bookings_limit=9999, storage_gb=15, white_label=1, custom_domain=1,
        weather_risk=1, sms_enabled=1, playlist_export=1, ai_assistant=0, overflow_exchange=0,
        show_ee_badge=0, concierge_migration=0.
      - **Scale**: code=scale, price_monthly=249, price_annual=2388, trial_days=14, status=active.
        Entitlements: max_staff=9999, active_bookings_limit=9999, storage_gb=100, white_label=1,
        custom_domain=1, weather_risk=1, sms_enabled=1, playlist_export=1, ai_assistant=1,
        overflow_exchange=1, show_ee_badge=0, concierge_migration=1.
      **Accept:** All 3 plans load correctly on `bench --site admin.{base_domain} execute` or fixture import.

- [x] 9.2 Update the Subscription trial-expiry handler (in `entertainment_express/control_plane/` or
      `saas-control-plane` module) to implement reverse-trial logic:
      - When a Subscription's `status=trialing` and `current_period_end < now()` and no Stripe payment method
        is attached → set `plan` to Starter plan, set `status` to `active`, update entitlements.
      - Do NOT set `status` to `suspended`.
      - Log the downgrade with actor="system", action="trial_expired_downgrade_to_starter".
      **Accept:** After trial expiry without payment, the Subscription shows plan=Starter, status=active.

- [x] 9.3 Update the trial signup flow in `entertainment_express/api/marketing.py` `start_trial()`:
      - If `plan_code=starter`: create Subscription with status=active (no trial, no Stripe checkout).
        Return `{site_url}` without `checkout_url`.
      - If `plan_code=pro` or `plan_code=scale`: existing flow (create trialing Subscription, return
        Stripe `checkout_url`).
      **Accept:** Starter signup does not redirect to Stripe. Pro signup redirects to Stripe checkout.

## 10. Entitlement Enforcement on Tenant Sites

- [x] 10.1 Add `active_bookings_limit` enforcement to the EE Booking creation flow (in
      `entertainment_express/booking/` or the relevant DocType controller). Before inserting a new booking,
      count active future bookings for the tenant site. If count >= plan limit, raise a ValidationError with
      message: "Your plan allows up to {limit} active bookings. Upgrade to Pro for unlimited bookings."
      Read the limit from the tenant's plan entitlements (via `site_config` or `EE Portal Settings`).
      **Accept:** Starter tenant with 3 active bookings cannot create a 4th. Pro tenant can create unlimited.

- [x] 10.2 Add `max_staff` enforcement to the staff invitation/creation flow (in
      `entertainment_express/workforce/` or the HR module). Before adding a new EE staff user, count current
      active staff. If count >= plan limit, raise a ValidationError with message: "Your plan allows {limit}
      staff members. Upgrade to Pro for more." Read the limit from the tenant's plan entitlements.
      **Accept:** Starter tenant with 1 staff cannot add a 2nd. Pro tenant can add up to 5.

- [x] 10.3 Add EE badge enforcement to the client portal footer. In
      `entertainment_express/entertainment_express/www/client/` (or the portal SPA footer component), check
      the `show_ee_badge` entitlement from portal bootstrap. If `show_ee_badge=1`, render
      `<a href="https://www.{base_domain}">Powered by Entertainment Express</a>` in the portal footer.
      If `show_ee_badge=0`, do not render the badge.
      **Accept:** Starter tenant's `/client` footer shows the badge. Pro tenant's footer does not.

## 11. Testing & Validation

- [x] 11.1 Add a smoke test for all new marketing routes in `smoke_test.py`: verify HTTP 200 for `/`,
      `/pricing`, `/features`, `/features/weather-risk`, `/solutions/djs`, `/solutions/rentals`,
      `/compare/inflatable-office`, and verify HTTP 404 for `/solutions/nonexistent` and
      `/compare/nonexistent`.
      **Accept:** `python smoke_test.py` passes all new route checks.

- [x] 11.2 Validate JSON-LD on key pages: write a test (or add to `smoke_test.py`) that fetches `/`, 
      `/pricing`, `/solutions/djs`, and `/compare/inflatable-office`, parses `<script type="application/ld+json">` 
      blocks, and asserts expected `@type` values are present (`SoftwareApplication`, `Organization`, 
      `BreadcrumbList`, `FAQPage` where applicable).
      **Accept:** JSON-LD validation passes for all 4 pages.

- [x] 11.3 Run `bench --site admin.{base_domain} run-tests --app entertainment_express` to verify no
      regressions. Fix any failures related to Plan fixture changes.
      **Accept:** All existing tests pass.

- [x] 11.4 Verify Lighthouse mobile scores on `/` and `/pricing` meet target ≥ 90 for Performance,
      Accessibility, Best Practices, and SEO.
      **Accept:** Lighthouse mobile audit scores ≥ 90 on all 4 categories for both pages.

## 12. Roadmap & Spec Sync

- [x] 12.1 Add Phase 41 entry to `openspec/changes/ROADMAP.md` after Phase 40 with status 📝, linking to
      `phase-41-marketing-website-refresh/`.
      **Accept:** ROADMAP.md contains Phase 41 entry.

- [x] 12.2 On phase close: archive change; sync deltas to baseline specs; run `openspec validate --specs`.
      **Accept:** Validate passes.

## Definition of done

- All 6 vertical solution pages, 5 competitor comparison pages, and 6 feature deep-dive pages render
  with targeted SEO metadata, JSON-LD structured data, and breadcrumb navigation.
- Homepage redesigned with interactive product showcase, portal-kit tokens, and enterprise-grade visual
  design.
- Pricing page shows Starter (free) / Pro ($99) / Scale ($249) with feature matrix and FAQ accordion.
- Plan seed data includes Starter plan. Reverse trial downgrades to Starter instead of suspending.
- Entitlement enforcement works for active booking limit, staff limit, and EE badge.
- All marketing routes included in `sitemap.xml`.
- Lighthouse mobile scores ≥ 90 on homepage and pricing.
- `smoke_test.py` and `bench run-tests` pass.
- No tenant isolation regressions.
