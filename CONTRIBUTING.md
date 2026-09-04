# Contributing to Entertainment Express

Thanks for your interest. Please read this in full before opening an issue or PR.

## 🔒 Invitation-only project

Entertainment Express is **proprietary software** (see [`LICENSE`](LICENSE)). The
repository is public for **transparency and reference only**.

- **External pull requests are not accepted** and will be closed without merge.
- Code review and merge rights are limited to the maintainer,
  **@Trec-TorConsulting**, who is auto-requested on every PR via
  [`CODEOWNERS`](.github/CODEOWNERS).
- You are welcome to **open issues** (bug reports, feature ideas) and to
  **report security problems privately** — see [`SECURITY.md`](SECURITY.md).

The rest of this document is the working agreement for the maintainer and any
explicitly invited collaborators.

---

## Golden rules

These are non-negotiable and mirror [`openspec/project.md`](openspec/project.md),
which is the single source of truth:

1. **Multi-tenant isolation is sacred.** Never read or write across tenant sites
   from tenant code. Every cross-cutting change ships with an isolation test.
2. **Config-driven, not hard-coded.** The platform serves many entertainment
   verticals through one generic, configurable engine. Do not special-case a
   vertical in code.
3. **Mobile-first for the field.** Crew workflows must work on a phone and be
   offline-tolerant where practical.
4. **Secrets never touch the repo.** Configuration and credentials are supplied
   at deploy time via Kubernetes Secrets. Push protection is enabled.
5. **Tests are part of the change.** Each new DocType / controller / API gets at
   least a happy-path and a failure-path test under `tests/`.

---

## Spec-driven workflow (OpenSpec)

Non-trivial work is **proposed as a spec before it is implemented**, using
[OpenSpec](https://github.com/Fission-AI/OpenSpec). The lifecycle:

1. **Propose** — create a change under `openspec/changes/<slug>/` describing the
   what and why, the delta specs, and the task list.
2. **Apply** — implement the tasks on a feature branch.
3. **Archive / sync** — once shipped, archive the change and sync deltas into the
   main specs.

Antigravity / Gemini Agent Skills for each step live in [`.agents/skills/`](.agents/skills/)
(`openspec-propose`, `openspec-apply-change`, `openspec-explore`,
`openspec-archive-change`, `openspec-sync-specs`). Persistent workflow rules are
in [`GEMINI.md`](GEMINI.md) and [`.agents/rules/openspec-workflow.md`](.agents/rules/openspec-workflow.md).
If a spec and `openspec/project.md` disagree, the project file wins unless a
change proposal explicitly overrides it.

---

## Branches

Trunk-based development off `main`. Use short-lived, descriptively named branches:

| Prefix      | Use for                                  |
| ----------- | ---------------------------------------- |
| `change/`   | An OpenSpec change (`change/<slug>`)     |
| `feat/`     | A feature not large enough for a change  |
| `fix/`      | A bug fix                                |
| `chore/`    | Tooling, deps, housekeeping              |
| `docs/`     | Documentation only                       |
| `infra/`    | Deployment / Kubernetes / image changes  |

`main` is protected: **linear history**, no force-pushes, no deletions, and a
pull request is required. The maintainer may use an admin override to merge
(there is no second reviewer).

## Commits

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(optional scope): <summary>

<body — the "why">
```

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `build`,
`ci`, `revert`. Keep the summary imperative and under ~72 characters.

Examples:

```
feat(booking): add resource-hold expiry on the long queue
fix(control-plane): make tenant provisioning idempotent on retry
```

---

## Pull requests

1. Open the PR against `main`. The
   [PR template](.github/pull_request_template.md) is applied automatically.
2. **Verify locally** — GitHub Actions are intentionally **off**, so CI does not
   run. Complete the verification checklist yourself:
   - `bench --site <site> run-tests --app entertainment_express`
   - `python smoke_test.py`
   - Multi-tenant isolation check (no cross-site access)
   - `black` / `ruff` clean; touched `frontend/` apps build
3. Keep PRs focused and small; prefer squash or rebase merges (merge commits are
   disabled to preserve linear history). The head branch is auto-deleted on
   merge.

---

## Local development

Standard Frappe **bench** workflow:

```bash
# Get the app onto a bench and install on a site
bench get-app entertainment_express <path-or-url>
bench --site <site> install-app entertainment_express
bench --site <site> migrate

# Run the app's tests
bench --site <site> run-tests --app entertainment_express
```

Client apps live under `frontend/` (`crew-app`, `customer-portal`,
`dispatch-portal`), each with its own `package.json`.

---

## Code of conduct

Participation is governed by our
[Code of Conduct](CODE_OF_CONDUCT.md). Be respectful.
