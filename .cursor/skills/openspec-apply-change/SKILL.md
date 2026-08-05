---
name: openspec-apply-change
description: Implement tasks from an OpenSpec change. Use when the user wants to start implementing, continue implementation, or work through tasks.
---

Implement tasks from an OpenSpec change.

**Store selection:** If the user names a store, run `openspec store list --json` and pass `--store <id>` on read/write commands. Without a store, use the nearest local `openspec/` root.

**Input**: Optionally specify a change name. If omitted, infer from context or run `openspec list --json` and ask the user to select.

**Steps**

1. **Select the change** — announce "Using change: <name>" and how to pick a different one.

2. **Check status**
   ```bash
   openspec status --change "<name>" --json
   ```

3. **Get apply instructions**
   ```bash
   openspec instructions apply --change "<name>" --json
   ```
   Handle: `blocked` → suggest completing artifacts; `all_done` → suggest archive; else proceed.

4. **Read context files** from `contextFiles` in the CLI output (typically proposal, design, tasks for spec-driven schema).

5. **Show progress** — schema, N/M tasks complete, remaining overview.

6. **Implement tasks (loop until done or blocked)**
   - Make minimal, focused code changes
   - Mark complete: `- [ ]` → `- [x]` in tasks.md
   - Pause if unclear, design issue, error, or user interrupts

7. **On completion or pause** — show session summary and suggest archive if all done.

**Guardrails**
- Read context files before starting
- One task at a time; update checkbox immediately after each
- Pause on errors or unclear requirements — don't guess
- Use `contextFiles` from CLI output, don't assume file names
