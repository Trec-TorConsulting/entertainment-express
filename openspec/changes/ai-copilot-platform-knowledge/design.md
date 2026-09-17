## Context

The AI Owner Copilot (`/assistant`) uses Ollama / LLM API calls in `entertainment_express/api/ai.py`. To make the AI assistant fully aware of all platform features and setup procedures, we need to extend the prompt builder with structured system knowledge and vertical best practices.

## Goals / Non-Goals

**Goals:**
- Provide comprehensive system knowledge (routes, features, setup guides) to the AI LLM prompt.
- Offer vertical-specific package and pricing recommendations.
- Render clickable route action buttons in the React Assistant UI.

**Non-Goals:**
- Allowing AI to execute destructive database changes without explicit user confirmation.

## Decisions

- **System Knowledge Injection**: Implement `_platform_knowledge_context()` in `entertainment_express/api/ai.py` that appends route maps, feature guides, and vertical templates into `ask()`.
- **Frontend Action Buttons**: Update `AssistantPage.tsx` to detect route markers (e.g. `[Go to Connections](/connections)`) and render interactive primary navigation pills.

## Risks / Trade-offs

- [Risk] Larger system prompt could increase token context size → [Mitigation] Keep knowledge map concise and structured with bulleted route tables.
