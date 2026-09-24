## 1. Backend AI Contract & Clause Drafting Engine

- [ ] 1.1 Implement `ai_generate_clause` in `entertainment_express/api/contract.py` supporting prompts for cancellation policies, equipment & weather terms, payment schedules, and legalese simplification.

## 2. Frontend Contract Studio & WYSIWYG Editor

- [ ] 2.1 Build WYSIWYG visual formatting toolbar (Headings, Bold, Italic, Underline, Lists, Alignments, Callout Box, Horizontal Rule, Presets) in `ContractTemplateModal.tsx` and `ContractModal.tsx`.
- [ ] 2.2 Add interactive, categorized variable placeholder chips (Client, Company, Event, Financials) to insert tags into active editor position.
- [ ] 2.3 Add AI Legal Clause Copilot modal / action bar in contract modals to generate and polish custom contract clauses in real-time.
- [ ] 2.4 Add visual Live Document Preview mode with real-time Jinja sample data interpolation.

## 3. Verification & Deployment

- [ ] 3.1 Verify frontend Vite build (`npm run build` in `frontend/owner-portal`).
- [ ] 3.2 Run `python3 smoke_test.py` to ensure 28/28 smoke test suites pass cleanly.
- [ ] 3.3 Execute `./scripts/build-push-bench.sh 0.1.28-ee` and promote to K3S cluster with `./entertainment-express/scripts/promote-image.sh 0.1.28-ee --apply`.
