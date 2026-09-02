# Capability: AI Assistant & Intelligence

## Purpose
Embed practical AI across the platform to save time and increase revenue: a natural-language assistant,
smart quoting, demand forecasting, dispatch/route suggestions, content drafting, and lead scoring. Backed by
a **pluggable LLM provider** (default local **Ollama** on the cluster GPU node; optional OpenAI/Gemini via
tenant BYO key). All AI features MUST degrade gracefully and respect tenant isolation and plan entitlements.

## Requirements

### Requirement: Pluggable LLM Backend
The system SHALL support a configurable LLM provider (Ollama by default, OpenAI/Gemini optional) selected per
tenant, with graceful degradation when unavailable.

#### Scenario: Local model default
- **WHEN** a tenant uses AI features without configuring an external provider
- **THEN** requests are served by the local Ollama backend

#### Scenario: Graceful degradation
- **WHEN** the LLM backend is unreachable
- **THEN** the feature still functions without AI (manual path) and shows "AI suggestion unavailable" rather
  than erroring the whole workflow

### Requirement: Conversational Assistant
The system SHALL provide an in-app assistant that answers questions and performs permitted actions over the
tenant's own data.

#### Scenario: Ask about the business
- **WHEN** a user asks "what events do we have this weekend and who's unassigned?"
- **THEN** the assistant answers using only that tenant's data, respecting the user's permissions

#### Scenario: Assisted action
- **WHEN** a user asks the assistant to draft a quote or a customer reply
- **THEN** it produces a draft the user can review and confirm before it takes effect (no silent writes to
  money/contracts)

### Requirement: Smart Quoting
The system SHALL suggest quote line items, packages, add-ons, and pricing based on the event details and
historical data.

#### Scenario: Quote suggestions
- **WHEN** a sales user starts a quote for a described event
- **THEN** the system suggests appropriate service items, packages, add-ons, and a price range from similar
  past bookings, which the user can accept/edit

### Requirement: Demand Forecasting
The system SHALL forecast demand and revenue to aid staffing and inventory decisions.

#### Scenario: Staffing forecast
- **WHEN** a manager views the forecast
- **THEN** projected bookings/revenue and suggested crew/asset needs for upcoming periods are shown from
  historical trends and current pipeline

### Requirement: Dispatch & Routing Suggestions
The system SHALL recommend crew/asset assignments and route orderings (used by `scheduling-dispatch`).

#### Scenario: Assignment recommendation
- **WHEN** a dispatcher requests suggestions for an unassigned event
- **THEN** ranked crew/asset assignments are proposed considering availability, proximity, skill, and cost

### Requirement: Content Drafting & Lead Scoring
The system SHALL draft marketing/communication content and score leads by conversion likelihood.

#### Scenario: Draft campaign copy
- **WHEN** a marketer requests campaign copy for a segment/offer
- **THEN** a draft is generated for review before sending

#### Scenario: Lead score
- **WHEN** a new lead arrives
- **THEN** it is scored for conversion likelihood to help prioritize follow-up

### Requirement: AI Guardrails
The system SHALL keep AI within tenant boundaries, permissions, and plan entitlements, and never expose one
tenant's data to another or perform irreversible actions without confirmation.

#### Scenario: Isolation preserved
- **WHEN** any AI feature runs
- **THEN** it only accesses the requesting tenant's data and the requesting user's permitted scope, and
  destructive/financial actions require explicit human confirmation

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
