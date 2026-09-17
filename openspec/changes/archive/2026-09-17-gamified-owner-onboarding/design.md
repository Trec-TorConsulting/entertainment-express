## Context

Tenant owners in Entertainment Express need a guided setup path. Currently, third-party ERPNext onboarding guides are hidden (`onboarding.py`) to enforce white-label branding, but owners need a simple, gamified setup launchpad inside the React `/owner` portal.

## Goals / Non-Goals

**Goals:**
- Provide a clean, gamified launchpad widget in the `/owner` portal displaying 5 core setup quests with real-time completion status.
- Allow 1-click navigation to relevant setup pages (`/connections`, `/brand`, `/catalog`, `/import`, etc.).
- Integrate direct "Ask AI for Examples" actions connecting each quest to the AI Copilot (`/assistant`).

**Non-Goals:**
- Exposing raw Frappe Desk backend onboarding dialogs or third-party ERPNext branding.

## Decisions

- **Frontend Component Architecture**: Create `frontend/owner-portal/src/app/components/LaunchpadWidget.tsx` integrated into `TodayPage.tsx`.
- **Completion Check Logic**: Whitelisted backend API endpoint `get_onboarding_status()` in `entertainment_express.api.portal_owner` that queries Stripe setup status, catalog item counts, brand logo presence, contract templates, and customer counts.

## Risks / Trade-offs

- [Risk] Onboarding checks could slow down initial page loads → [Mitigation] Compute onboarding status asynchronously or cache results in local state.
