## Context

Mobile entertainment business owners are burdened by tedious financial administrative tasks. While ERPNext provides robust double-entry accounting, DocTypes like `Expense Claim`, `Dunning`, `Quotation`, and `Bank Statement Import` require complex manual data entry. This change designs an intelligent operational bridge that automates data capture, dunning, quoting, and bank reconciliation.

## Goals / Non-Goals

**Goals:**
- Provide zero-typing receipt capture via multimodal vision models, mapping to ERPNext `Expense Claim` and event Cost Centers.
- Automate accounts receivable collection reminders using ERPNext `Dunning` with tone adaptation and one-click Stripe payment links.
- Synthesize tiered quotes within 60 seconds of lead arrival, checking live availability.
- Automate reconciliation of lumped Stripe bank payouts against individual customer invoices.

**Non-Goals:**
- Completely autonomous irreversible money movement without configurable owner thresholds or approval gates.
- Replacing external CPA tax filing (EE manages internal operating books and margin intelligence).

## Decisions

### 1. Dual-Tier AI Processing
- Local Ollama on node05 GPU for text generation, dunning copy personalization, and quote structuring.
- Cloud Multimodal API (Gemini/OpenAI) for receipt OCR image parsing where vision accuracy is critical.

### 2. Guardrails on Financial Mutations
- Dunning emails can run on auto-pilot if configured, but financial write-offs and final cancellation notices require explicit owner confirmation.
- Quotes created by AI remain in `Draft` state until 1-tap owner approval or tenant auto-send rule triggers.

## Risks / Trade-offs

- **[Risk] Blurry or Crumpled Receipts**: Field crew receipts may be poorly lit or wrinkled.
  - *Mitigation*: The vision prompt returns confidence scores per field; if confidence is below 85%, the receipt is placed in an "Owner Needs Review" queue on `/owner/money` with image magnification.
