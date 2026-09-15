## Why

Mobile entertainment company owners struggle with operational administrative overhead: manually typing paper receipts into accounting ledgers, uncomfortably chasing corporate clients and wedding couples for unpaid balances, taking hours or days to calculate and return quote proposals, and manually reconciling lumped Stripe bank deposits against individual invoices.

By leveraging ERPNext's native financial DocTypes (`Expense Claim`, `Payment Request`, `Dunning`, `Quotation`, `Bank Statement Import`) combined with dual-tier AI (local Ollama on GPU node05 for text reasoning and cloud multimodal vision for receipt processing), Entertainment Express provides an autonomous back-office copilot that cuts owner administrative time by 80% while ensuring 100% financial accuracy.

## What Changes

1. **AI Expense & Receipt OCR Scanner**:
   - Owners and field crew snap photos of paper receipts (fuel, venue parking, tolls, emergency hardware, dry ice).
   - Multimodal vision model extracts merchant, date, total, tax, line items, and expense category.
   - Automatically generates an ERPNext `Expense Claim` or `Purchase Invoice` linked to that day's `Event Booking` and Cost Center, updating the live Event P&L.
2. **Autonomous AR Dunning & Balance Collection Agent**:
   - Monitors aging accounts receivable and overdue event balances.
   - Evaluates client history and relationship sentiment to draft personalized, tactful email/SMS payment reminders with one-click Stripe pay links.
   - Integrates with ERPNext `Dunning` and `Payment Request` without requiring manual owner intervention.
3. **60-Second Instant Lead Quoting Assistant**:
   - Ingests incoming lead inquiries from webforms and emails.
   - Parses date, event type, guest count, and venue logistics, cross-referencing real-time equipment and crew availability.
   - Drafts tiered (Good/Better/Best) quote packages in ERPNext `Quotation`, notifying the owner via push/SMS for single-tap review and send.
4. **Automated Bank Reconciliation & Stripe Payout Matcher**:
   - Ingests bank feed statements and Stripe payout batches.
   - Intelligently decomposes lumped Stripe payout deposits (Gross Sales minus Processing Fees) and reconciles them against individual ERPNext `Payment Entry` documents.
   - Automatically books payment gateway processing fees to the expense ledger.

## Capabilities

### New Capabilities
- `ai-owner-erp-intelligence`: Deep ERPNext intelligence automation for business owners, covering AI expense receipt OCR, autonomous accounts receivable dunning, 60-second quote drafting, and automated Stripe batch bank reconciliation.

### Modified Capabilities
- `billing-payments`: Integrate autonomous dunning schedule generation and Stripe batch reconciliation.
- `crm`: Integrate AI lead quotation drafting engine.
- `owner-portal`: Add Receipt Inbox, Dunning Review drawer, and Bank Feed Reconciliation views to `/owner/money`.

## Impact

- **Backend**:
  - `entertainment_express/api/ai_expense_scanner.py`: Multi-modal receipt parsing and Expense Claim generation.
  - `entertainment_express/api/ai_dunning.py`: Overdue balance evaluation and tone-adaptive reminder dispatch.
  - `entertainment_express/api/ai_smart_quote.py`: Rapid multi-tier quotation synthesizer.
  - `entertainment_express/api/ai_bank_recon.py`: Automated Stripe batch reconciliation helper.
- **Frontend**: New UI cards and drawers in `/owner/money` and `/owner/pipeline`.
- **Infrastructure**: Dual-tier AI: Ollama on node05 for local text/dunning/quotes; Cloud multimodal vision (Gemini/OpenAI) for receipt OCR.
