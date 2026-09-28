## 1. Documentation Seed Data & Setup

- [x] 1.1 Create `entertainment_express/setup/documentation_seed.py` with comprehensive production-ready categories ("Getting Started", "Owner Operations & Inventory", "Field Crew Playbook", "Client Experience", "REST API & Webhooks") and rich Markdown/HTML user articles.
- [x] 1.2 Hook `documentation_seed.py` into `entertainment_express/hooks.py` under `after_migrate` so seed data runs cleanly.

## 2. WWW Documentation Routes & Templates

- [x] 2.1 Create `entertainment_express/www/docs/index.py` & `index.html` controller and view with modern hero, search bar (`Cmd+K`), role filters, category cards, and article list.
- [x] 2.2 Create `entertainment_express/www/docs/article.py` & `article.html` controller and view for rendering individual help articles with breadcrumbs, table of contents, copy code snippet, and helpfulness voting.
- [x] 2.3 Add website route rules for `/docs`, `/help`, `/docs/<path:article_slug>` in `hooks.py`.

## 3. Search & In-App Portal Integration

- [x] 3.1 Implement whitelisted search API `entertainment_express.api.docs.search_documentation` for fast JSON search responses with Redis caching.
- [x] 3.2 Add contextual doc links in `/owner`, `/employee`, and `/client` portal navigation header/footers.

## 4. Verification & Testing

- [x] 4.1 Create test suite in `entertainment_express/tests/test_documentation.py` verifying seed data creation, search API responses, public route resolution, and tenant isolation.
- [x] 4.2 Run Python smoke tests and unit tests to ensure zero regressions.
