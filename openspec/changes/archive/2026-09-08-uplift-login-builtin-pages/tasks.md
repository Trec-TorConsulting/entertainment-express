## 1. Design Tokens & Styling Assets

- [x] 1.1 Create `entertainment_express/public/css/ee-auth.css` with glassmorphic cards, Outfit/Inter typography, focus rings, responsive layouts, and dark mode support
- [x] 1.2 Add progressive UI enhancements script `entertainment_express/public/js/ee-auth.js` for password visibility toggle, tab hash handling, and autofocus

## 2. White-Label Context & Hooks Integration

- [x] 2.1 Update `entertainment_express/entertainment_express/www/branding.py` to inject `ee-auth.css` and brand token variables into website context for `/login`, `/update-password`, and error pages
- [x] 2.2 Verify `hooks.py` website context and route configurations to ensure custom templates take precedence over Frappe core

## 3. Authentication & Password Reset Templates Uplift

- [x] 3.1 Create `entertainment_express/templates/pages/login.html` overriding Frappe login page with high-fidelity glassmorphic card matching `www.entx.app`
- [x] 3.2 Create `entertainment_express/templates/includes/login/login.html` supporting all tab states (`#login`, `#forgot`, `#signup`, `#email_otp`, `#totp`) retaining all Frappe DOM element IDs
- [x] 3.3 Create `entertainment_express/templates/pages/update_password.html` overriding password reset with matching aesthetics, requirement checklist, and inline strength validation

## 4. System Error & Utility Pages Uplift

- [x] 4.1 Create `entertainment_express/templates/pages/404.html` with modern styling, friendly messaging, and recovery navigation to home or portal
- [x] 4.2 Create `entertainment_express/templates/pages/500.html` and `403.html` error templates matching the visual system

## 5. Verification & Testing

- [x] 5.1 Add static and unit tests in `entertainment_express/entertainment_express/tests/test_login_white_label.py` verifying template resolution, white-label token substitution, and Frappe DOM ID integrity
- [x] 5.2 Add test cases to `smoke_test.py` and run full smoke test suite
