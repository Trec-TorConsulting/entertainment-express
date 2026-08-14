# Tasks: Phase 24 — Owner UI (`/owner`)

> Prereq: phase-21 tokens merged.

## 1. Cockpit UI
- [x] 1.1 Nav: Overview, Approvals, Money, Team, Catalog, Settings.
      **Accept:** all six exist; money is API strings via Money component.
- [x] 1.2 Restyle Overview + Approvals queue with tokens.
      **Accept:** pending count on Overview; approve/reject still hits existing APIs.

## 2. Validate
- [x] 2.1 Owner cannot grant System Manager (existing test). Employee denied `/owner`.
- [x] 2.2 Rebuild `public/owner/` + bench image; `/owner` loads the shell.
      **Accept:** 200 for an owner session.
