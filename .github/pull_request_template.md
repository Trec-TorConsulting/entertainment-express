<!--
  Thanks for the change. Because GitHub Actions are intentionally disabled on
  this repository, verification is performed LOCALLY — please complete the
  checklist below before requesting review.
-->

## Summary

<!-- What does this PR do and why? One or two sentences. -->

## Related

- OpenSpec change: <!-- openspec/changes/<slug>  or "n/a" -->
- Closes: <!-- #issue  or "n/a" -->

## Type of change

- [ ] Feature
- [ ] Bug fix
- [ ] Refactor / tech debt
- [ ] Docs
- [ ] Deployment / infrastructure
- [ ] Chore

## Verification (run locally — CI is off)

- [ ] Frappe unit tests pass:
      `bench --site <site> run-tests --app entertainment_express`
- [ ] Smoke test passes against a test site: `python smoke_test.py`
- [ ] **Multi-tenant isolation** verified — no cross-site/tenant data access
- [ ] Happy-path **and** failure-path tests added/updated for new
      doctypes / controllers / APIs
- [ ] Lint & format clean (`black`, `ruff`) for Python; app builds for any
      touched `frontend/` app
- [ ] `bench --site <site> migrate` runs cleanly on this branch's image
- [ ] Client-app changes tested on device/emulator (if `frontend/` touched)

## OpenSpec

- [ ] Spec/change proposal updated, and archived if the change is complete
      (`openspec/`), or this change is small enough to not need one

## Screenshots / notes

<!-- UI changes: before/after. Anything the reviewer should know. -->

## Reviewer

<!--
  Single-maintainer repo: @Trec-TorConsulting is auto-requested via CODEOWNERS
  and merges to protected `main` (linear history). External PRs are not accepted
  — see CONTRIBUTING.md.
-->
