---
name: openspec-sync-specs
description: Sync delta specs from an OpenSpec change into main baseline specs. Use when updating main specs without archiving the change.
---

Sync delta specs from a change to main specs. Agent-driven — read delta specs and intelligently edit main specs.

**Store selection:** Pass `--store <id>` when the user names a registered OpenSpec store.

**Input**: Optionally specify a change name. If omitted, run `openspec list --json` and ask the user to select.

**Steps**

1. **Prompt for change selection** if not provided.

2. **Resolve change context**
   ```bash
   openspec status --change "<name>" --json
   ```

3. **Find delta specs** via `artifactPaths.specs.existingOutputPaths`. If none, stop.

4. **For each delta spec**, apply to `openspec/specs/<capability>/spec.md`:
   - **ADDED** — add requirement (or update if exists)
   - **MODIFIED** — merge partial updates; preserve unmentioned content
   - **REMOVED** — delete requirement block
   - **RENAMED** — rename FROM → TO
   - Create new main spec file if capability doesn't exist yet

5. **Show summary** — capabilities updated, requirements added/modified/removed/renamed.

**Guardrails**
- Read both delta and main specs before editing
- Preserve content not mentioned in delta
- Idempotent — running twice should give same result
