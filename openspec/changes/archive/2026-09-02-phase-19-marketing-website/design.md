# Design: Phase 19 — SaaS Marketing Website & Lead Capture

> Prereq: **phase-1 complete.** Read `openspec/project.md` §3 (stack), §4 (multi-tenancy), §7 (Frappe
> conventions), §9 (security), and `openspec/specs/marketing-website/spec.md`. Reuse Frappe/ERPNext
> primitives. The site is **Guest-facing** and runs on the **control-plane site** — it MUST NOT touch any
> tenant site's database.
>
> **File-path convention:** all app paths below are relative to
> `entertainment_express/entertainment_express/` (the inner app package). All infra paths are relative to
> the `HomeLab-Redo/entertainment-express/` manifests folder (referred to as `HL/`).

---

## A. Architecture decision (read first)

**Decision: the marketing site is Frappe-native, served by the control-plane site.** No new frontend stack.

- **Why:** pricing must read control-plane `Plan` records and leads/signups must write control-plane
  DocTypes. Serving the site from the same site (`admin.{base_domain}`, with extra host names
  `www.{base_domain}` and apex `{base_domain}`) removes all cross-site calls, reuses Frappe Website
  rendering + `Web Page`/`Blog` CMS, and keeps one deployable. It also matches `project.md` §3 (public sites
  = Frappe web pages) and the "reuse, don't reinvent" principle.
- **Guest vs desk:** website pages are public (Guest read). The Frappe **Desk** on that site stays
  restricted to the SaaS Operator (already true on the control-plane site). Marketing operators edit
  `Web Page`/`Blog Post`/`Marketing Settings` in Desk; visitors only see the rendered website.
- **No SPA / no build step required.** Use plain server-rendered Jinja + a single hand-written CSS file and
  small vanilla JS, bundled by Frappe's asset pipeline under `public/marketing/`. This keeps it buildable by
  a lower-capability model. Do NOT introduce React/Vue/Tailwind-CLI here.

---

## B. Data model

### New DocType (only one)
**`Marketing Settings`** — Single, module **Control Plane**. Operator configuration read by every page.

| Fieldname | Type | Notes |
|-----------|------|-------|
| `base_domain` | Data | e.g. `entx.app`; used to build absolute URLs/canonicals |
| `hero_headline` | Data | home hero H1 |
| `hero_subhead` | Small Text | home hero subhead |
| `primary_cta_label` | Data | e.g. "Start free trial" |
| `primary_cta_target` | Data | route, e.g. `/pricing` |
| `secondary_cta_label` | Data | e.g. "Request a demo" |
| `secondary_cta_target` | Data | route, e.g. `/demo` |
| `sales_notify_email` | Data | recipient for lead notifications |
| `social_links` | Small Text (JSON) | `{ "x": "...", "linkedin": "..." }` |
| `section_feature_grid` | Check | toggle home sections |
| `section_pricing_teaser` | Check | toggle home sections |
| `section_testimonials` | Check | toggle home sections |
| `analytics_provider` | Select | `none|plausible|umami|ga4` |
| `analytics_site_id` | Data | provider site id / measurement id |
| `consent_banner_enabled` | Check | gate non-essential scripts |
| `consent_banner_text` | Small Text | banner copy |
| `captcha_provider` | Select | `none|hcaptcha|turnstile` |
| `captcha_site_key` | Data | public site key (secret verify key comes from K8s secret) |

### Reused DocTypes + Custom Fields (ship as fixtures)
- **Lead** (ERPNext): add `ee_lead_type` (Select: `demo|contact|newsletter|trial`), `ee_vertical_interest`
  (Small Text), `ee_source_page` (Data), `ee_utm_source`, `ee_utm_medium`, `ee_utm_campaign`, `ee_utm_term`,
  `ee_utm_content` (Data), `ee_referrer` (Data), `ee_consent_marketing` (Check), `ee_consent_at` (Datetime),
  `ee_spam_score` (Float). Reuse Lead `status` for `new|contacted|qualified|converted`; represent spam via a
  dedicated value or `ee_spam_score` threshold + a `spam` status option.
- **Signup Application** (from `saas-control-plane`, phase-1): add `ee_utm_source`, `ee_utm_medium`,
  `ee_utm_campaign`, `ee_source_page` (Data), `ee_origin_lead` (Link: Lead).
- **Web Page** (Frappe): CMS pages. Ensure `published=1` and (where indexable) included in sitemap.
- **Blog Post / Blog Category / Blogger** (Frappe): resource center.
- **Email Group** (`EE Newsletter`) + **Email Group Member** (Frappe): newsletter with double opt-in.
- **Website Route Redirect** (child of Website Settings): 301 redirects.

> Fixtures live in `fixtures/` and are exported in `hooks.py` (`fixtures = [...]`). Custom Fields ship via a
> fixture so `bench migrate` reproduces them. Do NOT edit ERPNext core DocType JSON.

---

## C. Routes & files (create these exactly)

Public web pages under `www/` (Frappe renders `www/<x>.html` at route `/<x>`; a matching `www/<x>.py`
provides a `get_context(context)`). Shared partials under `templates/marketing/`. Assets under
`public/marketing/`.

| Route | File(s) | Purpose |
|-------|---------|---------|
| `/` (home) | `www/index.html` + `www/index.py` | hero + feature grid + pricing teaser + social proof + CTAs; reads `Marketing Settings` |
| `/pricing` | `www/pricing.html` + `www/pricing.py` | renders active `Plan` records; monthly/annual toggle; per-plan CTA → `/start-trial?plan=<code>` |
| `/features` | `www/features.html` | product features (may embed a `Web Page` block) |
| `/solutions/<vertical>` | `www/solutions.html` + `www/solutions.py` | per-vertical page (djs, rentals, photo-booths, game-trucks, casino, performers) driven by a slug param |
| `/about` | `www/about.html` | about/company (CMS via Web Page allowed) |
| `/contact` | `www/contact.html` + `www/contact.py` | contact-sales form (posts to `api.marketing.submit_lead`) |
| `/demo` | `www/demo.html` + `www/demo.py` | request-a-demo form (posts to `api.marketing.submit_lead`) |
| `/start-trial` | `www/start_trial.html` + `www/start_trial.py` | trial form → `api.marketing.start_trial` → control-plane signup |
| `/resources` | Frappe Blog index (`/blog`) or `www/resources.html` linking to `/blog` | resource center index |
| `/legal/terms` `/legal/privacy` `/legal/cookies` | `www/legal/terms.html` etc. (CMS via Web Page allowed) | legal pages |
| `/robots.txt` | `www/robots.txt` (static) | crawler directives + sitemap URL |
| `/sitemap.xml` | Frappe built-in website sitemap | ensure enabled; pages set `include_in_sitemap` |

Shared partials (`templates/marketing/`): `base.html` (or extend Frappe `web.html`), `header.html`,
`footer.html`, `nav.html`, `cta.html`, `seo_head.html` (title/meta/canonical/OG/Twitter/JSON-LD),
`consent_banner.html`, `analytics.html`, `lead_form.html` (shared demo/contact form markup + honeypot +
captcha placeholder).

Assets (`public/marketing/`): `marketing.css` (single stylesheet), `marketing.js` (nav toggle,
pricing month/annual toggle, consent banner logic, form submit via fetch), `img/` (logo, hero, icons,
OG default image). Register bundles in `hooks.py` if using Frappe bundling, or include directly.

---

## D. Public API — `api/marketing.py`

All endpoints are `@frappe.whitelist(allow_guest=True)` and **rate-limited** (use `frappe.rate_limiter` or a
manual IP+window counter in Redis). Validate + escape all input. Never leak stack traces.

- `submit_lead(payload)` — payload: `lead_type` (`demo|contact|newsletter`), `email` (required, validated),
  `full_name`, `company`, `phone`, `message`, `vertical`, `source_page`, `utm` (dict), `referrer`,
  `honeypot` (must be empty), `captcha_token` (verified server-side if `captcha_provider != none`).
  - Reject if honeypot filled or rate limit exceeded or captcha invalid → return generic `{ ok: false }`
    (or a 429) **without** creating a lead.
  - Else create ERPNext **Lead** with `ee_lead_type`, UTM/referrer/source-page, consent, compute
    `ee_spam_score` (basic heuristics). Enqueue sales notification to `sales_notify_email`
    (`frappe.enqueue`, never inline). Return `{ ok: true }`.
- `subscribe_newsletter(email, source_page, utm, honeypot, captcha_token)` — create a **pending** Email Group
  Member and email a tokenized confirmation link (`/api/method/...confirm_subscription?token=`). Enqueue the
  email. Return `{ ok: true }` even if already subscribed (no enumeration).
- `confirm_subscription(token)` — validate token → mark member confirmed, set `ee_consent_marketing=1`,
  `ee_consent_at=now`. Idempotent.
- `get_pricing(billing="monthly")` — return active `Plan` records: `{ code, name, price_monthly,
  price_annual, currency, trial_days, features: [entitlements...], cta_target }`. Cacheable
  (short TTL). Used by `www/pricing.py` server-side; also callable by `marketing.js`.
- `start_trial(plan_code, company_name, email, requested_slug, utm, source_page, honeypot, captcha_token)` —
  validate slug (reuse phase-1 slug validation: DNS-safe, reserved list, uniqueness), spam checks, then
  create a control-plane **Signup Application** (reuse phase-1) with `plan=<from code>`, attribution custom
  fields, and `ee_origin_lead` (create/link a `trial` Lead). Return `{ ok: true, redirect: <signup URL> }`
  routing into the control-plane signup/provisioning flow. Do NOT provision here — hand off to phase-1/12.

> Money/plan note: `get_pricing` only *reads* `Plan`; it never computes billing. Prices come straight from
> the `Plan` record via `frappe.utils.flt` formatting — no float math.

---

## E. SEO implementation

- **Per-page meta:** every `www/*.py` `get_context` sets `context.title`, `context.meta_description`,
  `context.canonical` (absolute, from `base_domain`), and OG/Twitter fields consumed by
  `templates/marketing/seo_head.html`. Web Pages use their built-in meta fields.
- **Structured data (JSON-LD)** in `seo_head.html`: `Organization` (site-wide), `Product` +
  `Offer` list on `/pricing` (from Plans), `FAQPage` on any FAQ, `BlogPosting` on blog articles,
  `BreadcrumbList` where applicable.
- **Sitemap:** rely on Frappe's website sitemap; ensure marketing Web Pages and Blog Posts have
  `include_in_sitemap`/published set; exclude drafts and `/start-trial`, `/api/*`. Verify `/sitemap.xml`
  returns 200 and lists expected URLs.
- **robots.txt:** allow crawl of public pages, disallow `/app`, `/api`, `/private`; reference
  `Sitemap: https://www.{base_domain}/sitemap.xml`.
- **Redirects:** configure Website Route Redirect for any renamed slug (301). Verify no soft-404s.
- **Performance budget:** single CSS + small JS, compressed images, lazy-load below-the-fold images, cache
  headers on `public/marketing/*`. Target good Core Web Vitals (LCP < 2.5s on the home page over the
  cluster).

---

## F. Analytics & consent

- `templates/marketing/consent_banner.html` + logic in `marketing.js`: on first visit (no consent cookie)
  show the banner if `consent_banner_enabled`. Non-essential scripts (analytics) are injected **only after**
  Accept. Store consent in a first-party cookie; provide a "reject" that keeps analytics off.
- `templates/marketing/analytics.html`: render the provider snippet based on `analytics_provider` +
  `analytics_site_id`; no-op when `none`. Prefer cookieless providers (Plausible/Umami). For GA4, load only
  post-consent.
- **Conversion events:** fire `demo_submitted`, `contact_submitted`, `newsletter_subscribed`,
  `trial_started` via the provider's event API in `marketing.js` — send **no** PII (no email/name in event
  payloads).

---

## G. Security (apply project.md §9)

- Public endpoints `allow_guest=True` **and** rate-limited (per IP + per email window). Add a hidden
  **honeypot** field to every form; reject when filled. Optional **captcha** (hCaptcha/Turnstile) verified
  server-side using a secret verify key from K8s (never in repo).
- Escape/encode all user-supplied values on output (Jinja autoescape on). Parameterized queries only.
- Do not expose whether an email already exists (newsletter/lead) — always return generic success.
- Store no secrets in source. `captcha_secret`, analytics private keys (if any), and SMTP come from K8s
  secrets / site config.
- Reuse the shared Traefik `security-headers` middleware; ensure HSTS, X-Content-Type-Options, Referrer-
  Policy, and a Content-Security-Policy that permits only the configured analytics origin.
- **Isolation:** every code path runs on the control-plane site only. No `frappe.init(site=...)` into tenant
  sites, no cross-site queries. Add a test asserting this.

---

## H. APIs summary (whitelisted, under `api/marketing.py`)

| Method | Guest | Rate-limited | Writes | Returns |
|--------|-------|--------------|--------|---------|
| `submit_lead` | yes | yes | Lead | `{ok}` |
| `subscribe_newsletter` | yes | yes | Email Group Member (pending) | `{ok}` |
| `confirm_subscription` | yes | yes | Email Group Member (confirmed) | `{ok}` |
| `get_pricing` | yes | soft | — (read Plans) | plans[] |
| `start_trial` | yes | yes | Signup Application (+ Lead) | `{ok, redirect}` |

---

## I. Tests (`tests/`)

Write at least happy-path + one failure-path per endpoint, plus:
- **Lead capture:** valid demo submit creates a Lead with correct `ee_lead_type` + UTM and enqueues a
  notification; honeypot-filled submit creates **no** Lead; over-rate-limit submit is rejected.
- **Newsletter double opt-in:** subscribe creates pending member + confirmation email; confirm marks
  confirmed and sets consent; confirming twice is idempotent.
- **Pricing sync:** `get_pricing` returns exactly the active Plans; a retired Plan is absent; prices match
  the `Plan` records.
- **Trial handoff:** `start_trial` with a valid slug creates a Signup Application with attribution +
  `ee_origin_lead`; an invalid/reserved/duplicate slug is rejected before creating a Signup Application.
- **SEO:** `/robots.txt` and `/sitemap.xml` return 200; sitemap includes a published page and excludes a
  draft; a configured redirect returns 301.
- **Security/isolation:** a marketing endpoint never opens a tenant site; Desk remains inaccessible to Guest;
  output is escaped (XSS payload in `message` is not reflected raw).

---

## J. Deployment (`HL/entertainment-express/`)

- **Host names:** add `www.{base_domain}` and apex `{base_domain}` to the control-plane site
  (`bench --site admin.{base_domain} add-domain www.{base_domain}` or `host_name`/`domains`) and to the
  Traefik ingress (extend the existing IngressRoute/`ingress.yaml`; reuse wildcard TLS + shared middlewares
  redirect-https, gzip, security-headers).
- **Secrets (templates, placeholders only):** `captcha-secret.yaml` (`CAPTCHA_SECRET`) and, if a keyed
  analytics provider is used, `analytics-secret.yaml`. Pods read from the secret; nothing in repo.
- **Seed:** create/seed the `Marketing Settings` Single (`setup/seed_marketing_settings.py`) with sane
  defaults (analytics `none`, captcha `none`, consent banner on).
- **Validation:** `/`, `/pricing`, `/demo`, `/robots.txt`, `/sitemap.xml` reachable over TLS at
  `www.{base_domain}`; a test demo submission creates a Lead and notifies sales; a test trial start creates a
  Signup Application and routes to signup.
- **Node scheduling:** standard EE workloads only (exclude node05 per §8); no GPU. No new pods are strictly
  required (rides on the existing control-plane/frappe deployment) — only ingress + secrets + seed change.
