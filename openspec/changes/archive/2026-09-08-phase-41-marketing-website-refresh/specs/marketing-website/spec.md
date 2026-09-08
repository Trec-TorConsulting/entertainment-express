## ADDED Requirements

### Requirement: Vertical Solution Landing Pages
The system SHALL serve dedicated, SEO-optimized landing pages at `/solutions/<vertical>` for each supported
vertical (djs, rentals, photo-booths, game-trucks, casino, performers). Each page SHALL include a
vertical-specific headline, pain-point callouts, tailored feature highlights, a unique meta description
targeting vertical search keywords, `SoftwareApplication` JSON-LD scoped to the vertical's application
category, a `BreadcrumbList` JSON-LD, and a CTA into the trial signup flow with vertical attribution.

#### Scenario: DJ vertical page renders with targeted SEO
- **WHEN** a guest opens `/solutions/djs`
- **THEN** the page shows a headline, pain points, and features specific to mobile DJs, the `<title>` and
  meta description contain "mobile DJ booking" keywords, and JSON-LD includes `SoftwareApplication` with
  `applicationCategory` matching the DJ vertical

#### Scenario: Unknown vertical returns 404
- **WHEN** a guest opens `/solutions/unknown-vertical`
- **THEN** the server returns HTTP 404, not a 500 or a blank page

#### Scenario: Vertical CTA carries attribution
- **WHEN** a guest clicks "Start free trial" on a vertical page
- **THEN** the trial signup form receives `source_page=/solutions/<vertical>` in the hidden field

### Requirement: Competitor Comparison Pages
The system SHALL serve SEO-optimized comparison pages at `/compare/<competitor-slug>` for major competitors
(inflatable-office, goodshuffle-pro, dj-event-planner, honeybook, event-rental-systems). Each page SHALL
include a "Modern alternative to {Competitor}" headline, a structured feature comparison table (EE vs
competitor), a migration CTA referencing the one-click data import presets, unique meta description targeting
"{Competitor} alternative" keywords, `SoftwareApplication` JSON-LD, and `BreadcrumbList` JSON-LD.

#### Scenario: Comparison page renders
- **WHEN** a guest opens `/compare/inflatable-office`
- **THEN** the page shows "Modern Alternative to Inflatable Office" as the `<h1>`, a feature comparison
  table, and a CTA mentioning data import

#### Scenario: Unknown competitor returns 404
- **WHEN** a guest opens `/compare/nonexistent-tool`
- **THEN** the server returns HTTP 404

#### Scenario: Comparison meta targets alternative keywords
- **WHEN** a search engine crawls `/compare/goodshuffle-pro`
- **THEN** the `<title>` contains "Goodshuffle Pro Alternative" and the meta description mentions switching

### Requirement: Feature Deep-Dive Pages
The system SHALL serve SEO-optimized feature pages at `/features/<feature-slug>` for major capabilities
(weather-risk, dispatch-load-planning, dj-playlist-export, customer-portal, white-label-branding,
ai-copilot). Each page SHALL include the feature name as `<h1>`, a problem statement, how EE solves it,
a visual (screenshot or illustration), a CTA, unique meta description targeting pain-point keywords,
`SoftwareApplication` JSON-LD, and `BreadcrumbList` JSON-LD.

#### Scenario: Feature page renders
- **WHEN** a guest opens `/features/weather-risk`
- **THEN** the page shows "Weather Risk & Rain-Date Automation" as the heading, describes the problem
  of outdoor event cancellations, explains EE's automated threshold alerts and rain-date rebooking, and
  includes a trial CTA

#### Scenario: Features hub links to deep-dives
- **WHEN** a guest opens `/features`
- **THEN** the page shows a categorized grid of features, each linking to its `/features/<slug>` deep-dive

### Requirement: Interactive Product Showcase
The system SHALL display a tabbed interactive product showcase on the homepage below the hero fold. The
showcase SHALL cycle through at least 4 product screenshots (Owner Dashboard, Dispatch Board, Client Portal,
Crew Mobile) with descriptive captions. Tabs SHALL auto-advance every 5 seconds, pause on hover or keyboard
focus, support arrow-key navigation, and lazy-load images for performance.

#### Scenario: Showcase renders with tabs
- **WHEN** a guest loads the homepage
- **THEN** the showcase section shows 4 clickable tabs with the first tab's screenshot visible and a caption
  describing the Owner Dashboard

#### Scenario: Keyboard navigation
- **WHEN** a user focuses the showcase tabs and presses the right arrow key
- **THEN** the next tab activates and its screenshot loads

#### Scenario: Auto-advance pauses on interaction
- **WHEN** a user hovers over or focuses the showcase
- **THEN** auto-advance pauses; it resumes when hover/focus leaves

### Requirement: Premium Marketing Visual Design
The system SHALL render all marketing pages with the portal-kit design token palette (colors, typography
scale, elevation, radius, motion) via a mirrored `marketing-tokens.css` file. The marketing nav SHALL be
sticky with glass-blur effect. The hero SHALL use gradient backgrounds and animated entry. Cards, grids,
and CTAs SHALL use elevation and hover transitions matching portal-kit aesthetics. The site SHALL respect
`prefers-color-scheme` for automatic dark/light mode.

#### Scenario: Token parity with portals
- **WHEN** a developer inspects `--ee-brand` on the marketing site and on `/owner`
- **THEN** both resolve to the same value from the shared token set

#### Scenario: Dark mode follows OS
- **WHEN** a visitor has OS dark mode enabled
- **THEN** the marketing site renders in dark mode using portal-kit dark token overrides

### Requirement: Enhanced Structured Data Engine
The system SHALL emit per-page JSON-LD structured data on all marketing page types:
- Home: `Organization`, `WebSite` (with `SearchAction`), `SoftwareApplication`.
- Pricing: `SoftwareApplication` with `offers` array from Plan records, `FAQPage`.
- Solutions: `SoftwareApplication` scoped to vertical, `BreadcrumbList`.
- Compare: `SoftwareApplication`, `BreadcrumbList`.
- Features: `SoftwareApplication`, `BreadcrumbList`.
- Blog: `BlogPosting`, `BreadcrumbList`.

The `SoftwareApplication` schema SHALL include `name`, `applicationCategory`, `operatingSystem`, `url`,
and `offers` (from Plan records where applicable).

#### Scenario: Home page structured data
- **WHEN** a crawler fetches `/`
- **THEN** the page contains valid JSON-LD with `@type` values `Organization`, `WebSite`, and
  `SoftwareApplication`

#### Scenario: Pricing page FAQ schema
- **WHEN** a crawler fetches `/pricing`
- **THEN** the page contains valid `FAQPage` JSON-LD with at least 5 question/answer pairs sourced from
  the pricing FAQ data

#### Scenario: Breadcrumbs on subpages
- **WHEN** a crawler fetches `/solutions/djs`
- **THEN** the page contains `BreadcrumbList` JSON-LD with items: Home → Solutions → Mobile DJs

### Requirement: Breadcrumb Navigation
The system SHALL render visible breadcrumb navigation on all subpages (solutions, compare, features, pricing,
about, contact, resources, legal) with semantic `<nav aria-label="Breadcrumb">` markup and matching
`BreadcrumbList` JSON-LD.

#### Scenario: Breadcrumb visible on compare page
- **WHEN** a guest opens `/compare/inflatable-office`
- **THEN** a breadcrumb trail "Home > Compare > Inflatable Office" is visible below the nav bar

### Requirement: Enhanced Sitemap Coverage
The system SHALL include all published marketing pages, vertical solution pages, competitor comparison pages,
feature deep-dive pages, and blog posts in `sitemap.xml`. Draft pages, tenant portal routes, and API
endpoints SHALL be excluded.

#### Scenario: Dynamic pages in sitemap
- **WHEN** `sitemap.xml` is fetched
- **THEN** it includes `/solutions/djs`, `/solutions/rentals`, `/compare/inflatable-office`,
  `/features/weather-risk`, and all other dict-driven marketing routes

### Requirement: Pricing Page Redesign
The system SHALL render `/pricing` as a premium 3-tier card layout (Starter / Pro / Scale) with:
monthly/annual toggle, per-plan feature entitlement comparison matrix, a "Most Popular" badge on Pro,
an FAQ accordion section with `FAQPage` JSON-LD, and per-plan CTAs ("Start free" for Starter, "Start
free 14-day trial" for Pro/Scale). Prices and features SHALL be sourced from Plan records.

#### Scenario: Feature comparison matrix
- **WHEN** a guest views `/pricing`
- **THEN** below the plan cards, a comparison table lists all entitlement keys with checkmarks/values per plan

#### Scenario: FAQ accordion with schema
- **WHEN** a guest expands a pricing FAQ question
- **THEN** the answer is revealed with smooth animation, and the page source contains `FAQPage` JSON-LD
  for all FAQ items

#### Scenario: Starter plan shows free
- **WHEN** a guest views the Starter card
- **THEN** the price shows "$0 / mo" and the CTA reads "Start free" linking to `/start-trial?plan=starter`

## MODIFIED Requirements

### Requirement: Designed SaaS Home
The system SHALL render the SaaS front page with a sticky glass-blur nav, animated gradient hero with dual
CTA ("Start free 14-day trial" / "See it in action"), vertical-chip bar showing supported verticals,
interactive product showcase (tabbed screenshots), social proof band, feature grid with icons, workflow
steps, KPI outcome section, pricing teaser sourced from `Plan`, trust/security band, and multi-column
footer — all usable at a 375px viewport, all using portal-kit design tokens.

#### Scenario: Convert on a phone
- **WHEN** a Guest opens `https://www.{base_domain}/` on a 375px-wide viewport
- **THEN** they can reach Start trial without horizontal scroll or clipped primary CTA

#### Scenario: Product showcase visible
- **WHEN** a Guest scrolls past the hero on the home page
- **THEN** they see the interactive tabbed showcase with the first product screenshot loaded

### Requirement: Shared Visual Tokens
The system SHALL publish a single token set (color, type, space, radius, shadow, focus, elevation, motion)
used by marketing CSS (via `marketing-tokens.css`) and portal-kit, so public pages and authenticated portals
do not diverge in brand color, typography, or elevation. Marketing CSS SHALL `@import` the token file.
Marketing pages SHALL support automatic dark/light mode via `prefers-color-scheme`.

#### Scenario: Same brand color
- **WHEN** a visitor views the SaaS home and a tenant user views `/client`
- **THEN** the default brand color token matches unless the tenant has overridden brand color in
  `EE Portal Settings` (tenant pages only)

#### Scenario: Marketing dark mode
- **WHEN** a visitor with OS dark mode opens the marketing site
- **THEN** surfaces, text, and card backgrounds use dark-mode token values
