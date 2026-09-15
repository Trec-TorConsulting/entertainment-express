## 1. AI Receipt OCR & Expense Claim Automation

- [ ] 1.1 Implement multimodal receipt parsing API in `entertainment_express/api/ai_expense_scanner.py`
- [ ] 1.2 Implement automatic ERPNext `Expense Claim` and `Purchase Invoice` generation linked to `Event Booking` Cost Center
- [ ] 1.3 Add Receipt Scanner upload and quick-review drawer in `/owner/money`

## 2. Autonomous AR Dunning Agent

- [ ] 2.1 Implement AR aging scanner and dunning rules in `entertainment_express/api/ai_dunning.py`
- [ ] 2.2 Implement tone-adaptive reminder generator using local Ollama model
- [ ] 2.3 Add Twilio SMS and email dispatch with embedded Stripe pay links
- [ ] 2.4 Build Dunning review queue on `/owner/money`

## 3. 60-Second Instant Lead Quoting

- [ ] 3.1 Implement inquiry parser and availability checker in `entertainment_express/api/ai_smart_quote.py`
- [ ] 3.2 Implement tiered ERPNext `Quotation` generator (Good, Better, Best)
- [ ] 3.3 Add 1-tap quote approval push notification and preview drawer on `/owner/pipeline`

## 4. Stripe Payout Bank Reconciliation

- [ ] 4.1 Implement Stripe payout batch breakdown API in `entertainment_express/api/ai_bank_recon.py`
- [ ] 4.2 Auto-match net deposit amounts against individual booking `Payment Entry` records
- [ ] 4.3 Automatically post Stripe processing fees to Payment Processor Expense ledger

## 5. Verification & Tests

- [ ] 5.1 Unit tests for receipt OCR extraction and Expense Claim creation
- [ ] 5.2 Unit tests for AR dunning calculation and message drafting
- [ ] 5.3 Unit tests for 60-second quotation synthesizer
- [ ] 5.4 Multi-tenant isolation verification across all AI endpoints
