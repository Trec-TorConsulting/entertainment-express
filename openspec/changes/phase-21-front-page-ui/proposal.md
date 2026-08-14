## Why

Phase 19 shipped a working marketing site and tenant landing, but they are functional, not designed.
The public front door is the first impression for **prospective tenants** (`www` / apex) and for **end
clients** hitting a tenant host. Those pages still look like a scaffold: they do not share a visual
language with the portals, and they do not yet compete with HoneyBook / Goodshuffle on polish.

This is the first of four **UI design phases** (21–24). It establishes the shared visual system and
redesigns the **Front Page** surfaces only. No new backend, no new namespace.

## What Changes

- Introduce a documented **EE visual system** (color, type, spacing, motion, photography rules) owned
  by `frontend/portal-kit` tokens **and** `public/marketing/` CSS so Frappe-native pages and SPAs share
  one brand.
- Redesign the **SaaS marketing home** (`www.{base_domain}` / apex): hero, proof, features, pricing
  teaser, CTAs, footer — still CMS-driven via `Marketing Settings` + Web Page blocks.
- Redesign the **tenant public front page** (`tenant_home.html` on `{slug}.app.{base_domain}`): branded
  landing that uses `EE Portal Settings` / tenant branding, with book/quote CTAs. Not a second product
  site.
- Keep the stack: Frappe Jinja + `public/marketing/` for public SEO pages. Do **not** convert the
  marketing site to React.
- Isolation unchanged: marketing reads only the control-plane site; tenant home reads only that tenant.

## Capabilities

### New Capabilities
- `ui-design-system`: shared tokens, type scale, component look (buttons, cards, nav, footer) consumed
  by marketing CSS and `frontend/portal-kit`. Phases 22–24 MUST use this system; they MUST NOT invent
  a second palette.

### Modified Capabilities
- `marketing-website`: add visual/UX requirements for the public home (hierarchy, trust, conversion
  layout, responsive, a11y) without changing lead-capture or Plan-as-source-of-truth behavior.

## Impact

- `app/www/index.html`, `app/www/tenant_home.html`, related partials, `public/marketing/marketing.css`
  (+ JS if needed).
- `frontend/portal-kit/src/tokens.css` and `tailwind-preset.js` become the canonical token source;
  marketing CSS imports or mirrors those tokens.
- Rebuild marketing static assets into the bench image; no new ingress hosts.
- **Depends on:** phase-19 (marketing site), phase-20 (portal-kit + portal settings).
- **Unblocks:** phase-22 `/client`, phase-23 `/employee`, phase-24 `/owner`.
