## Why

Currently, when guests, clients, crew, and tenant owners visit the login page (`/login#login`) or other built-in platform pages (`/update-password`, 404, 500, 403), they encounter the default, unstyled Frappe Desk layout. This default UI lacks the design aesthetics of `www.entx.app` (Outfit and Inter typography, glassmorphism, refined color palettes, smooth transitions, mobile responsiveness) and fails to properly inherit tenant white-label branding on tenant domains. Uplifting these system pages brings visual parity to the base SaaS platform and allows all tenant sites to present a fully white-labeled authentication and error experience.

## What Changes

- **Uplifted Authentication Experience (`/login`)**: Redesign the Frappe `/login` page (including `#login`, `#forgot`, `#email_otp`, `#totp`, and `#signup` tabs) to match the visual language of `www.entx.app` with glassmorphic cards, Outfit/Inter typography, animated transitions, accessible input states, and password visibility toggles.
- **Uplifted Password Reset Flow (`/update-password`)**: Upgrade the `/update-password` page to match the auth design system with real-time password strength and requirement validation.
- **Uplifted System Error & Utility Pages**: Redesign built-in error pages (`/404` Page Not Found, `/500` Server Error, and `/403` / not permitted) with friendly recovery actions ("Back to Home", "Contact Support", "Portal Dashboard"), adhering to the same aesthetic.
- **Tenant White-Labeling for Built-In URLs**: Ensure that on tenant sites (`{tenant}.entx.app` and verified custom domains), all built-in pages dynamically inject the tenant's white-label kit (tenant brand name, logo, primary/accent colors, custom fonts, favicon, footer text, and product chrome suppression per plan entitlements). On SaaS base sites (`www.entx.app`, `admin.entx.app`, apex), the pages render with official Entertainment Express brand assets.
- **Dark Mode & Responsive Polish**: Ensure all built-in and auth templates support dark/light modes seamlessly with rich micro-animations and mobile-first ergonomics.

## Capabilities

### Modified Capabilities
- `white-label`: Extends tenant white-label kit injection (colors, logos, fonts, favicon, footer text, and product chrome suppression) across all built-in platform routes including `/login`, `/update-password`, and HTTP error pages (404, 500, 403).
- `ui-design-system`: Establishes system-wide auth and error page templates and tokenized styling matching the `www.entx.app` design system, with responsive layouts, accessible forms, and dark mode support.
- `identity-access`: Uplifts the user login (`#login`), password recovery (`#forgot`), two-factor challenge (`#totp`, `#email_otp`), and password update (`/update-password`) interfaces with modern ergonomics, inline validation, and tenant-aware session redirection.

## Impact

- **Backend / Hooks**: Register custom page templates and override web context in `entertainment_express/hooks.py` and `entertainment_express/www/branding.py` to ensure all built-in routes receive appropriate brand variables and stylesheets.
- **Templates**: Add custom overrides for `templates/pages/login.html`, `templates/includes/login/login.html` (or dedicated custom login route), `templates/pages/update_password.html`, and custom error templates for 404/500/403.
- **Assets / CSS**: Create `ee-auth.css` and `ee-system-pages.css` in `entertainment_express/public/css/` leveraging shared marketing and portal-kit design tokens.
- **Testing**: Add unit and static smoke tests verifying template overrides, white-label token substitution, product mark hiding, and responsive accessibility on built-in URLs.
