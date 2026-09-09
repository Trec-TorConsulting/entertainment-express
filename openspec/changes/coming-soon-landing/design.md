## Context

Entertainment Express is in active development on the SaaS control plane and tenant portals. Unauthenticated visitors visiting `entx.app` should not see half-finished or staging pages by accident, but should see an engaging Coming Soon announcement with value props and a VIP early-access/waitlist signup form. The developer and beta testers need transparent access to dev environments, preview routes, and portals.

## Goals / Non-Goals

**Goals:**
- Provide a clean, configurable switch in `Marketing Settings` (`coming_soon_mode`) and optional `site_config.json` override.
- Gate all public marketing routes (`/`, `/features`, `/pricing`, `/solutions`, `/blog`, `/demo`, etc.) for unauthenticated guests, redirecting/rewriting to `/coming-soon`.
- Allow seamless bypass for:
  - Logged-in internal users (Administrator, System Manager, SaaS Operator, EE roles).
  - Beta testers using a secret query parameter `?beta_key=...` or submitting the passcode via the on-page unlock dialog, which sets a cookie `ee_beta_access`.
- Provide an early-access waitlist form that creates a `Lead` record with `lead_type="waitlist"`.
- Support responsive, premium visual aesthetics matching `marketing-tokens.css`.

**Non-Goals:**
- Blocking backend API endpoints or assets needed by the app or login flow.
- Modifying tenant-specific booking or customer portals for established tenants (this specifically targets the public control-plane marketing site).

## Decisions

1. **Request Guard via `before_request` hook**:
   - *Rationale*: We hook into Frappe's `before_request` sequence in `request_guards.py` (after login lockout and tenant suspension checks).
   - *Alternative considered*: Handling it only inside Jinja page templates or `get_context`. *Rejected* because guests could still access other routes like `/pricing`, `/features`, `/blog`, etc. `before_request` guarantees uniform protection across all public routes.

2. **Dual-factor bypass (Session Role OR Passcode Cookie)**:
   - *Rationale*: Developers can simply log into Frappe (`/login`) and view the full site as normal. Beta testers can be given a link with `?beta_key=XYZ` or enter the code on the page, setting `ee_beta_access=XYZ` so they don't have to create a full Frappe user account just to evaluate the marketing pages.

3. **Lead doc integration with `lead_type="waitlist"`**:
   - *Rationale*: Reuses the existing ERPNext `Lead` doctype and `submit_lead` endpoint in `entertainment_express.api.marketing`, keeping CRM and notifications unified.

## Risks / Trade-offs

- [Risk] Aggressive path rewriting might block login or static assets.
  → *Mitigation*: Strictly whitelist `/login`, `/logout`, `/api/*`, `/assets/*`, `/files/*`, and `/coming-soon`.
- [Risk] Cache collision in Werkzeug when path rewriting is performed.
  → *Mitigation*: Use the existing `_rewrite_path()` helper in `request_guards.py` which properly resets Werkzeug request path caches.
