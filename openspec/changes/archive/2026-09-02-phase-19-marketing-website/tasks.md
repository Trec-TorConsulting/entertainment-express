# Tasks: Phase 19 — SaaS Marketing Website & Lead Capture

> Prereq: **phase-1 Definition of Done met** (control-plane site, `Plan`, `Signup Application`,
> provisioning, and email notifications all exist). Do tasks in order; check a box only when its
> **acceptance** passes. Reference `design.md` sections (A–J) and
> `openspec/specs/marketing-website/spec.md`. The site runs on the **control-plane site** and is
> **Guest-facing**; never touch a tenant site. All public endpoints are rate-limited; never float-math money.

## 1. Configuration DocType & fixtures (design §B)
- [x] 1.1 Create Single DocType `Marketing Settings` (module **Control Plane**) with all fields in design §B.
      **Accept:** `bench migrate` clean; the Single opens in Desk; every field present.
- [x] 1.2 Add Custom Fields to **Lead** via a fixture (`ee_lead_type`, `ee_utm_*`, `ee_referrer`,
      `ee_source_page`, `ee_vertical_interest`, `ee_consent_marketing`, `ee_consent_at`, `ee_spam_score`).
      **Accept:** Lead form shows the EE fields; `bench migrate` applies the fixture; ERPNext core JSON
      untouched.
- [x] 1.3 Add Custom Fields to **Signup Application** via a fixture (`ee_utm_*`, `ee_source_page`,
      `ee_origin_lead`).
      **Accept:** Signup Application shows the fields after `bench migrate`.
- [x] 1.4 Create the `EE Newsletter` Email Group and register all new fixtures in `hooks.py`.
      **Accept:** Email Group exists; `fixtures` in `hooks.py` includes the Custom Fields + Marketing
      Settings; a clean `bench migrate` reproduces everything.

## 2. Shared layout, assets & SEO includes (design §C, §E)
- [x] 2.1 Create `templates/marketing/` partials: `base.html`, `header.html`, `footer.html`, `nav.html`,
      `cta.html`, `seo_head.html`, `consent_banner.html`, `analytics.html`, `lead_form.html`.
      **Accept:** a trivial page extending `base.html` renders header+footer+nav and injects `seo_head.html`.
- [x] 2.2 Create `public/marketing/marketing.css`, `public/marketing/marketing.js`, and `public/marketing/img/`
      (logo, hero, OG default). Wire them into `base.html` (or `hooks.py` bundles).
      **Accept:** CSS/JS load on a rendered page; nav toggle + pricing toggle hooks exist in `marketing.js`.
- [x] 2.3 Implement `seo_head.html` to emit per-page `<title>`, meta description, canonical (absolute from
      `Marketing Settings.base_domain`), Open Graph + Twitter tags, and a site-wide `Organization` JSON-LD.
      **Accept:** viewing any page's source shows unique title/description/canonical + OG + JSON-LD.

## 3. Marketing pages (design §C) — spec: Public Marketing Pages
- [x] 3.1 Home: `www/index.html` + `www/index.py` reading `Marketing Settings` (hero, CTAs, section toggles),
      with feature grid, pricing teaser, social proof, and primary/secondary CTAs.
      **Accept:** `/` renders over the site with hero + CTAs from settings; toggling a section flag hides that
      section without a code change.
- [x] 3.2 Features: `www/features.html`; Solutions: `www/solutions.html` + `www/solutions.py` driven by a
      vertical slug (djs, rentals, photo-booths, game-trucks, casino, performers).
      **Accept:** `/features` and `/solutions/<vertical>` render; an unknown vertical returns 404.
- [x] 3.3 About + Legal: `www/about.html`, `www/legal/terms.html`, `www/legal/privacy.html`,
      `www/legal/cookies.html` (content may come from Frappe **Web Page**).
      **Accept:** each route returns 200 with correct title/canonical; footer links reach them.
- [x] 3.4 Confirm CMS editability: create one marketing **Web Page** and confirm edits publish live.
      **Accept:** editing the Web Page body changes the live page with no redeploy (spec scenario "Content
      editable without code deploy").
- [x] 3.5 Responsive + accessibility pass (landmarks, alt text, focus order, contrast, keyboard nav).
      **Accept:** pages usable on mobile/desktop and by keyboard; automated a11y check reports no critical
      violations (WCAG 2.1 AA basics).

## 4. Pricing page synced to Plans (design §C, §D) — spec: Pricing Page Synced to Plans
- [x] 4.1 Implement `api/marketing.get_pricing(billing)` returning active `Plan` records (code, name,
      price_monthly, price_annual, currency, trial_days, features/entitlements, cta_target); format money via
      `frappe.utils.flt` (no float math).
      **Accept:** returns only `active` Plans; a `retired` Plan is absent; values match the `Plan` records.
- [x] 4.2 Build `www/pricing.html` + `www/pricing.py` rendering plan cards from `get_pricing`, with a
      monthly/annual toggle (in `marketing.js`) and a per-plan CTA → `/start-trial?plan=<code>`.
      **Accept:** `/pricing` lists current plans; toggling switches monthly↔annual prices; editing a Plan's
      price in Desk updates the page with no code change (spec scenario "Pricing reflects control-plane
      plans"); retired plans do not render.

## 5. Lead capture & routing (design §D, §G) — spec: Lead Capture & Routing
- [x] 5.1 Implement `api/marketing.submit_lead(payload)` (`allow_guest`, rate-limited): honeypot + optional
      captcha verify + rate limit → on pass create ERPNext **Lead** with `ee_lead_type`, UTM/referrer/
      source-page/consent, compute `ee_spam_score`, and `frappe.enqueue` a sales notification to
      `sales_notify_email`.
      **Accept:** valid demo submit creates a Lead with correct type + UTM and enqueues (not inline) the
      notification.
- [x] 5.2 Spam/rate-limit hardening.
      **Accept:** a honeypot-filled submit creates **no** Lead and sends no email; exceeding the rate limit is
      rejected with a safe error (no stack trace) — spec scenario "Spam and rate-limit protection".
- [x] 5.3 Build `www/demo.html`+`www/demo.py` and `www/contact.html`+`www/contact.py` using the shared
      `lead_form.html` (honeypot + captcha placeholder + UTM/referrer hidden fields captured in JS), posting
      to `submit_lead`.
      **Accept:** submitting each form shows a success state and creates the correct `ee_lead_type` Lead.
- [x] 5.4 Newsletter double opt-in: `subscribe_newsletter` (pending member + tokenized confirmation email) and
      `confirm_subscription(token)` (mark confirmed, set consent), both idempotent.
      **Accept:** subscribe creates a **pending** member + confirmation email; clicking confirm adds them to
      `EE Newsletter` and records `ee_consent_marketing`/`ee_consent_at`; confirming twice is a no-op (spec
      scenario "Newsletter double opt-in"). Re-subscribing an existing email returns generic success (no
      enumeration).

## 6. Signup / trial CTA handoff (design §D) — spec: Signup / Trial CTA Handoff
- [x] 6.1 Implement `api/marketing.start_trial(...)`: reuse phase-1 slug validation; spam checks; create a
      `trial` Lead; create a control-plane **Signup Application** with `plan` (from `plan_code`), attribution
      custom fields, and `ee_origin_lead`; return `{ ok, redirect }` into the control-plane signup flow.
      **Accept:** valid input creates a Signup Application linked to the plan + origin Lead and returns the
      signup redirect (spec scenario "Start trial from a plan card").
- [x] 6.2 Build `www/start_trial.html` + `www/start_trial.py` (reads `?plan=<code>`, collects company/email/
      slug, carries UTM/source-page) posting to `start_trial`.
      **Accept:** `/start-trial?plan=<code>` pre-selects the plan; submit routes the visitor into signup.
- [x] 6.3 Attribution persistence: capture UTM on first visit (JS, first-party cookie) and forward through
      `submit_lead`/`start_trial`.
      **Accept:** arriving via a UTM URL then starting a trial persists those UTM values onto the Signup
      Application (spec scenario "Attribution preserved end to end").

## 7. SEO assets (design §E) — spec: SEO & Discoverability
- [x] 7.1 Add `www/robots.txt` (allow public, disallow `/app`,`/api`,`/private`, reference the sitemap URL).
      **Accept:** `/robots.txt` returns 200 with the correct directives + `Sitemap:` line.
- [x] 7.2 Enable Frappe website `sitemap.xml`; ensure marketing Web Pages + Blog Posts are published/indexable
      and drafts + `/start-trial` + `/api/*` are excluded.
      **Accept:** `/sitemap.xml` returns 200, lists a published page, and omits a draft (spec scenario
      "Sitemap and robots reachable").
- [x] 7.3 Add page-type JSON-LD: `Product`+`Offer` on `/pricing` (from Plans), `BlogPosting` on articles,
      `FAQPage` where an FAQ exists.
      **Accept:** pricing/article page source contains valid JSON-LD reflecting real data.
- [x] 7.4 Configure a Website Route Redirect and verify 301 on a changed slug.
      **Accept:** old URL 301s to the new URL; no soft-404 (spec scenario "Redirect on changed slug").

## 8. Resource center / blog (design §C) — spec: Resource Center / Blog
- [x] 8.1 Configure Frappe **Blog** (Blogger, categories/tags) and a `/resources` index (or use `/blog`),
      with related posts and an RSS/Atom feed.
      **Accept:** publishing a Blog Post makes it reachable at its slug, listed in the index + RSS + sitemap;
      a draft stays hidden from the public (spec scenario "Publish an article").

## 9. Analytics & consent (design §F) — spec: Analytics & Consent
- [x] 9.1 Implement `consent_banner.html` + `marketing.js` gating: show banner when `consent_banner_enabled`
      and no consent cookie; load `analytics.html` scripts **only** after Accept; Reject keeps analytics off.
      **Accept:** before consent, no analytics script/cookie loads; after Accept it loads (spec scenario
      "Consent gates non-essential scripts").
- [x] 9.2 Wire provider snippet (`plausible|umami|ga4`, no-op on `none`) and fire conversion events
      (`demo_submitted`, `contact_submitted`, `newsletter_subscribed`, `trial_started`) with **no PII**.
      **Accept:** conversions register in the configured provider; event payloads carry no email/name (spec
      scenario "Conversion events tracked").

## 10. Operator configuration & safe degradation (design §B, §G) — spec: Operator Configuration
- [x] 10.1 Confirm all pages read `Marketing Settings` (hero/CTA/social/section toggles/analytics/consent/
      captcha/base_domain).
      **Accept:** changing hero + primary CTA target in `Marketing Settings` updates the live home page on
      next request (spec scenario "Change hero and CTA without deploy").
- [x] 10.2 Verify safe degradation when optional integrations are unset (analytics `none`, captcha `none`).
      **Accept:** site renders and forms still submit with those integrations disabled (spec scenario "Missing
      configuration degrades safely").

## 11. Security, performance & isolation (design §E, §G) — spec: Performance, Security & Availability
- [x] 11.1 Confirm every public endpoint is `allow_guest` **and** rate-limited, autoescape on, output encodes
      user data, and errors are safe (no stack trace/injection).
      **Accept:** an XSS payload in a form field is not reflected raw; malformed input yields a safe error
      (spec scenario "Public forms are hardened").
- [x] 11.2 Add an isolation test asserting no marketing code path opens or queries a tenant site, and that
      Guest cannot reach Desk.
      **Accept:** test passes (spec scenario "Strict isolation from tenant data").
- [x] 11.3 Performance: single CSS + small JS, compressed/lazy images, cache headers on `public/marketing/*`.
      **Accept:** home page LCP < 2.5s on the cluster; assets served with cache headers.
- [x] 11.4 Graceful degradation when the pricing source or an optional dependency is unavailable.
      **Accept:** pages render with a neutral fallback instead of an error page (spec scenario "Degrades
      gracefully under dependency failure").

## 12. Tests & validation (design §I)
- [x] 12.1 Lead-capture tests (valid create + enqueue; honeypot no-op; rate-limit reject).
      **Accept:** pass.
- [x] 12.2 Newsletter double-opt-in tests (pending→confirm→idempotent; no enumeration).
      **Accept:** pass.
- [x] 12.3 Pricing-sync tests (active only; retired absent; values match Plans).
      **Accept:** pass.
- [x] 12.4 Trial-handoff tests (valid creates Signup Application + attribution; bad slug rejected first).
      **Accept:** pass.
- [x] 12.5 SEO tests (robots/sitemap 200; draft excluded; 301 redirect).
      **Accept:** pass.
- [x] 12.6 Security/isolation tests (escaping; no tenant-site access; Guest cannot reach Desk).
      **Accept:** pass.

## 13. Deployment (design §J)
- [x] 13.1 Add host names `www.{base_domain}` + apex to the control-plane site and Traefik ingress (reuse
      wildcard TLS + shared middlewares); add `captcha-secret.yaml` / `analytics-secret.yaml` templates
      (placeholders only) to `HL/entertainment-express/`.
      **Accept:** `/`, `/pricing`, `/demo`, `/robots.txt`, `/sitemap.xml` reachable over TLS at
      `www.{base_domain}`; no secrets in repo.
- [x] 13.2 Seed `Marketing Settings` (`setup/seed_marketing_settings.py`) with safe defaults (analytics
      `none`, captcha `none`, consent banner on).
      **Accept:** Single is populated after seed; home page renders with defaults.
- [x] 13.3 End-to-end smoke on the live site.
      **Accept:** visit `www.{base_domain}` → view pricing (matches control-plane Plans) → submit a demo
      request (Lead created + sales notified) → subscribe + confirm newsletter → start a trial (Signup
      Application created with attribution, routed into signup). All steps pass.
