## Context

Phase 38 delivered portal SPA branding, hide-product flag, favicon, email from-name, and custom domains. Gaps remain on public tenant pages (`/book`, tenant home, catalog), shared footers, and setup friction (manual hex picking). Competitors win demos when the book site looks like the operator’s existing website on day one.

## Goals / Non-Goals

**Goals:**
- One white-label kit drives every customer-facing tenant surface.
- Owner can match an existing company website/logo with minimal manual work.
- Preview before apply; reversible.

**Non-Goals:**
- EE SaaS `www` / pricing / legal product marketing.
- Operator Desk product IA rename.
- Pixel-perfect clone of arbitrary third-party sites.
- Crawling sites that require login or block bots beyond a single public GET.

## Decisions

### D1 — Expand `EE Portal Settings` brand kit

| Field | Purpose |
|-------|---------|
| existing name/logo/color/favicon/hide/email_from/primary_domain | keep |
| `brand_color_secondary`, `brand_color_accent` | secondary tokens |
| `brand_color_bg`, `brand_color_text` | page atmosphere |
| `font_heading`, `font_body` | Select of curated Google/system stacks OR Attach font |
| `logo_dark` | optional for dark rails |
| `og_image` | social share |
| `footer_text` | copyright / tagline replacing EE footer |
| `white_label_mode` | `off` \| `portals` \| `full` (default after migrate: `full` if hide was on else `portals`) |

`white_label_mode=full` applies kit + hide product marks on all tenant public + portal surfaces.

### D2 — Single injection point

`www/branding.update_website_context` + portal bootstrap emit CSS variables:

```css
:root {
  --ee-brand: …;
  --ee-brand-2: …;
  --ee-accent: …;
  --ee-bg: …;
  --ee-text: …;
  --ee-font: …;
  --ee-font-display: …;
}
```

Public templates (`tenant_home`, `catalog`, book/sign/schedule, portal `base.html`) stop hardcoding “Entertainment Express”; use `brand_html` / `footer_text`. Marketing control-plane pages skip tenant kit (site is admin/www).

### D3 — Brand style matcher

Owner supplies:
1. **Website URL** (https) and/or
2. **Logo upload** (already attached or new file)

Pipeline (`api/brand_style.py`):
1. Validate URL host not private/link-local; rate-limit per site (e.g. 10/hour).
2. GET HTML (timeout 8s, size cap); parse `<link rel=icon>`, og:image, theme-color, inline/linked CSS color declarations (top N hex/rgb).
3. From logo image: sample dominant hues (simple histogram / PIL if available; else CSS-only path).
4. Map fonts from CSS `font-family` to nearest curated stack.
5. Return suggestion payload `{colors, fonts, logo_url, favicon_url, confidence}` — **no raw HTML stored**.
6. Owner preview → `apply_brand_suggestion` writes Portal Settings.

Alternatives: third-party Brandfetch API (optional later BYO key); rejected as required dependency for v1.

### D4 — Preview

`/owner/brand` shows iframe/preview of `/` and `/book` with draft kit query `?ee_brand_preview=1` (owner-session only) so apply is deliberate.

### D5 — Files

| Area | Path |
|------|------|
| Settings JSON | `ee_portal_settings.json` |
| Matcher API | `api/brand_style.py` |
| CSS inject | `www/branding.py`, `public/css/ee-white-label.css` |
| Public pages | `tenant_home*`, catalog/book templates, `templates/portal/base.html` |
| Owner UI | Brand workspace matcher + preview |
| Tests | `tests/test_phase39_full_site_white_label.py` |

## Risks / Trade-offs

- [Site fetch blocked / wrong colors] → Show confidence + manual override; never auto-apply without owner click.
- [SSR F / private IP SSRF] → Deny private ranges, require https, redirect limit.
- [Font licensing] → Curated stacks only for URL import; uploaded fonts are tenant’s responsibility (disclaimer in UI).

## Migration Plan

1. Add fields; map `hide_product_chrome=1` → `white_label_mode=full`.
2. Replace hardcoded EE strings on tenant public templates.
3. Ship matcher behind owner role.
4. Rollback: set mode to `portals` or `off`.

## Open Questions

- Whether uploaded custom fonts need a separate object-storage path vs File attach (prefer File attach).
