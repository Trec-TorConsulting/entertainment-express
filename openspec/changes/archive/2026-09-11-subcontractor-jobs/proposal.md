## Why

Mobile entertainment companies frequently experience peak-date double-bookings, equipment shortages, or geographic overflow, requiring them to sub out entire jobs or specific service lines to trusted partner companies. Today, owners lack a dedicated subcontracting workspace to manage partner companies, issue sub-out agreements/work orders, dispatch job packets, track subcontractor statuses, and monitor job profit margins without risking client privacy or losing financial control.

## What Changes

- **Subcontractor Management Hub in `/owner`**: Add a dedicated Subcontractor section on the Owner Portal (`/owner/subcontractors`) to manage partner companies, view active subbed-out jobs, review subcontractor performance, and track payouts.
- **Job Sub-Out Workflow**: Allow owners to sub out a full booking or individual service items to a partner subcontractor company directly from Booking/Pipeline/Dispatch.
- **Subcontract Agreement & Work Order Generation**: Generate formal subcontract agreements/work orders detailing scope, agreed payout (flat rate, hourly, or percentage split), payment terms, and confidentiality/non-solicitation rules.
- **Subcontractor Job Packet & Dispatch**: Provide clean, client-safe run sheets/job packets (with configurable client PII masking for white-label subbing) delivered via email/SMS with a secure tokenized acceptance link.
- **Offer & Acceptance Lifecycle**: Support full state machine (`draft` → `offered` → `accepted` / `declined` → `in_progress` → `completed` → `billed` → `paid`) with instant owner notification when a subcontractor accepts or declines.
- **Margin & Payout Tracking**: Compute and display gross margin per subbed job (client price vs. agreed subcontractor cost) and generate payable records linked to ERPNext purchase invoices/payout entries.

## Capabilities

### New Capabilities
- `subcontractor-management`: Covers the end-to-end lifecycle of subbing out jobs to external entertainment companies, including subcontractor company directory, sub-out offer generation, rate/margin calculations, tokenized acceptance links, client privacy controls, and fulfillment tracking.

### Modified Capabilities
- `owner-portal`: Adds a dedicated Subcontractors flagship workspace (`/owner/subcontractors`) and quick sub-out actions from booking and pipeline views.
- `vendor-network`: Extends vendor and vendor assignment records with subcontractor-specific rate agreements, work order statuses, compliance verification gates, and job packet dispatch.

## Impact

- **Backend**: New DocType `EE Subcontract Job` (or enhancement to `EE Vendor Assignment`), API endpoints under `entertainment_express.api.subcontractors`, updates to `entertainment_express.api.vendors` and `entertainment_express.api.dispatch`.
- **Frontend**: New Subcontractors workspace and sub-out modal/drawer in `frontend/owner-portal`, updates to `frontend/portal-kit` navigation and status badges.
- **Notifications**: New notification templates for Subcontractor Job Offer, Subcontractor Work Order Confirmation, and Owner Acceptance/Decline alerts.
- **Isolation**: Multi-tenant site-per-tenant isolation strictly preserved; partner directories and subcontract transactions are strictly isolated per tenant site.
