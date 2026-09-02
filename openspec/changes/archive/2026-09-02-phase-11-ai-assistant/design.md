## Context

Phases 1–10 store jobs, quotes, crew, campaigns, and reports per Frappe site. There is no LLM client, no Ollama workload, and Plan has no `ai_assistant` flag. Tenant code must never `frappe.connect` another site. Money in portals is backend `flt` + `fmt_money` only. Guests (`EE Event Guest` without `EE Customer`) are 403 on staff APIs.

## Goals / Non-Goals

**Goals:** pluggable LLM (Ollama default); degrade without failing the page; owner chat over this site; quote / forecast / dispatch suggestions; campaign draft; lead score; confirm-before-write for money/comms/assignments; Ollama on node05; Plan seed + `site_config.ee_ai_assistant`.

**Non-Goals:** auto-send campaigns, auto-assign crew, auto-submit quotes/invoices, RAG across tenants, Desk Copilot, vector DB, fine-tuning, ChatGPT plugins, metering Usage Record `ai_calls` (Phase 12).

## Decisions

1. **Hybrid intelligence.** Quote, forecast, dispatch, and lead score are **deterministic on this site’s MariaDB**. The LLM only writes prose (answer, why this package, campaign copy). If Ollama/OpenAI/Gemini is down, structured suggestions still return and `available` is false with **"AI suggestion unavailable"**.
   - Alternative: LLM-only tools — rejected; GPU outage would blank the product.

2. **Provider.** `entertainment_express/ai/llm.py` `complete(prompt, timeout=20)`:
   - Default: HTTP POST `{ee_ollama_url}/api/generate` (Ollama). URL from `frappe.conf.ee_ollama_url` else `http://ollama.entertainment-express.svc:11434`.
   - If **EE AI Settings**.provider is `openai` / `gemini` and a Password key is set, use that tenant’s key (BYO). Keys never log.
   - Catch-all: return `None`. Never raise to whitelist callers.
   - Alternative: LangChain — rejected; extra dep, harder to stub.

3. **Entitlement without crossing sites.** Tenant sites do **not** read control-plane `Plan`. Gate with `int(frappe.conf.get("ee_ai_assistant", 1))`. Missing key = on (existing tenants). Starter Plan seeds `ai_assistant=0`; Pro/Enterprise `1`. Provisioning (already Phase 1) can set site_config later; this phase also exposes the flag on **EE AI Settings**.enabled for the owner. `has_entitlement("ai_assistant")` only when a `Tenant` row exists on the **current** site (control plane). Never `frappe.init` another site.

4. **Confirm-before-write.** `ask` / `suggest_*` / `draft_campaign` / `forecast` are read-only (except `EE AI Call` audit + lead score). `confirm(kind, payload)` is the only mutation for:
   - `apply_quote` → existing `portal_proposal.save_proposal` (user already confirmed the draft lines)
   - `send_reply` → `notifications.send` (draft body only)
   - `offer_crew` → existing `dispatch.assign_crew`
   Silent writes of quotations, invoices, contracts, or campaign send are forbidden.

5. **Chat context.** `ask(message)` loads **only** rows the user can read: weekend `Event Booking` (event_name, date, unassigned flag — no customer PII dump), open quotes, at-risk count. Crew cannot call `ask`. Sales sees own inquiries if permission_query applies. Prompt includes site hostname, never another site’s name.

6. **Quote suggestions.** Similar jobs: same `event_type`, status in `confirmed|completed`, last 24 months, this site. Aggregate Item lines; price range min/median/max via `flt` then `fmt_money`. Return `{items, packages, range, why}`. `why` may be LLM or a static sentence.

7. **Forecast.** Next N months (default 3): count/sum of bookings with `event_date` in each month historically (same month last year + trailing 6) plus current pipeline quotes. Crew/asset need = round up from historical crew assignments per job. Money fields are strings.

8. **Dispatch rank.** For one booking: Active Employees with overlapping `ee_crew_roles` / role, not conflicted (reuse assign_crew SQL), optional geo distance from `venue_geo` vs employee geo if present. Score = availability + skill match + closer + lower `ee_pay_rate`. Return ranked list; do not create assignments.

9. **Lead score.** Heuristic 0–100: source, has email, has event date in notes, not spam (`ee_spam_score`). Optional LLM nudge ±10. Write `Lead.ee_lead_score`. `on_lead_insert` enqueue. Not a financial write.

10. **Schema**
    - **EE AI Settings** (Single): `enabled` Check, `provider` Select `ollama|openai|gemini`, `model` Data, `openai_key` Password, `gemini_key` Password.
    - **EE AI Call** (append-only): `user`, `kind` (ask|quote|forecast|dispatch|draft|score|confirm), `status` (ok|unavailable|denied), `prompt_hash`, `latency_ms`. No raw prompt/PII.
    - Custom field **Lead.ee_lead_score** Int.

11. **API** `entertainment_express.api.ai`: `status`, `ask`, `confirm`, `suggest_quote`, `forecast`, `suggest_dispatch`, `draft_campaign`, `score_lead`, `save_settings`. No `tenant`/`site` args. Guests 403. Crew 403 on `ask` / `save_settings` / owner forecast. Dispatcher may `suggest_dispatch`. Marketing may `draft_campaign`.

12. **UI.** Owner nav Business → **Assistant** (`/owner/assistant`). Today: forecast strip (EmptyState if degraded). Proposal: **Suggest a package**. Dispatch: **Suggest crew**. Grow: **Draft this campaign**. Pipeline lead list shows score if present. Copy never names DocTypes or `/app`.

13. **Ollama.** New Deployment+Service+PVC in `k8s-deployment.yaml`, **only** this workload: `nodeSelector kubernetes.io/hostname: node05`, toleration `gpu-only:NoSchedule`, `runtimeClassName: nvidia`. Image `ollama/ollama`. Port 11434. Model pull is **not** a blocking init (operator `kubectl exec -- ollama pull llama3.2`). Frappe pods keep excluding node05.

14. **Image** `0.0.67-ee` → `0.0.68-ee`.

## Risks / Trade-offs

- [GPU node down] → Features stay usable; copy says AI suggestion unavailable.
- [LLM hallucinates prices] → SPA displays only backend `fmt_money` from similar jobs, not LLM numbers. Strip currency-like tokens from LLM `why` if needed; never parse LLM text as amounts.
- [Prompt injection] → Tools are a fixed allow-list; `confirm` re-checks permissions and re-loads docs by name from this site.
- [Starter plan vs existing sites] → Default site_config on is intentional so e2esmoke works; operator can set `ee_ai_assistant: 0`.

## Migration Plan

Patch `v0_0_3.phase11_ai_assistant` → `create_all()` + ensure Singles. Seed Plans add `ai_assistant` only if missing. Apply k8s (Ollama + bench bump). Migrate sites. Rollback: set `enabled=0` / `ee_ai_assistant=0`; scale Ollama to 0; previous bench tag still serves without calling GPU.

## Open Questions

None blocking. Model name is operator-configurable; default `llama3.2`.
