---
name: openspec-propose
description: Propose a new OpenSpec change with proposal, design, and tasks artifacts. Use when the user wants to describe what to build and get a complete change ready for implementation.
---

Propose a new change — create the change and generate all artifacts in one step.

Creates:
- `proposal.md` (what & why)
- `design.md` (how)
- `tasks.md` (implementation steps)

When ready to implement, ask the agent to apply the change (openspec-apply-change skill).

**Store selection:** If the user names a store or the work lives in one, run `openspec store list --json` to discover registered store ids, then pass `--store <id>` on commands that read or write specs and changes. Without a store, commands act on the nearest local `openspec/` root.

**Input**: Change name (kebab-case) OR a description of what to build.

**Steps**

1. **If no clear input provided, ask what they want to build**

   Ask: "What change do you want to work on? Describe what you want to build or fix."

   Derive a kebab-case name (e.g., "add user authentication" → `add-user-auth`).

   Do NOT proceed without understanding what the user wants to build.

2. **Create the change directory**
   ```bash
   openspec new change "<name>"
   ```

3. **Get the artifact build order**
   ```bash
   openspec status --change "<name>" --json
   ```
   Parse: `applyRequires`, `artifacts`, `planningHome`, `changeRoot`, `artifactPaths`, `actionContext`.

4. **Create artifacts in sequence until apply-ready**

   Loop through artifacts in dependency order:

   a. For each artifact that is `ready`:
      ```bash
      openspec instructions <artifact-id> --change "<name>" --json
      ```
      Read dependency files, create artifact at `resolvedOutputPath` using `template`.

   b. Re-run status after each artifact until all `applyRequires` artifacts are `done`.

   c. If unclear, ask the user before continuing.

5. **Show final status**
   ```bash
   openspec status --change "<name>"
   ```

**Output**

Summarize change name, location, artifacts created, and: "Ready for implementation — ask me to apply `<name>`."

**Guardrails**
- Create ALL artifacts needed per schema `apply.requires`
- Read dependency artifacts before creating new ones
- If a change with that name exists, ask to continue or create new
- Do NOT copy `<context>` or `<rules>` blocks into artifact files
