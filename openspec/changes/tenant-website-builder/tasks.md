## 1. Backend & Data Layer

- [x] 1.1 Add website configuration fields to `EE Portal Settings` (`hero_headline`, `hero_subtitle`, `hero_image`, `hero_cta_text`, `hero_cta_url`, `show_packages`, `show_reviews`, `show_contact`, `value_props_json`)
- [x] 1.2 Implement `entertainment_express/api/portal_website.py` with `get_website_config` and `save_website_config` endpoints
- [x] 1.3 Update `entertainment_express/www/tenant_home.py` to query website settings, active packages, and detect authenticated owners

## 2. Public Tenant Landing Page (`tenant_home.html`)

- [x] 2.1 Refactor `tenant_home.html` with a modern hero banner, custom headline, subhead, and branded buttons
- [x] 2.2 Add responsive Featured Packages grid displaying public packages, pricing, and book links
- [x] 2.3 Add Trust Badges, Customer Reviews highlight, and Quick Quote inquiry section
- [x] 2.4 Implement dismissible Owner Quick-Start Guide banner at the top of the homepage for logged-in owners

## 3. Owner Portal Website Builder (`/owner/website`)

- [x] 3.1 Create `frontend/owner-portal/src/app/routes/website/WebsitePage.tsx` using `@portal-kit` components and "Today" page styling
- [x] 3.2 Implement Homepage Sections editor (Hero messaging, image URL, section visibility toggles)
- [x] 3.3 Implement Custom Pages manager (`/p/<route>`) with page creation, publish status, and edit modal
- [x] 3.4 Implement Embed Snippet manager with instant copy and key rotation
- [x] 3.5 Wire the `/website` route in `frontend/owner-portal/src/app/App.tsx`

## 4. Verification & Testing

- [x] 4.1 Update static marketing tests and smoke test to validate `tenant_home` rendering and new endpoints
- [x] 4.2 Run `npm run build` in `frontend/owner-portal` to verify TypeScript and bundle generation
- [x] 4.3 Execute `python3 smoke_test.py` and verify all tests pass
