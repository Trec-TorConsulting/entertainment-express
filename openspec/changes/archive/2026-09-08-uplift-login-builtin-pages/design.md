## Context

Currently, visiting `https://www.entx.app/login#login` or any tenant login URL displays the default Frappe Desk authentication card. This default template lacks the modern design language established by the `www.entx.app` marketing refresh (Phase 41) and Portal Premium Experience (Phase 40). It uses outdated Bootstrap defaults, lacks polished dark mode support, and does not dynamically render tenant white-label brand assets (logos, custom colors, fonts, favicon, and product chrome suppression).

Built-in system utility routes—including `/update-password` and HTTP error pages (404 Not Found, 500 Server Error, 403 Forbidden)—suffer from the same inconsistency. Uplifting these templates ensures a unified, enterprise-grade look and feel across both the SaaS front door and tenant sites.

## Goals / Non-Goals

**Goals:**
- **Visual Uplift of `/login`**: Overhaul `/login` (supporting all hash views: `#login`, `#forgot`, `#signup`, `#email_otp`, `#totp`) to match `www.entx.app` visual aesthetics: Outfit and Inter typography, brand purple `#6d28d9` (or tenant brand color), glassmorphic card surface, sleek form inputs, password visibility toggle, accessible focus indicators, and smooth state transitions.
- **Visual Uplift of `/update-password`**: Match the authentication card styling with clear password strength guidelines, validation feedback, and accessible inputs.
- **Visual Uplift of System Pages**: Re-skin 404, 500, and 403 pages to provide clear diagnostic guidance and quick recovery navigation ("Back to Home", "Go to Dashboard", "Contact Support").
- **Dynamic White-Label Injection**: Ensure that on tenant sites (`{tenant}.entx.app` or custom domains), all built-in pages inherit the tenant's white-label kit (logo, brand colors, fonts, favicon, footer text, and chrome suppression per entitlements), while on base SaaS domains (`www.entx.app`, `admin.entx.app`, apex) they present official Entertainment Express branding.
- **Zero Disruption to Auth Mechanics**: Preserve Frappe's built-in authentication hooks, CSRF handling, session management, rate limiting, and client-side form event listeners (`login.js`).

**Non-Goals:**
- Modifying backend authentication logic, session lifecycles, or 2FA algorithms.
- Re-skinning internal Frappe Desk workspace pages (`/app/*`), which remain restricted to back-office operators.
- Modifying customer portal SPA routing (`/client/*`, `/employee/*`, `/owner/*`).

## Decisions

### Decision 1: Template Overrides via Frappe App Precedence
Frappe's template loader inspects app directories in order of installation. By placing `templates/pages/login.html`, `templates/includes/login/login.html`, `templates/pages/update_password.html`, and `templates/pages/404.html` in `entertainment_express/templates/`, Frappe automatically renders our custom templates without hacking core files.

*Alternatives Considered:*
- *Client-side DOM manipulation via JS*: Fragile, causes flash of unstyled content (FOUC), and poor accessibility.
- *Custom route redirects (e.g. `/custom-login`)*: Breaks deep links and standard Frappe redirects (`?redirect-to=...`).

### Decision 2: Preservation of Frappe Login JS Contract
Frappe's client-side login logic relies on specific DOM selectors (`#login_email`, `#login_password`, `form.form-signin`, `.btn-login`, `#forgot_email`, etc.). Our custom Jinja template retains these exact IDs, input attributes, and data attributes while wrapping them in modern semantic HTML and applying CSS classes. We add unobtrusive progressive enhancement scripts (such as eye-icon password reveal and floating labels).

*Alternatives Considered:*
- *Rewriting login JavaScript completely*: High maintenance burden and risks breaking Frappe version updates or 2FA flows.

### Decision 3: Tokenized Styling via `ee-auth.css` & `ee-system.css`
A dedicated stylesheet `public/css/ee-auth.css` is introduced and loaded on auth and system pages. It mirrors tokens from `portal-kit` and `marketing.css`:
- `--ee-brand`: `#6d28d9` (overridable by tenant white-label kit)
- `--ee-font-display`: `'Outfit', sans-serif`
- `--ee-font-body`: `'Inter', sans-serif`
- Glassmorphic backdrop blur and elevation tokens
- Dark mode support via `@media (prefers-color-scheme: dark)` and `[data-theme="dark"]`

### Decision 4: Context Enrichment in `update_website_context`
`entertainment_express.www.branding.update_website_context` is enhanced to ensure all auth and built-in system templates receive:
- `ee_brand_kit`: Resolved brand tokens, logos, colors, and fonts
- `hide_product_chrome`: Flag to suppress Frappe and EE branding on tenant sites
- `show_ee_badge`: Entitlement-driven badge flag
- Appropriate canonical base domain and favicon link

## Risks / Trade-offs

- **[Risk] Frappe core `login.js` DOM dependency breakages**
  → *Mitigation*: Strictly maintain all legacy input IDs, classes, and form structures required by Frappe's event delegation.
- **[Risk] Tenant logo contrast against glassmorphic card background**
  → *Mitigation*: Support light and dark logo variants with automatic contrast background fallbacks.
- **[Risk] Cache invalidation on template updates**
  → *Mitigation*: Append cache-busting version query strings (`?v=...`) to stylesheet references and flush website cache on migrate.
