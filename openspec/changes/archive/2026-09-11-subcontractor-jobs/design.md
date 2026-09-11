# Technical Design: Subcontractor Jobs & Partner Management

## Context

In the mobile entertainment industry (DJs, inflatables, photobooths, game trucks, performers), owners frequently subcontract bookings due to double-bookings, vehicle/rig downtime, staffing shortages, or geographic distance. While `EE Vendor` and a basic `EE Vendor Assignment` exist from Phase 17, they lack a dedicated owner workspace, offer/acceptance workflows, tokenized partner access, client privacy safeguards, and gross margin analytics.

This design introduces a first-class Subcontractor Management system within the `/owner` cockpit and backend, enabling seamless, professional sub-outs with strict financial and privacy controls.

## Goals / Non-Goals

**Goals:**
- Provide a dedicated `/owner/subcontractors` workspace with partner directory, job pipeline, and margin tracking.
- Enable 1-click or guided sub-outs from Event Bookings, Dispatch boards, or the Subcontractors hub.
- Support tokenized, secure external web pages where partner companies can accept or decline job offers without tenant credentials.
- Protect tenant business relationships via white-label mode (masking client direct contact information and pricing).
- Maintain multi-tenant isolation and enforce currency arithmetic via `flt` / `fmt_money`.

**Non-Goals:**
- Automated peer-to-peer job swapping across different EE tenant sites without owner explicit entry (Phase 37 partner exchange).
- Full payroll disbursement for 1099 talent (handled by existing `hr-workforce` / `billing-payments`).
- Subcontractor fleet GPS tracking (handled by existing `live-tracking` if installed).

## Decisions

### 1. Data Model: Dedicated `EE Subcontract Job` DocType
- **Decision**: Create a dedicated `EE Subcontract Job` DocType rather than overloading the generic `EE Vendor Assignment`.
- **Rationale**: Subcontracting requires an extensive workflow (offer tokens, accept/decline timestamps, decline reasons, margin tracking, white-label toggles, payment terms, and purchase invoice linkages) that would clutter the simple coordination-oriented `EE Vendor Assignment`.
- **Alternative Considered**: Adding 15+ fields to `EE Vendor Assignment`. Rejected to avoid breaking existing day-of coordination vendor lists used by field crew.

### 2. External Acceptance: Secure Tokenized Public Endpoint
- **Decision**: Provide a secure token (`offer_token`, UUID4) allowing partner companies to view the job offer and click "Accept" or "Decline" via a guest-accessible Frappe web endpoint `/subcontract/offer/<token>` or whitelisted method.
- **Rationale**: Partner companies are separate businesses and usually do not have user accounts in the tenant's Frappe site. Requiring login would introduce significant friction and user license confusion.
- **Alternative Considered**: Requiring partner companies to be onboarded as portal users. Rejected as overly burdensome for standard B2B subcontractor workflows.

### 3. White-Label & Client Privacy Safeguards
- **Decision**: Default `white_label` to enabled on every sub-out. When enabled, the generated job packet and external offer view hide client direct phone/email and client pricing, displaying only event location, schedule, day-of on-site coordinator/planner contacts, and load-in specifications.
- **Rationale**: Prevents client poaching and protects the tenant company's client relationships.

### 4. Financial Tracking: Currency via `flt` and Margin Engine
- **Decision**: Capture `client_price` (from booking) and `agreed_cost` (subcontractor fee) using `frappe.utils.flt`, computing `expected_margin = client_price - agreed_cost` and `margin_percent`.
- **Rationale**: Adheres to the Golden Rule: never float-math money in Python or client JS; display backend-formatted currency strings.

## Schema Specification

### DocType: `EE Subcontract Job`
- `name`: Autoname `SUB-.YYYY.-.#####`
- `booking`: Link (`Event Booking`), required, index
- `vendor`: Link (`EE Vendor`), required, index
- `status`: Select (`draft`, `offered`, `accepted`, `declined`, `in_progress`, `completed`, `billed`, `paid`, `cancelled`), default `draft`
- `scope_type`: Select (`full_booking`, `partial_services`), default `full_booking`
- `agreed_cost`: Currency, required
- `client_price`: Currency, read-only (populated from booking)
- `expected_margin`: Currency, read-only
- `margin_percent`: Percent, read-only
- `pay_terms`: Data (e.g. `Net 15`, `Net 30`, `Due on Completion`, `Custom`)
- `white_label`: Check (default 1)
- `special_instructions`: Small Text
- `offer_token`: Data (read-only, indexed, unique UUID)
- `offer_sent_at`: Datetime
- `response_at`: Datetime
- `decline_reason`: Small Text
- `purchase_invoice`: Link (`Purchase Invoice`), optional

## API Specifications

All endpoints live in `entertainment_express/api/subcontractors.py`:
- `list_subcontractors()`: Returns list of partner companies where `subcontractor == 1`, with active subbed job count and COI/W9 compliance flags.
- `list_subcontract_jobs(status=None, vendor=None, booking=None)`: Returns subbed jobs with booking summaries, margins, and status badges.
- `create_subcontract_job(values)`: Validates compliance, creates `EE Subcontract Job` record, computes margin.
- `send_subcontract_offer(job_id)`: Generates `offer_token` (if not present), sends email/SMS with acceptance link.
- `get_offer_details(token)`: Guest-safe endpoint returning event date, service items, venue logistics, payout, terms, and white-label notes.
- `respond_offer(token, action, decline_reason=None)`: Transitions status to `accepted` or `declined`, notifies tenant owner.
- `complete_subcontract_job(job_id)`: Marks job completed, triggers purchase invoice draft if ERPNext integration enabled.

## Risks / Trade-offs

- **[Risk] Partner company declines last minute** → *Mitigation*: Prominent alert in `/owner` Today inbox and SMS alert to tenant owner upon decline; status immediately surfaces on Dispatch board as at-risk.
- **[Risk] Partner company contacts client directly (poaching)** → *Mitigation*: Strict white-label default masking client contact info; sub-out agreement includes explicit non-solicitation term acknowledgment.
- **[Risk] Subcontractor operates without insurance** → *Mitigation*: Automatic COI validity verification with explicit warning dialog requiring owner confirmation if expired or unverified.

## Migration Plan

1. Create `EE Subcontract Job` DocType JSON and add module reference.
2. Implement backend APIs and notification hooks.
3. Build `/owner/subcontractors` workspace route and modal dialog in `frontend/owner-portal`.
4. Run standard test suite and isolation checks.
