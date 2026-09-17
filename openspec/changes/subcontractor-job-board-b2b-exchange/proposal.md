## Why

Tenant business owners frequently encounter overbooked dates, gear shortages, or double-booked events that require subcontracting work out. Adding a **Private Subcontractor Job Board** and an **Opt-In B2B Network Overflow Exchange** enables owners to seamlessly post overflow jobs to their pre-approved partner network or broadcast listings to opt-in platform peers with automated COI compliance and margin protection.

## What Changes

- Add a **Job Board Workspace** to `/owner/subcontractors` displaying active overflow job listings, partner bids, and claim status.
- Add a **"Post Overflow Job" Modal** (`PostJobModal.tsx`) allowing owners to publish an overbooked job with agreed payout, white-label masking, pay terms, and privacy settings.
- Implement **B2B Network Opt-In Settings**: Owners must explicitly opt in (`b2b_exchange_opt_in`) to receive broadcast blasts or list overflow jobs on the cross-tenant network exchange.
- Implement **Automated COI Compliance Checks**: Subcontractors/peers claiming listings must have active COI insurance on file.
- Implement **Tokenized Claiming & Notification Dispatch**: Sends instant offer tokens and updates dispatch status upon job acceptance.

## Capabilities

### New Capabilities
- `subcontractor-job-board-b2b-exchange`: Private subcontractor job board, opt-in B2B network exchange, automated COI verification, and job claiming workflow.

### Modified Capabilities
- None

## Impact

- Backend: `entertainment_express/api/subcontractors.py` (new whitelisted endpoints `post_job_board_listing()`, `list_job_board()`, `claim_job_board_listing()`, `toggle_b2b_opt_in()`).
- Frontend: `frontend/owner-portal/src/app/routes/subcontractors/SubcontractorsPage.tsx`, new components `PostJobModal.tsx` and `B2BOptInCard.tsx`.
