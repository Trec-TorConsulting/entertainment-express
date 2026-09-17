## Why

Non-technical tenant owners (such as DJs, bounce house rental operators, photo booth hosts, and performers) require a simple, intuitive, and engaging onboarding experience to configure their business operations without navigating complex backend menus. A gamified "Launchpad" checklist inside the `/owner` portal will guide owners through essential setup milestones with progress tracking, celebratory rewards, and direct AI assistance.

## What Changes

- Add a **Gamified Launchpad Onboarding Widget** to the `/owner` portal (`TodayPage.tsx` and `/settings/launchpad`).
- Include 5 core launch quests:
  1. **Connect Payments**: Stripe Terminal & Billing setup (`/connections`).
  2. **Brand & Site**: Company logo, colors, and white-label domain (`/brand`).
  3. **Catalog & Gear**: Packages, add-ons, and equipment fleet (`/catalog` & `/gear`).
  4. **Contracts & Forms**: Deposit terms, contract templates, and questionnaires.
  5. **Import Data**: Self-service CSV/Excel customer and job import (`/import`).
- Implement real-time progress calculations (e.g. "80% Ready for Liftoff"), step completion tracking, and animated visual feedback.
- Add an interactive **"Ask AI for Examples"** button on each setup quest that opens the AI Copilot (`/assistant`) pre-filled with context-aware prompts.

## Capabilities

### New Capabilities
- `owner-onboarding-launchpad`: Gamified launchpad checklist with progress tracking and direct AI assistance in the tenant owner portal.

### Modified Capabilities
- None

## Impact

- Frontend: `frontend/owner-portal/src/app/routes/today/TodayPage.tsx`, new component `LaunchpadWidget.tsx`.
- Backend: API endpoint `/api/method/entertainment_express.api.portal_owner.get_onboarding_status` to compute completion status dynamically.
