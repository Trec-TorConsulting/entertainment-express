# Design: Phase 21 — Front Page UI

> Prereq: phase-19 marketing site live; phase-20 portal-kit tokens exist.
> Read `openspec/project.md` §2–4, `marketing-website` spec, this change's proposal.

**Golden rules:** one brand; Frappe-native public pages (no React on www); tenant home never reads
another site; secrets stay in K8s.

---

## A. Surfaces

| Surface | Host | File | Audience |
|---------|------|------|----------|
| SaaS front page | `www` / apex / `admin` website | `app/www/index.html` | Prospective tenants |
| Tenant front page | `{slug}.app.{base_domain}` | `app/www/tenant_home.html` | End clients of that tenant |

Supporting marketing pages (features, pricing, contact) get **token alignment** only; full restyle of
every inner marketing page is a follow-up, not this phase's DoD. Home + tenant home must look finished.

## B. Visual system (`ui-design-system`)

Canonical tokens live in `frontend/portal-kit/src/tokens.css`. Marketing CSS
`public/marketing/marketing.css` **mirrors the same CSS variables** (copy or `@import` via a generated
snippet). Do not invent a second green.

Minimum token set: `--ee-bg`, `--ee-panel`, `--ee-text`, `--ee-muted`, `--ee-brand`, `--ee-danger`,
`--ee-success`, `--ee-radius`, `--ee-shadow`, plus `--ee-font-display`, `--ee-font-body`,
`--ee-space-*`, `--ee-max-width`.

Document in `frontend/portal-kit/README.md`: logo lockup, button hierarchy (primary/secondary/ghost),
focus rings (a11y), dark-section vs light-section rules.

## C. SaaS home composition

Jinja sections, content from `Marketing Settings` where fields exist:

1. Sticky nav: logo, Features, Pricing, Resources, Log in, primary CTA (Start trial).
2. Hero: headline, subhead, two CTAs, optional product still (no stock-photo clutter).
3. Logo/proof row (optional CMS; empty-state hidden if unset).
4. Three-up "how it works".
5. Feature grid (existing feature toggles).
6. Pricing teaser linking to `/pricing` (still reads `Plan`).
7. Final CTA band + footer (legal, social).

Responsive: one column <768px. `prefers-reduced-motion` disables decorative motion.

## D. Tenant home composition

Uses tenant branding from `EE Portal Settings` (logo, brand color CSS variable override **scoped to
the page**, never leaked cross-tenant). Sections: hero with book/quote CTA, services teaser, trust
line, contact. Guest-only; no Desk chrome.

## E. Build / deploy

No new Docker service. Ship CSS/JS via app `public/marketing/`. Bench image rebuild after assets
change. Isolation test: www templates do not call tenant DocTypes; tenant_home does not call
control-plane DocTypes.
