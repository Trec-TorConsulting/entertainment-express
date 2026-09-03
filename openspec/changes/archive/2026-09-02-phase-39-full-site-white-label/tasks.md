# Tasks: Phase 39 — Full-Site White-Label & Style Matcher

> Traceability: `white-label`, `brand-style-matcher`, portals, `booking-availability`, `ui-design-system`, `notifications`, `tenant-website`, `marketing-website`, `multi-brand`.

## 1. Brand kit schema

- [x] 1.1 Extend `EE Portal Settings` with secondary/accent/bg/text colors, fonts, logo_dark, og_image, footer_text, `white_label_mode`; migrate hide_product_chrome → mode.
- [x] 1.2 Emit extended CSS variables from `www/branding.py` + portal bootstrap; add shared `ee-white-label.css`.

## 2. Full-site surfaces

- [x] 2.1 Replace hardcoded EE product copy on tenant public templates (home, book, catalog, sign, schedule, portal `base.html` footers) with kit fields when mode is `full`.
- [x] 2.2 Notification email wrapper uses logo/from-name/footer from kit; ensure control-plane/www pages do not load tenant kit.

## 3. Style matcher

- [x] 3.1 Implement `api/brand_style.py`: URL fetch with SSRF guards + rate limit; logo color sampling; map to curated fonts; return suggestion JSON (no HTML storage).
- [x] 3.2 Owner Brand UI: paste URL / upload logo → Match → preview home/book → Apply; extended kit editors.

## 4. Multi-brand + tests

- [x] 4.1 Brand host overrides company kit tokens for storefront chrome; primary domain keeps company kit.
- [x] 4.2 `tests/test_phase39_full_site_white_label.py`: SSRF deny; guest cannot match; apply writes settings; full mode hides EE on public template context; `openspec validate --specs` + smoke.
