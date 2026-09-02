## Why

Phases 1–10 give each tenant real jobs, quotes, dispatch, and reports, but owners still answer “who’s free this weekend?” and “what should we quote?” by hand. Local Ollama on node05 is unused. This phase puts a permissioned assistant and suggestions on `/owner` (and dispatch/grow) without Desk, without silent money writes, and without crossing site boundaries.

## What Changes

- Pluggable LLM: **Ollama by default** (cluster GPU on node05), optional OpenAI/Gemini via tenant keys on **EE AI Settings**. Unreachable backend never fails the surrounding workflow — APIs return `available: false` and copy **"AI suggestion unavailable"**.
- **Conversational assistant** at `/owner/assistant` over this site’s data only, scoped to the user’s roles. Draft quote / draft reply are previews; `confirm` is required before writes. No silent writes to money or contracts.
- **Smart quoting** from similar past jobs on this site (deterministic retrieval + optional LLM narrative). Amounts are `flt` + `fmt_money` strings. SPA never computes money.
- **Demand forecast** from this site’s history + pipeline (deterministic; LLM narrative optional).
- **Dispatch suggestions** ranked by availability / skill / proximity / cost for an unassigned job (deterministic; LLM narrative optional).
- **Campaign draft** for Grow (review before send). **Lead score** (`ee_lead_score` 0–100) on new/updated inquiries.
- **Guardrails:** guests 403; no `tenant`/`site` API args; no `frappe.connect` / `frappe.init` of another site; plan flag `ai_assistant` on site_config (never query the control-plane DB from tenant code); no DocType names in portal copy; no `/app` in owner/employee product flows.
- **Override:** no RAG over other tenants, no auto-send campaigns, no auto-assign crew, no auto-submit quotes/invoices, no ChatGPT-style browsing, no Desk AI.

## Capabilities

### New Capabilities

- (none) — `ai-assistant` already exists.

### Modified Capabilities

- `ai-assistant`: portal surfaces, Ollama Service, degrade JSON, confirm-before-write.
- `owner-portal`: Assistant workspace; Suggest on Proposal; forecast on Today.
- `employee-portal`: dispatcher Suggest on Dispatch (no company-wide chat for crew).
- `crm`: `ee_lead_score` on Lead.
- `identity-access`: guests cannot call AI APIs; crew cannot run owner assistant.
- `saas-control-plane`: Plan entitlement `ai_assistant` (Starter off; Pro/Enterprise on). Tenant sites read only `site_config.ee_ai_assistant`.
- `infrastructure-deployment`: Ollama Deployment+Service on node05 (`gpu-only` toleration). All other EE workloads still exclude node05.

## Impact

- Backend: `api/ai.py`, `ai/llm.py`; DocTypes `EE AI Settings`, `EE AI Call`; custom field `Lead.ee_lead_score`; `hooks.py` enqueue score; seed Plans.
- Frontend: owner `/assistant`, Proposal/Dispatch/Grow/Today hooks; rebuild `public/owner/` (and employee if Dispatch Suggest is in employee SPA).
- Cluster: Ollama on node05; bump bench `0.0.67-ee` → `0.0.68-ee`.
- Tests: `tests/test_phase11_ai_assistant.py`.
- Depends on: phases 1–10 data; node05 GPU + Ollama image. Features work without GPU (degraded).
