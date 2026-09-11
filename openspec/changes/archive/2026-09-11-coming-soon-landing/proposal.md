## Why

The platform needs a public-facing "Coming Soon" teaser page while still in active development, allowing anonymous traffic to learn about Entertainment Express, see what features to expect across entertainment verticals, and join an early access / VIP waitlist. At the same time, developers, staff, and invited beta testers must be able to bypass the Coming Soon gate to test and use all marketing pages, portals, and backend workspaces.

## What Changes

- Add a "Coming Soon" landing page (`/coming-soon`) with brand styling, value propositions, "what to expect" feature highlights, early access waitlist form, and beta tester passcode entry.
- Add Coming Soon configuration toggles in `Marketing Settings` (`coming_soon_mode`, `coming_soon_headline`, `coming_soon_subhead`, `coming_soon_launch_date`, `beta_access_passcode`).
- Implement request boundary routing in `request_guards.py`: when `coming_soon_mode` is enabled, rewrite all public marketing routes (`/`, `/features`, `/pricing`, `/solutions`, etc.) to `/coming-soon` for unauthenticated visitors.
- Provide bypass mechanisms for developers (logged-in accounts: Administrator, System Manager, SaaS Operator, Staff, or EE Beta Tester) and invited beta testers (via a passcode query param `?beta_key=...` or unlock dialog that sets an `ee_beta_access` cookie).
- Expand marketing lead capture API to support `lead_type="waitlist"`.

## Capabilities

### Modified Capabilities
- `marketing-website`: Add requirement for configurable Coming Soon mode, public marketing route gating, early access waitlist lead capture, and developer/beta tester bypass.

## Impact

- `entertainment_express/security/request_guards.py`: Add `enforce_coming_soon` guard in before_request pipeline.
- `entertainment_express/hooks.py`: Register Coming Soon guard in `before_request`.
- `entertainment_express/control_plane/doctype/marketing_settings/marketing_settings.json`: Add coming soon and beta passcode fields.
- `entertainment_express/marketing/site_context.py`: Include coming soon settings in context.
- `entertainment_express/api/marketing.py`: Add `waitlist` lead type and `unlock_beta_access` endpoint.
- `entertainment_express/www/coming_soon.py` and `coming_soon.html`: New public coming soon page.
