---
name: openspec-archive-change
description: Archive a completed OpenSpec change after implementation. Use when the user wants to finalize and archive a change.
---

Archive a completed change.

**Store selection:** Pass `--store <id>` when the user names a registered OpenSpec store.

**Input**: Optionally specify a change name. If omitted, run `openspec list --json` and ask the user to select. Do NOT auto-select.

**Steps**

1. **Prompt for change selection** if not provided.

2. **Check artifact completion**
   ```bash
   openspec status --change "<name>" --json
   ```
   Warn on incomplete artifacts; confirm before proceeding.

3. **Check task completion** in `tasks.md` — warn on incomplete tasks; confirm before proceeding.

4. **Assess delta spec sync**
   - If delta specs exist, compare with `openspec/specs/<capability>/spec.md`
   - Offer: sync now (recommended) or archive without syncing
   - If user chooses sync, use the openspec-sync-specs skill

5. **Perform archive**
   ```bash
   mkdir -p "<planningHome.changesDir>/archive"
   mv "<changeRoot>" "<planningHome.changesDir>/archive/YYYY-MM-DD-<name>"
   ```

6. **Display summary** — change name, schema, archive location, sync status.

**Guardrails**
- Always confirm on warnings
- Preserve `.openspec.yaml` (moves with directory)
- If delta specs exist, show sync summary before archiving
