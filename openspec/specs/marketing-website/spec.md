# Capability: SaaS Marketing Website

## Purpose
The public **marketing website** for the Entertainment Express product itself — the front door that sells EE
to prospective **tenants** (mobile-entertainment companies). It runs at `www.{base_domain}` and the apex
`{base_domain}`, is served by the **control-plane site** (`admin.{base_domain}`), and is entirely
**Guest-facing** (no login required to view).

Its job is to **attract, convince, and convert** visitors into signed-up tenants: explain the product,
show pricing that matches the control-plane `Plan` records, capture demo/contact/newsletter leads, and hand
qualified visitors into the control-plane **signup + provisioning** flow (delivered in `saas-control-plane`
/ `platform-multitenancy`).

> This is NOT a tenant's booking site and NOT the customer portal. Those are per-tenant and defined in
> `booking-availability` and `customer-portal`. This capability is the **single, shared** website that
> markets the SaaS to new customers.

### Boundaries (what this capability does and does not own)
- **Owns:** public marketing pages + blog, the pricing page (reads `Plan`), public lead-capture forms,
  newsletter opt-in, SEO assets (sitemap/robots/meta/structured data), analytics + cookie consent, and the
  CTA handoff into control-plane signup.
- **Does NOT own:** the signup/provisioning flow itself (`saas-control-plane`, `platform-multitenancy`),
  subscription billing (`saas-control-plane`), tenant business features, or per-tenant booking sites
  (`booking-availability`). It links to those; it does not reimplement them.

### Data Model (control-plane site)
Reuse Frappe/ERPNext primitives wherever possible. Only `Marketing Settings` is a genuinely new EE DocType.

- **Lead** (reuse ERPNext **Lead**) + EE marketing Custom Fields: `ee_lead_type`
  (`demo|contact|newsletter|trial`), `ee_vertical_interest` (Small Text), `ee_source_page` (Data),
  `ee_utm_source`, `ee_utm_medium`, `ee_utm_campaign`, `ee_utm_term`, `ee_utm_content` (Data),
  `ee_referrer` (Data), `ee_consent_marketing` (Check), `ee_consent_at` (Datetime), `ee_spam_score` (Float).
- **Signup Application** (reuse from `saas-control-plane`) + attribution Custom Fields: `ee_utm_source`,
  `ee_utm_medium`, `ee_utm_campaign`, `ee_source_page`, `ee_origin_lead` (Link: Lead). Created by the
  marketing "Start free trial" CTA.
- **Web Page** (reuse Frappe **Web Page**): CMS-managed marketing pages (home content blocks, features,
  about, legal). Editable by marketing without a code deploy.
- **Blog Post / Blog Category** (reuse Frappe **Blog**): the resource center / articles.
- **Email Group + Email Group Member** (reuse Frappe): newsletter subscribers with double opt-in.
- **Website Route Redirect** (reuse Frappe **Website Settings** child): 301 redirects for changed slugs.
- **Marketing Settings** (NEW — Single DocType, Control Plane module): operator configuration — hero
  headline/subhead, primary/secondary CTA labels + targets, social links, `sales_notify_email`,
  `analytics_provider` (`none|plausible|umami|ga4`), `analytics_site_id`, `consent_banner_enabled`,
  `consent_banner_text`, `captcha_provider` (`none|hcaptcha|turnstile`), `captcha_site_key`, feature-section
  toggles, `base_domain`.
- **Plan** (reuse from `saas-control-plane`): source of truth the pricing page reads. Never hard-code prices.

## Requirements

### Requirement: Public Marketing Pages
The system SHALL serve a branded, responsive, accessible set of public marketing pages at `www.{base_domain}`
and the apex domain — at minimum: home/landing, product features, solutions-by-vertical, pricing, about,
contact, resources/blog, and legal (terms, privacy, cookies) — viewable without authentication.

#### Scenario: Guest views the marketing site
- **WHEN** an unauthenticated visitor opens `https://www.{base_domain}/`
- **THEN** the branded home page renders over TLS with navigation to features, pricing, resources, about, and
  contact, and with clear primary calls-to-action ("Start free trial" and "Request a demo")

#### Scenario: Content editable without code deploy
- **WHEN** a marketing operator edits a marketing page's copy (a Frappe Web Page) or publishes a Blog Post
- **THEN** the change appears on the live site without a code change or redeploy

#### Scenario: Accessible and responsive
- **WHEN** the site is viewed on a phone, tablet, and desktop, or navigated by keyboard/screen reader
- **THEN** layout adapts responsively and pages meet WCAG 2.1 AA basics (landmarks, alt text, focus order,
  color contrast)

### Requirement: Pricing Page Synced to Plans
The system SHALL render the pricing page from the control-plane `Plan` records (name, monthly/annual price,
currency, trial length, per-feature entitlements) with a monthly/annual toggle — never from hard-coded
prices — and each plan's CTA SHALL start signup for that plan.

#### Scenario: Pricing reflects control-plane plans
- **WHEN** the SaaS operator changes a `Plan`'s price or entitlements in the control plane
- **THEN** the public pricing page shows the updated price and feature list without a code change

#### Scenario: Monthly/annual toggle
- **WHEN** a visitor toggles between monthly and annual billing
- **THEN** each plan card shows the corresponding price (and any annual discount) from the `Plan` record

#### Scenario: Retired plans hidden
- **WHEN** a `Plan` is `retired`
- **THEN** it no longer appears on the public pricing page, but existing links do not error

### Requirement: Lead Capture & Routing
The system SHALL provide public forms (request a demo, contact sales, newsletter signup) that create a
control-plane **Lead**, capture UTM/referrer attribution and marketing consent, notify sales, and are
protected against spam and abuse.

#### Scenario: Demo request creates and routes a lead
- **WHEN** a visitor submits the "Request a demo" form with a valid email
- **THEN** a `Lead` is created with `ee_lead_type=demo`, captured UTM/referrer/source-page fields, and the
  `sales_notify_email` recipient is notified asynchronously

#### Scenario: Spam and rate-limit protection
- **WHEN** a bot fills the hidden honeypot field, or a client exceeds the public submission rate limit
- **THEN** the submission is rejected (or flagged `spam`) without creating a genuine lead or sending a
  notification, and no server error is exposed

#### Scenario: Newsletter double opt-in
- **WHEN** a visitor subscribes to the newsletter
- **THEN** they receive a confirmation email and are only added to the Email Group after confirming, with
  `ee_consent_marketing` and `ee_consent_at` recorded

### Requirement: Signup / Trial CTA Handoff
The system SHALL let a visitor start a free trial or signup for a chosen plan directly from the marketing
site, creating a control-plane **Signup Application** pre-filled with the selected plan and attribution, then
handing off to the `saas-control-plane` signup/provisioning flow.

#### Scenario: Start trial from a plan card
- **WHEN** a visitor clicks "Start free trial" on a plan card and submits company name + email + desired slug
- **THEN** a `Signup Application` is created referencing that plan with `ee_utm_*`/`ee_source_page`
  attribution and an `ee_origin_lead` link, and the visitor is routed into the control-plane signup flow

#### Scenario: Attribution preserved end to end
- **WHEN** a visitor arrives via a campaign URL carrying UTM parameters and later starts a trial
- **THEN** the UTM parameters captured on first visit are persisted onto the resulting `Signup Application`

### Requirement: SEO & Discoverability
The system SHALL make every public page search-engine discoverable: per-page title/meta description,
canonical URL, Open Graph/Twitter cards, JSON-LD structured data, a generated `sitemap.xml`, a `robots.txt`,
clean human-readable slugs, and 301 redirects for changed URLs.

#### Scenario: Page-level metadata
- **WHEN** a crawler or social preview fetches any marketing page
- **THEN** it receives a unique `<title>`, meta description, canonical link, and Open Graph/Twitter tags for
  that page

#### Scenario: Sitemap and robots reachable
- **WHEN** `https://www.{base_domain}/sitemap.xml` and `/robots.txt` are requested
- **THEN** both return HTTP 200; the sitemap lists all published, indexable marketing and blog pages and
  excludes drafts and non-public routes

#### Scenario: Redirect on changed slug
- **WHEN** a marketing page's slug changes and a Website Route Redirect is configured
- **THEN** the old URL returns a 301 to the new URL (no broken link, no soft-404)

### Requirement: Resource Center / Blog
The system SHALL provide a blog/resource center with categories/tags, author, publish/draft state, related
posts, and an RSS/Atom feed, using Frappe Blog.

#### Scenario: Publish an article
- **WHEN** a marketing operator publishes a Blog Post in a category
- **THEN** it appears in the resource index, is reachable at its slug, is included in the sitemap and RSS
  feed, and drafts remain hidden from the public

### Requirement: Analytics & Consent
The system SHALL support privacy-respecting analytics with conversion tracking (CTA clicks, form submits,
trial starts) and a cookie-consent mechanism that gates non-essential scripts until the visitor consents,
without leaking PII.

#### Scenario: Consent gates non-essential scripts
- **WHEN** consent banner is enabled and a visitor has not yet consented
- **THEN** non-essential/analytics scripts do not load or set cookies until the visitor accepts

#### Scenario: Conversion events tracked
- **WHEN** a visitor submits a demo form or starts a trial
- **THEN** the configured analytics provider records the corresponding conversion event without transmitting
  personally identifying form contents

### Requirement: Operator Configuration
The system SHALL let the SaaS operator configure marketing-site behavior (hero copy, CTA labels/targets,
social links, sales notification recipient, analytics provider/key, consent banner, captcha provider/key,
section toggles, base domain) via a single `Marketing Settings` record — without code changes.

#### Scenario: Change hero and CTA without deploy
- **WHEN** the operator updates the hero headline and primary CTA target in `Marketing Settings`
- **THEN** the live home page reflects the new copy and CTA on the next request

#### Scenario: Missing configuration degrades safely
- **WHEN** an optional integration (e.g., analytics or captcha) is left unset
- **THEN** the site still renders and forms still work, with that integration simply disabled

### Requirement: Performance, Security & Availability
The system SHALL serve the marketing site securely and quickly: TLS, security headers, cache-friendly static
assets, rate-limited/CSRF-protected public forms, escaped output, no secrets in source, and graceful
degradation — and it SHALL never read or write tenant-site data.

#### Scenario: Public forms are hardened
- **WHEN** any public marketing endpoint is called
- **THEN** input is validated and escaped, the endpoint is rate-limited, output encodes user data, and
  invalid input yields a safe error (no stack trace, no injection)

#### Scenario: Strict isolation from tenant data
- **WHEN** any marketing-site code executes
- **THEN** it operates only on the control-plane site and never queries or mutates any tenant site's database

#### Scenario: Degrades gracefully under dependency failure
- **WHEN** an optional dependency (analytics, captcha, or the pricing source) is temporarily unavailable
- **THEN** the page still renders, forms still submit where safe, and a neutral fallback is shown instead of
  an error page
