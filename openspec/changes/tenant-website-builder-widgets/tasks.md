## 1. Backend DocTypes & CMS Model

- [x] 1.1 Create `EE Tenant Page` DocType with `slug`, `title`, `blocks` JSON, `seo_title`, and `is_published` fields.
- [x] 1.2 Create `EE Embed Key` DocType with domain whitelist, rate limits, and allowed widget scopes.
- [x] 1.3 Add Frappe web route hook for `/p/<route>` routing to the dynamic tenant page renderer.

## 2. Server APIs & Security Validation

- [x] 2.1 Implement `entertainment_express.tenant_website.api.get_public_page` with public guest read access and Redis page caching.
- [x] 2.2 Implement `entertainment_express.tenant_website.api.save_page_blocks` with role guard (`EE Tenant Admin`).
- [x] 2.3 Implement `widget_availability_query` and `widget_submit_inquiry` with HTTP Origin/Referer verification against `EE Embed Key`.
- [x] 2.4 Add multi-tenant isolation unit tests confirming embed keys cannot read data across sites.

## 3. Visual Page Builder in Owner Portal

- [x] 3.1 Build `WebsiteBuilder.tsx` in `/owner/website` with drag-and-drop block ordering.
- [x] 3.2 Implement standard block components (`HeroBlock`, `CatalogGridBlock`, `AvailabilityCheckerBlock`, `FaqBlock`).
- [x] 3.3 Build `EmbedSnippetModal.tsx` displaying HTML code generator with custom theme options.

## 4. Standalone Embeddable JavaScript Runtime

- [x] 4.1 Create `packages/entx-widgets/src/index.ts` compiling to lightweight standalone `entx-widgets.js`.
- [x] 4.2 Implement Shadow DOM rendering for `[data-entx-widget="availability"]` and `[data-entx-widget="catalog"]` to avoid host CSS pollution.
- [x] 4.3 Add responsive mobile drawer checkout for embedded booking flows.

## 5. Automated Verification

- [x] 5.1 Add Cypress / Playwright E2E test verifying page block creation, publishing, and external iframe/widget embedding.
