# Tasks: Phase 21 — Front Page UI

> **Status:** Delivered. Shared tokens live in `frontend/portal-kit` and `public/marketing/marketing.css`.
> Inner marketing chrome and tenant home branding shipped with later portal work. Checkboxes match ROADMAP.

> Do in order. Check only when **Accept** passes.

## 1. Visual system
- [x] 1.1 Expand `frontend/portal-kit/src/tokens.css` + `tailwind-preset.js` (type, space, focus, display font).
      **Accept:** README documents tokens; no second palette in marketing CSS.
- [x] 1.2 Mirror tokens into `public/marketing/marketing.css`.
      **Accept:** `--ee-brand` and type scale match portal-kit.

## 2. SaaS home
- [x] 2.1 Restyle `www/index.html` per design §C (nav, hero, how-it-works, features, pricing teaser, footer).
      **Accept:** 375px viewport, dual CTA, Plan teaser still from control-plane `Plan`.
- [x] 2.2 Align inner marketing chrome (nav/footer) on features/pricing/contact without full rewrite.
      **Accept:** those pages share the new nav/footer.

## 3. Tenant home
- [x] 3.1 Restyle `www/tenant_home.html` with scoped branding + book/quote CTAs.
      **Accept:** isolation — no control-plane copy/data on a tenant host.

## 4. Validate
- [x] 4.1 Manual pass: www + one tenant host on phone and desktop; reduced-motion.
      **Accept:** no horizontal scroll; primary CTA visible.
- [x] 4.2 Rebuild bench image and confirm `/` and tenant `/` serve new CSS.
      **Accept:** live ping + stylesheet 200.
