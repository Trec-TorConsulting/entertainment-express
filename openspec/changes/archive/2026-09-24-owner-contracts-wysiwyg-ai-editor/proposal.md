## Why

The current contract and agreement editor in `/owner/contracts` relies on raw HTML/Jinja textarea input without visual formatting tools or intelligent drafting support. Event owners need an intuitive, state-of-the-art visual editor (WYSIWYG), interactive variable placeholders, instant contract boilerplate presets, and AI Legal & Clause Drafting support to create and customize binding contracts effortlessly.

## What Changes

- **WYSIWYG Visual & Code Hybrid Editor**: Add a multi-mode editor interface in `ContractTemplateModal` and `ContractModal` featuring a Visual Rich Text Editor (WYSIWYG formatting toolbar for headings, bold/italics, bullet lists, numbered lists, alignment, and tables), a Raw HTML/Jinja Code mode, and a Live Document Preview tab.
- **Interactive Variable Chips**: Category-grouped, one-click placeholder insertion buttons (Client, Company, Event, Financials) that insert Jinja tags cleanly into the editor position.
- **Preset Boilerplate Contract Library**: Quick-apply dropdown for industry contract templates (DJ Performance Agreement, Inflatable Equipment & Weather Safety, Photo Booth & Media Release, Game Truck Party Policy, General Event Services).
- **AI Contract & Legal Clause Copilot**: Dedicated AI action toolbar / modal ("AI Assist") powered by backend `entertainment_express.api.contract.ai_generate_clause` that generates custom agreement clauses, polishes legalese, adds cancellation policies, and structures payment terms.

## Capabilities

### New Capabilities
- `contract-wysiwyg-ai-editor`: Rich visual editing, variable chip insertion, contract boilerplate library, and AI legal clause generation for owner contracts and templates.

### Modified Capabilities
- None.

## Impact

- `entertainment_express/api/contract.py`: Add `ai_generate_clause` API endpoint with whitelisted role checks.
- `frontend/owner-portal/src/app/routes/contracts/ContractTemplateModal.tsx`: Upgrade template editor with WYSIWYG formatting, variable chips, and AI legal assist.
- `frontend/owner-portal/src/app/routes/contracts/ContractModal.tsx`: Upgrade contract modal with WYSIWYG formatting, live sample preview, variable chips, and AI legal assist.
- `frontend/owner-portal/src/app/routes/contracts/ContractsPage.tsx`: Enhance UI header, contract controls, and quick preset actions.
