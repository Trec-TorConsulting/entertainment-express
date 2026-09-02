## Context
Build moat features after parity phases 27–36.

## Goals / Non-Goals
**Goals:** Eight differentiator capabilities with plan entitlements.
**Non-Goals:** Anonymous public vendor market; conference product.

## Decisions
### D1 — Entitlements
Gate behind Plan flags: `diff_copilot`, `diff_overflow`, `diff_paas`, etc.

### D2 — Overflow exchange
Control-plane mediated: Tenant A offers overflow job metadata (no PII until accept) to trusted Tenant B; both must opt in; audit log on control plane; fulfillment stays on accepting tenant's site after explicit claim + customer consent.

### D3 — Live Event Page
Public token page: timeline highlights, song vote, gallery link, safety rules — extends event-collaboration.

### D4 — Starter kits
JSON fixtures applied at bootstrap or from owner UI — not hard-coded vertical engines.

### D5 — Files
`api/differentiators.py`, control-plane overflow, docs www, tests `test_phase37_diff.py`.

## Migration

Fixtures + patches; feature-flag rollback where applicable.
