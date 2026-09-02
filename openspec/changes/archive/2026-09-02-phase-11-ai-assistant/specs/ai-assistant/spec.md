## ADDED Requirements

### Requirement: Degrade JSON Without Breaking The Page
The system SHALL return structured suggestions even when the LLM is unreachable, and SHALL include `available` false plus the exact phrase `AI suggestion unavailable` instead of raising.

#### Scenario: Ollama down, quote still suggested
- **WHEN** a sales user requests quote suggestions and the LLM HTTP call fails or times out
- **THEN** similar-job items and a `fmt_money` price range still return, `available` is false, and the message includes `AI suggestion unavailable`

### Requirement: Confirm Before Money Or Send
The system SHALL NOT create or submit quotations, invoices, contracts, crew assignments, or outbound campaign/email/SMS from `ask`, `suggest_quote`, `suggest_dispatch`, `draft_campaign`, or `forecast`. Those writes SHALL happen only via `confirm` after an explicit user action.

#### Scenario: Draft quote is preview only
- **WHEN** the assistant drafts a quote
- **THEN** no Quotation or Event Booking line is inserted until `confirm` with kind `apply_quote`

### Requirement: Tenant-Scoped Prompt
The system SHALL build LLM prompts only from the current Frappe site and the calling user’s permitted documents, and SHALL NOT accept `tenant` or `site` arguments on AI APIs.

#### Scenario: Ask this weekend
- **WHEN** an owner asks what events are this weekend and who is unassigned
- **THEN** the answer is computed from this site’s Event Booking rows only

### Requirement: Site Config Entitlement
The system SHALL deny AI APIs when `ee_ai_assistant` on site_config is `0` or **EE AI Settings**.enabled is `0`, with an upgrade-style PermissionError. Missing site_config key SHALL mean enabled.

#### Scenario: Flag off
- **WHEN** `ee_ai_assistant` is `0`
- **THEN** `ask` is denied (403) and no LLM call is made
