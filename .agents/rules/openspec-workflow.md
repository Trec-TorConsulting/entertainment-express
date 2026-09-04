# OpenSpec Workflow for Antigravity & Gemini AI

Entertainment Express uses [OpenSpec](https://github.com/Fission-AI/OpenSpec) for spec-first development. Antigravity skills in `.agents/skills/` and `.agent/skills/` drive each workflow step.

## Before Implementing

1. Read `openspec/project.md` and `openspec/config.yaml`.
2. Read the relevant baseline spec in `openspec/specs/<capability>/spec.md`.
3. Check `openspec/changes/ROADMAP.md` for phase order — do not skip ahead.
4. For non-trivial work, use the **openspec-propose** skill first, then **openspec-apply-change**.

## Workflow Commands (Natural Language & Slash Commands)

| Intent | Say this | Slash Command |
|--------|----------|---------------|
| Propose a change | "Propose an OpenSpec change for …" | `/opsx:propose` |
| Implement tasks | "Apply the `<change-name>` OpenSpec change" | `/opsx:apply` |
| Explore / plan | "OpenSpec explore mode — help me think through …" | `/opsx:explore` |
| Archive when done | "Archive the `<change-name>` OpenSpec change" | `/opsx:archive` |
| Sync delta specs | "Sync delta specs from `<change-name>` to main specs" | `/opsx:sync` |

## CLI Reference

```bash
openspec list
openspec status --change <name> --json
openspec instructions apply --change <name> --json
openspec validate --specs
```

## Implementation Rules

- Work one task at a time; check off in `tasks.md` (`- [ ]` → `- [x]`) as you go.
- If `openspec/project.md` and a spec disagree, **project.md wins** unless a change proposal explicitly overrides it.
- Validate with `openspec validate --specs` (not per-change validate — "no deltas" is expected).
- Run `bench --site <site> run-tests --app entertainment_express` and `python smoke_test.py` before opening a PR.
- Multi-tenant isolation is sacred — every cross-cutting change needs an isolation test.
- Secrets never touch the repo.
