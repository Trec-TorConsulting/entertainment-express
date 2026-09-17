## Why

The AI Owner Copilot (`/assistant` & `api/ai.py`) currently focuses on 7-day job schedules and historical quote pricing, but lacks deep system awareness of all Entertainment Express UI routes, feature capabilities, setup workflows, and vertical-specific business recommendations. Expanding the AI Copilot with comprehensive platform knowledge enables it to act as an all-in-one 24/7 expert guide and assistant for non-technical tenant owners.

## What Changes

- Add a **Comprehensive System Knowledge Prompt Engine** to `entertainment_express/api/ai.py` detailing all `/owner` navigation routes, feature capabilities, Stripe integration steps, contract workflows, and data import paths.
- Add vertical-specific knowledge bases (DJs, bounce houses/rentals, photo/360 booths, game trucks, casino/karaoke, performers) to guide owners with relevant package pricing, deposit recommendations, and contract clause suggestions.
- Enable direct route deep-linking suggestions in AI assistant responses (e.g. providing clickable links to `/connections`, `/catalog`, `/brand`, `/import`).

## Capabilities

### New Capabilities
- `ai-copilot-platform-knowledge`: System knowledge base, navigation route mapping, and vertical best practice guidance in the AI Owner Copilot.

### Modified Capabilities
- None

## Impact

- Backend: `entertainment_express/api/ai.py` prompt generation (`_facts_blob()` & system knowledge builder).
- Frontend: `frontend/owner-portal/src/app/routes/settings/AssistantPage.tsx` rendering Markdown links & route quick-action buttons in conversation messages.
