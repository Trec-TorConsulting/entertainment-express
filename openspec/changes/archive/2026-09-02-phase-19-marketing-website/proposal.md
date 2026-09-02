# Change: Phase 19 — SaaS Marketing Website & Lead Capture

## Why
Every capability that acquires tenants (signup, provisioning, plans) exists, but there is **no public front
door** that sells Entertainment Express to prospective mobile-entertainment companies. `project.md` §4
previously listed the marketing site as "out of scope." This phase brings it **in scope** and delivers the
site that turns visitors into signed-up tenants: it explains the product, shows pricing that matches the
control-plane `Plan` records, captures demo/contact/newsletter leads, and hands qualified visitors into the
existing control-plane signup + provisioning flow.

This is the **only shared, product-level website**. It is distinct from a tenant's booking site
(`booking-availability`) and the customer portal (`customer-portal`), which are per-tenant.

## What Changes
Delivers the `marketing-website` baseline capability. The site is **Frappe-native** (no new frontend stack):
it is served by the **control-plane site** (`admin.{base_domain}`) under the additional host names
`www.{base_domain}` and the apex `{base_domain}`, entirely Guest-facing.

1. **Public marketing pages (CMS-editable)**
   - Home/landing, features, solutions-by-vertical, about, contact, and legal (terms/privacy/cookies) via
     Frappe **Web Page** + fixed Jinja templates in `entertainment_express/www/` for the dynamic pages.
   - Shared header/footer/nav/CTA/SEO includes in `templates/marketing/`; assets in `public/marketing/`.
2. **Pricing page synced to Plans**
   - `www/pricing.html` renders active control-plane `Plan` records (monthly/annual toggle, entitlements,
     per-plan CTA). No hard-coded prices; retired plans hidden.
3. **Lead capture & routing**
   - Public forms (demo, contact, newsletter) → `api/marketing.py` → create ERPNext **Lead** on the
     control-plane site with UTM/referrer/consent, notify sales, spam/rate-limit protection, newsletter
     double opt-in.
4. **Signup / trial CTA handoff**
   - "Start free trial" creates a control-plane **Signup Application** (reused from phase-1) pre-filled with
     the chosen plan + attribution, then hands off to the existing signup/provisioning flow.
5. **SEO & discoverability**
   - Per-page title/meta/canonical, Open Graph/Twitter, JSON-LD, generated `sitemap.xml`, `robots.txt`,
     clean slugs, and 301 redirects via Website Route Redirect.
6. **Resource center / blog**
   - Frappe **Blog** (categories/tags/author/draft), related posts, RSS feed.
7. **Analytics & consent**
   - Privacy-respecting analytics + conversion tracking, gated behind a cookie-consent banner.
8. **Operator configuration**
   - One new `Marketing Settings` Single DocType (Control Plane module) for hero copy, CTAs, social links,
     sales-notify email, analytics + captcha providers/keys, consent banner, section toggles, base domain.

## Impact
- **New DocType:** `Marketing Settings` (Single, Control Plane module) — the only new DocType.
- **Reused DocTypes + Custom Fields (fixtures):** ERPNext **Lead** (`ee_lead_type`, `ee_utm_*`,
  `ee_referrer`, `ee_source_page`, `ee_vertical_interest`, `ee_consent_marketing`, `ee_consent_at`,
  `ee_spam_score`); **Signup Application** (`ee_utm_*`, `ee_source_page`, `ee_origin_lead`); Frappe
  **Web Page**, **Blog Post/Category**, **Email Group/Member**, **Website Route Redirect**.
- **New web pages/templates:** `entertainment_express/www/` (index, pricing, features, solutions, about,
  contact, demo, legal/*, robots.txt, sitemap glue) + `templates/marketing/` includes + `public/marketing/`
  assets.
- **New API:** `entertainment_express/api/marketing.py` (all public endpoints `allow_guest=True`,
  rate-limited): `submit_lead`, `subscribe_newsletter`, `confirm_subscription`, `get_pricing`, `start_trial`.
- **Infra:** add host names `www.{base_domain}` + apex to the control-plane site + ingress; optional
  `analytics-secret.yaml` / `captcha-secret.yaml` templates; seed `Marketing Settings`.
- **Docs:** `project.md` §4 marketing-site line updated from "out of scope" to reference this phase + spec;
  `ROADMAP.md` gains Phase 19.
- **Dependencies:** **phase-1 must be complete** (control-plane site, `Plan`, `Signup Application`,
  provisioning, and the email-notification subset all exist and are reused here).

## Non-Goals (explicitly deferred)
- Multi-language / full localization (English-only first pass).
- Marketing automation journeys, drip campaigns, A/B testing, and CRM nurture — those belong to
  `marketing-engagement` (phase-8); this phase only *captures* leads and *notifies* sales.
- Subscription billing, dunning, and full plan entitlement enforcement — `saas-control-plane` (phase-12).
- A separate/headless frontend stack (Next.js, etc.). The site is Frappe-native by decision (see design §A).
- Per-tenant custom marketing domains (phase-14).
- Rich WYSIWYG page-builder beyond Frappe Web Page/Blog editing.

## Requirements delivered (traceability)
All requirements come from `openspec/specs/marketing-website/spec.md`:
- **Public Marketing Pages** — home/features/solutions/about/contact/legal, CMS-editable, responsive + WCAG AA.
- **Pricing Page Synced to Plans** — reads `Plan`; monthly/annual toggle; retired plans hidden.
- **Lead Capture & Routing** — demo/contact/newsletter → Lead; UTM/consent; spam + rate limit; double opt-in.
- **Signup / Trial CTA Handoff** — creates Signup Application with attribution; hands to control-plane flow.
- **SEO & Discoverability** — meta/OG/JSON-LD; sitemap.xml; robots.txt; 301 redirects.
- **Resource Center / Blog** — Frappe Blog with categories/tags/RSS; drafts hidden.
- **Analytics & Consent** — consent-gated analytics + conversion tracking; no PII.
- **Operator Configuration** — `Marketing Settings` Single DocType; safe degradation when unset.
- **Performance, Security & Availability** — TLS, security headers, hardened public forms, strict isolation
  from tenant data, graceful degradation.
