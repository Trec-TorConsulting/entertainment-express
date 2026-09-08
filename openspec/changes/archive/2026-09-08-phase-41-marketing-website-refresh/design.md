## Context

The EE marketing website lives entirely within the Frappe `www/` routing system. Every public page is a
`www/<route>.html` Jinja template + `www/<route>.py` context builder, extending `templates/marketing/base.html`.
Static assets live in `public/marketing/` and are served at `/assets/entertainment_express/marketing/`.

**Current state:**
- Homepage (`index.html`): basic hero + feature grid + KPI grid + workflow cards. Functional but visually
  dated compared to portal-kit portals.
- Pricing (`pricing.html`): renders from `Plan` records with monthly/annual toggle. No feature comparison
  matrix, no FAQ, no structured data.
- Features (`features.html`): a single bulleted list. No deep-dive pages.
- Solutions (`solutions.html` + `solutions.py`): has a `SOLUTIONS` dict with 6 verticals but the template
  is a simple card with one paragraph per vertical. No SEO keyword targeting.
- SEO: `seo_head.html` includes OG/Twitter cards + one `Organization` JSON-LD. No `SoftwareApplication`,
  `FAQPage`, `BreadcrumbList`, or per-page structured data.
- CSS: standalone `marketing.css` with custom properties that partially mirror portal-kit tokens but drift.
- JS: `marketing.js` handles consent banner, pricing toggle, and analytics events.
- Trial flow: `start_trial.html` + `start_trial.py` → `api.marketing.start_trial` → Signup Application.

**Key constraint:** The marketing site runs on the **control-plane site** (`admin.{base_domain}`), not on
tenant sites. It must NEVER read or write tenant-site databases. Plan records, Lead records, and Marketing
Settings all live on the control-plane site.

## Goals / Non-Goals

**Goals:**
1. Make the marketing website visually match the portal-kit premium aesthetic (Phase 40 quality bar).
2. Build an SEO engine that captures high-intent search traffic for vertical keywords, competitor
   alternatives, and feature pain-point queries.
3. Implement the Starter (free) / Pro / Scale pricing tiers with reverse-trial (14-day Pro → Starter).
4. Provide enough interactive product showcase that prospects feel confident before signing up.
5. Achieve Lighthouse 95+ mobile scores on all marketing pages.
6. Make every artifact explicit enough for a lower-capability model to implement task-by-task.

**Non-Goals:**
- Tenant portal changes (portals are done — Phase 40).
- Interactive live sandbox/demo (future phase — requires provisioning a demo tenant).
- Video production or professional photography (use generated screenshots/illustrations).
- Blog content strategy (blog infrastructure exists; writing content is a marketing ops task).
- A/B testing infrastructure (future).
- Frappe Cloud / marketplace integration (not our distribution channel).

## Decisions

### Decision 1: Portal-Kit Token Import Strategy

**Choice:** Import portal-kit CSS custom properties via a generated `marketing-tokens.css` file that
mirrors `frontend/portal-kit/src/tokens.css` values, rather than importing the portal-kit npm package
directly.

**Why:** The marketing site is server-rendered Jinja + vanilla CSS/JS (no build toolchain, no React, no
Tailwind). Portal-kit is a React + Tailwind library. Importing the npm package would require adding a
build step to marketing. Instead, we extract the `--ee-*` CSS custom properties into a standalone
`marketing-tokens.css` file that marketing.css `@import`s. This keeps marketing build-free while ensuring
visual parity.

**How:** Create `public/marketing/marketing-tokens.css` containing all `--ee-*` variables from
`tokens.css` (colors, typography, spacing, elevation, radius, motion). The main `marketing.css` opens with
`@import url("marketing-tokens.css")`. When portal-kit tokens change, a dev syncs the file manually
(document in `FRONTEND_DEPLOYMENT.md`). No runtime dependency.

**Alternative considered:** Adding Vite to marketing → rejected because marketing is 2 CSS files +
1 JS file; a build toolchain adds complexity for no benefit.

### Decision 2: Page Type Architecture

**Choice:** Three new "page types" implemented as Frappe `www/` routes with Python dict-driven content:

| Page type | Route pattern | Template | Context builder | Content source |
|-----------|--------------|----------|-----------------|----------------|
| Vertical solution | `/solutions/<vertical>` | `solutions.html` (rewrite) | `solutions.py` | `SOLUTIONS` Python dict |
| Competitor compare | `/compare/<slug>` | `compare.html` (new) | `compare.py` (new) | `COMPETITORS` Python dict |
| Feature deep-dive | `/features/<slug>` | `feature_page.html` (new) | `feature_page.py` (new) | `FEATURES` Python dict |

**Why dicts, not DocTypes:** This content is static marketing copy authored by the development team, not
operator-editable CMS content. Using Python dicts keeps the data versioned in git, reviewable in PRs, and
deployable without database migrations. The existing `solutions.py` already uses this pattern.

**Why not Frappe Web Pages:** Web Pages are for operator-authored content (about, legal). These pages need
structured data (keyword arrays, feature lists, comparison tables) that don't fit the Web Page free-text model.

### Decision 3: JSON-LD Structured Data Strategy

**Choice:** Each page type gets a dedicated JSON-LD builder function in `site_context.py`:

| Page | JSON-LD types |
|------|---------------|
| Home | `Organization`, `WebSite` (with `SearchAction`), `SoftwareApplication` |
| Pricing | `SoftwareApplication` with `offers[]` from Plan records, `FAQPage` |
| Solutions | `SoftwareApplication` (scoped to category), `BreadcrumbList` |
| Compare | `SoftwareApplication`, `BreadcrumbList` |
| Features | `SoftwareApplication`, `BreadcrumbList` |
| Blog | `BlogPosting` (already exists via Frappe), `BreadcrumbList` |

The `seo_head.html` template already renders `page_json_ld` and `organization_json_ld`. We add a
`breadcrumb_json_ld` slot and populate all three from context builders.

### Decision 4: Pricing Tiers & Reverse Trial

**Choice:**

| Tier | Code | Monthly | Annual | Trial | Key limits |
|------|------|---------|--------|-------|------------|
| Starter | `starter` | $0 | $0 | — | 1 owner, 1 worker, 3 active bookings, 500 MB, EE badge |
| Pro | `pro` | $99 | $79/mo ($948/yr) | 14 days (default) | 5 staff, unlimited bookings, 15 GB, white-label, SMS, weather |
| Scale | `scale` | $249 | $199/mo ($2,388/yr) | 14 days | unlimited staff, 100 GB, AI Copilot, overflow exchange |

**Reverse trial flow:**
1. New signup → Signup Application with `plan=pro`.
2. Provisioning creates a Subscription in `trialing` status for 14 days.
3. At trial end, if no payment method attached → Subscription status changes to `active` on `starter` plan
   (not `suspended`). Entitlements drop to Starter limits.
4. Existing active bookings beyond the 3-limit stay visible (read-only) but new bookings are blocked.
5. EE badge appears in `/client` footer when plan = starter.

**Entitlement keys added to Plan child table:**

| `feature_key` | Starter | Pro | Scale |
|---------------|---------|-----|-------|
| `max_staff` | 1 | 5 | unlimited (9999) |
| `active_bookings_limit` | 3 | unlimited (9999) | unlimited (9999) |
| `storage_gb` | 0.5 | 15 | 100 |
| `white_label` | 0 | 1 | 1 |
| `custom_domain` | 0 | 1 | 1 |
| `weather_risk` | 0 | 1 | 1 |
| `sms_enabled` | 0 | 1 | 1 |
| `playlist_export` | 0 | 1 | 1 |
| `ai_assistant` | 0 | 0 | 1 |
| `overflow_exchange` | 0 | 0 | 1 |
| `show_ee_badge` | 1 | 0 | 0 |
| `concierge_migration` | 0 | 0 | 1 |

### Decision 5: Interactive Product Showcase

**Choice:** A pure vanilla JS tabbed component in `marketing.js` that switches between static screenshots
with captions. No React, no framework, no video.

**Why not video or live demo:** Video requires production effort beyond this phase. A live demo requires
provisioning a demo tenant and keeping it seeded — that's a future phase.

**Implementation:**
- 4 tabs: "Owner Dashboard", "Dispatch Board", "Client Portal", "Crew Mobile".
- Each tab shows a `<picture>` with `srcset` for desktop (1280px) and mobile (640px) screenshots.
- Auto-advance every 5 seconds with pause on hover/focus. Keyboard arrow navigation.
- Screenshots stored in `public/marketing/img/showcase/` as optimized WebP with PNG fallback.
- Lazy-loaded below the hero fold.

### Decision 6: Sitemap Enhancement

**Choice:** Extend the existing `www/robots.txt` Frappe route handler to dynamically generate sitemap
entries for all marketing page types. Use Frappe's built-in sitemap generation where possible; supplement
with explicit entries for dict-driven pages (solutions, compare, features) since Frappe's auto-discovery
only picks up routes with HTML templates.

**Implementation:** Add a `get_sitemap_routes()` function in `marketing/site_context.py` that returns
explicit routes for all solution verticals, competitor pages, and feature pages. Hook into Frappe's
`website_generators` or add entries in `website_route_rules` in `hooks.py`.

## Risks / Trade-offs

1. **Screenshot maintenance** → Screenshots will become outdated when portals change. Mitigation: add a
   checklist item in `FRONTEND_DEPLOYMENT.md` to recapture screenshots when portal UI changes significantly.

2. **Token drift** → `marketing-tokens.css` may drift from `tokens.css`. Mitigation: document the sync
   process in `FRONTEND_DEPLOYMENT.md`; add a CI check that diffs the two files (future).

3. **SEO takes time** → Google won't rank new pages immediately. Mitigation: submit sitemap to Google Search
   Console post-deploy; initial traffic will come from direct outreach and community posts, not organic.

4. **Reverse trial complexity** → Post-trial downgrade to Starter requires new entitlement enforcement code
   on tenant sites. Mitigation: scope enforcement to 3 specific checks (active bookings count, staff count,
   EE badge in footer) — don't build a generic entitlement gateway in this phase.

5. **Dict-driven content is code-deployed** → Adding a new competitor comparison requires a code deploy.
   Mitigation: this is acceptable for launch; CMS-managed comparison pages can be a future enhancement.

## File Path Reference

```
entertainment_express/
  entertainment_express/
    marketing/
      site_context.py           ← MODIFY (add breadcrumb, JSON-LD helpers, sitemap routes)
    templates/
      marketing/
        base.html               ← MODIFY (visual upgrade, breadcrumb block)
        header.html             ← MODIFY (sticky glass nav, mobile hamburger)
        footer.html             ← MODIFY (multi-column, social links, newsletter)
        nav.html                ← MODIFY (mega-nav dropdown for Solutions/Features/Compare)
        seo_head.html           ← MODIFY (add breadcrumb_json_ld slot)
        cta.html                ← MODIFY (visual upgrade)
        breadcrumb.html         ← NEW (breadcrumb partial)
    www/
      index.html                ← MODIFY (full homepage redesign)
      index.py                  ← MODIFY (showcase data, enhanced JSON-LD)
      pricing.html              ← MODIFY (3-tier cards, comparison matrix, FAQ)
      pricing.py                ← MODIFY (feature matrix, FAQ data, JSON-LD)
      features.html             ← MODIFY (feature hub with links)
      features.py               ← MODIFY (hub context)
      solutions.html            ← MODIFY (full vertical landing page)
      solutions.py              ← MODIFY (expanded SOLUTIONS dict)
      compare.html              ← NEW (competitor comparison template)
      compare.py                ← NEW (competitor context builder)
      feature_page.html         ← NEW (feature deep-dive template)
      feature_page.py           ← NEW (feature page context builder)
    public/
      marketing/
        marketing-tokens.css    ← NEW (portal-kit token mirror)
        marketing.css           ← MODIFY (full visual redesign)
        marketing.js            ← MODIFY (showcase tabs, FAQ accordion)
        img/
          showcase/             ← NEW (product screenshots)
          features/             ← NEW (feature icons)

frontend/portal-kit/src/tokens.css  ← READ ONLY (source of truth for tokens)

openspec/changes/ROADMAP.md         ← MODIFY (add Phase 41 entry)
FRONTEND_DEPLOYMENT.md              ← MODIFY (add token sync + screenshot docs)
```
