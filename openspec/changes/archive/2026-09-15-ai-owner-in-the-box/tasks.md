## 1. AI Receipt OCR & Expense Claim Automation

- [x] 1.1 Implement multimodal receipt parsing API in `entertainment_express/api/ai_expense_scanner.py`
- [x] 1.2 Implement automatic ERPNext `Expense Claim` and `Purchase Invoice` generation linked to `Event Booking` Cost Center
- [x] 1.3 Add Receipt Scanner upload and quick-review drawer in `/owner/money`

## 2. Autonomous AR Dunning Agent

- [x] 2.1 Implement AR aging scanner and dunning rules in `entertainment_express/api/ai_dunning.py`
- [x] 2.2 Implement tone-adaptive reminder generator using local Ollama model
- [x] 2.3 Add Twilio SMS and email dispatch with embedded Stripe pay links
- [x] 2.4 Build Dunning review queue on `/owner/money`

## 3. 60-Second Instant Lead Quoting

- [x] 3.1 Implement inquiry parser and availability checker in `entertainment_express/api/ai_smart_quote.py`
- [x] 3.2 Implement tiered ERPNext `Quotation` generator (Good, Better, Best)
- [x] 3.3 Add 1-tap quote approval push notification and preview drawer on `/owner/pipeline`

## 4. Stripe Payout Bank Reconciliation

- [x] 4.1 Implement Stripe payout batch breakdown API in `entertainment_express/api/ai_bank_recon.py`
- [x] 4.2 Auto-match net deposit amounts against individual booking `Payment Entry` records
- [x] 4.3 Automatically post Stripe processing fees to Payment Processor Expense ledger

## 5. Verification & Tests

- [x] 5.1 Unit tests for receipt OCR extraction and Expense Claim creation
- [x] 5.2 Unit tests for AR dunning calculation and message drafting
- [x] 5.3 Unit tests for 60-second quotation synthesizer
- [x] 5.4 Multi-tenant isolation verification across all AI endpoints
