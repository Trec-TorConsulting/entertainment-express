## 1. Schema & Configuration

- [x] 1.1 Update `Marketing Settings` DocType JSON with coming soon fields (`coming_soon_mode`, `coming_soon_headline`, `coming_soon_subhead`, `coming_soon_launch_date`, `beta_access_passcode`)
- [x] 1.2 Update `get_marketing_settings()` in `site_context.py` to read and provide the new coming soon fields

## 2. Security Guard & Request Routing

- [x] 2.1 Implement `enforce_coming_soon()` in `request_guards.py` checking mode, role bypass, query param `?beta_key=`, and `ee_beta_access` cookie
- [x] 2.2 Register `enforce_coming_soon` in `before_request` hook in `hooks.py`
- [x] 2.3 Implement `unlock_beta_access` endpoint in `marketing.py` to validate passcode and set the `ee_beta_access` cookie

## 3. Marketing Lead API & Waitlist

- [x] 3.1 Allow `waitlist` in `ALLOWED_LEAD_TYPES` in `api/marketing.py`

## 4. Coming Soon Landing Page

- [x] 4.1 Create `entertainment_express/www/coming_soon.py` context provider
- [x] 4.2 Create `entertainment_express/www/coming_soon.html` template with teaser cards, waitlist signup form, beta unlock modal, and login link
- [x] 4.3 Add styling for coming soon page elements in `marketing.css`

## 5. Verification & Tests

- [x] 5.1 Add automated test `test_coming_soon_guard.py` verifying anonymous gating, role bypass, and beta key bypass
- [x] 5.2 Run `python smoke_test.py` to ensure all files compile and pass validation
