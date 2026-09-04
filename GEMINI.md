# Entertainment Express — Gemini & Antigravity Instructions

Entertainment Express uses [OpenSpec](https://github.com/Fission-AI/OpenSpec) for spec-first development, driven by Antigravity / Gemini AI skills in `.agent/skills/` and `.agents/skills/`.

---

## Golden Rules (Non-Negotiable)

1. **Multi-tenant isolation is sacred.** Never read or write across tenant sites from tenant code. Every cross-cutting change must ship with an isolation test.
2. **Config-driven, not hard-coded.** The platform serves diverse entertainment verticals (DJs, inflatables, photo booths, game trucks, casino/karaoke, performers) through **one generic configurable engine**. Never hard-code a vertical in code.
3. **Mobile-first for field crew.** Crew workflows must be optimized for phones and offline-tolerant where practical.
4. **Secrets never touch the repo.** Configuration and credentials are supplied at deploy time via Kubernetes Secrets.

---

## OpenSpec Workflow

### Before Implementing
1. Read `openspec/project.md` and `openspec/config.yaml`.
2. Read the relevant baseline spec in `openspec/specs/<capability>/spec.md`.
3. Check `openspec/changes/ROADMAP.md` for phase order — do not skip ahead.
4. For non-trivial work, use the **`openspec-propose`** skill first, then **`openspec-apply-change`**.

### Workflow Commands (Natural Language & Slash Commands)

| Intent | Say this | Slash Command |
|--------|----------|---------------|
| Propose a change | "Propose an OpenSpec change for …" | `/opsx:propose` |
| Implement tasks | "Apply the `<change-name>` OpenSpec change" | `/opsx:apply` |
| Explore / plan | "OpenSpec explore mode — help me think through …" | `/opsx:explore` |
| Archive when done | "Archive the `<change-name>` OpenSpec change" | `/opsx:archive` |
| Sync delta specs | "Sync delta specs from `<change-name>` to main specs" | `/opsx:sync` |

### OpenSpec CLI Reference

```bash
openspec list
openspec status --change <name> --json
openspec instructions apply --change <name> --json
openspec validate --specs
```

### Implementation Rules

- Work one task at a time; mark checkboxes in `tasks.md` (`- [ ]` → `- [x]`) as you go.
- If `openspec/project.md` and a spec disagree, **`openspec/project.md` wins** unless a change proposal explicitly overrides it.
- Validate with `openspec validate --specs` (baseline specs validation; "no deltas" on individual change validation is expected by design).
- Run `bench --site <site> run-tests --app entertainment_express` and `python smoke_test.py` before submitting changes.
