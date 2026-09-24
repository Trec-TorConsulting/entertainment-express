## Context

The current contract and agreement templates rely on raw text inputs and manual HTML/Jinja string editing. This change provides event owners with a visual contract editor (WYSIWYG formatting toolbar, live preview, variable chips, preset boilerplate contracts, and AI legal clause assistance).

## Goals / Non-Goals

**Goals:**
- Provide a WYSIWYG rich text editor with visual formatting controls (bold, italic, underline, headings, lists, alignment, horizontal lines, tables, callouts).
- Provide interactive variable placeholder chips that insert Jinja fields cleanly into the editor.
- Provide quick-insert boilerplate agreement presets for various entertainment verticals (DJs, inflatables, photo booths, game trucks, general event services).
- Provide AI Legal Clause Generation & Refinement endpoint `entertainment_express.api.contract.ai_generate_clause` for automated clause writing, legalese simplification, and deposit/cancellation policy formatting.

**Non-Goals:**
- Replacing third-party DocuSign integrations or PDF rendering engines.

## Decisions

- **WYSIWYG & HTML Sync**: Maintain bidirectional synchronization between Visual Rich Editor mode, Raw HTML/Jinja Code mode, and Live Document Preview mode.
- **AI Backend Endpoint**: Expose `ai_generate_clause` in `contract.py` using Frappe's AI integration or structured fallback legal template generators to ensure offline & online reliability.
- **Variable Chips**: Pre-configure client, company, event, and financial variables (`customer_name`, `company_name`, `event_date`, `venue_address`, `grand_total`, `deposit_amount`) so owners can insert them with one click.

## Risks / Trade-offs

- [Risk] Jinja syntax tags in WYSIWYG editor might be accidentally unformatted. → Mitigation: Display variable tags in styled placeholder chips and sanitize HTML before saving.
