# Tasks: Phase 11 — AI Assistant & Intelligence

> Deterministic suggestions on this site; LLM is optional prose. No silent money/send/assign. No cross-site connect.

## 1. Schema and provider

- [x] 1.1 DocTypes `EE AI Settings` (Single) and `EE AI Call` (append-only); custom field `Lead.ee_lead_score`; seed Plan `ai_assistant` (Starter 0, Pro/Enterprise 1).
      **Accept:** Settings has provider ollama|openai|gemini and Password keys; Call has no raw prompt field.

- [x] 1.2 `ai/llm.py` `complete()` — Ollama default, optional OpenAI/Gemini BYO; timeout; never raise; never log keys.
      **Accept:** unreachable backend returns `None`.

## 2. API

- [x] 2.1 `api/ai.py`: `status`, `ask`, `suggest_quote`, `forecast`, `suggest_dispatch`, `draft_campaign`, `score_lead`, `save_settings`. Guests 403; crew 403 on `ask`; no `tenant`/`site` args; `ee_ai_assistant=0` 403; money via `flt`+`fmt_money`.
      **Accept:** LLM down still returns quote/forecast/dispatch payloads with `available: false` and `AI suggestion unavailable`. Source has no `frappe.connect`/`frappe.init`.

- [x] 2.2 `confirm(kind, payload)` for `apply_quote` / `send_reply` / `offer_crew` only; Lead insert enqueues `score_lead`. `ask`/`suggest_*`/`draft_campaign` do not insert quotations, invoices, contracts, assignments, or send campaigns.
      **Accept:** guest 403 on confirm; apply_quote uses existing proposal save.

## 3. Portal and cluster

- [x] 3.1 Owner `/owner/assistant`; Today forecast strip; Proposal “Suggest a package”; Grow “Draft this campaign”; pipeline shows lead score. Rebuild `public/owner/`.
      **Accept:** no `/app`; no DocType names in copy; EmptyState when degraded.

- [x] 3.2 Employee Dispatch “Suggest crew” (ranked list; apply uses existing assign). Rebuild `public/employee/` if that SPA is touched.
      **Accept:** crew cannot call `ask`; apply does not happen from the LLM path.

- [x] 3.3 Ollama Deployment+Service+PVC on node05 (`gpu-only` toleration, `runtimeClassName: nvidia`). Frappe pods still NotIn node05. Common config `ee_ollama_url`.
      **Accept:** Ollama spec targets node05; python affinity unchanged.

## 4. Ship

- [x] 4.1 `tests/test_phase11_ai_assistant.py`; patch `v0_0_3.phase11_ai_assistant`; bump `0.0.67-ee` → `0.0.68-ee`.
      **Accept:** py_compile; guests 403; isolation (no connect); degrade copy; migrate after image roll.
