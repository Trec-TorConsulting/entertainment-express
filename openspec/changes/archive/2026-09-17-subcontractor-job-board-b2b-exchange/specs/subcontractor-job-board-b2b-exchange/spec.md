# Subcontractor Job Board & B2B Exchange Spec

## ADDED Requirements

### Requirement: Private Partner Job Board
The system SHALL provide a Private Job Board tab in `/owner/subcontractors` where owners can list overbooked/overflow jobs for their pre-approved partner subcontractors.

#### Scenario: Owner posts an overflow job to private board
- **WHEN** an owner posts a job with $1,000 agreed payout and selects "Private Pre-Approved Partners"
- **THEN** the job appears on their private job board and generates tokenized notifications to their qualified partners.

### Requirement: Opt-In B2B Network Exchange
The system SHALL enforce an explicit opt-in preference (`b2b_exchange_opt_in`) before a tenant owner receives network broadcast blasts or posts listings to the cross-tenant B2B Exchange.

#### Scenario: Owner opts in to B2B Exchange blasts
- **WHEN** an owner toggles "Opt In to B2B Network Exchange" in `/owner/subcontractors`
- **THEN** their company profile is registered to receive B2B overflow job blasts matching their vertical and service territory.

### Requirement: Automated COI Verification Gate
The system SHALL verify that a partner or peer operator has an active Certificate of Insurance (COI) on file before permitting them to claim a job board listing.

#### Scenario: Claiming a job board listing
- **WHEN** a subcontractor attempts to claim a listed overflow job
- **THEN** the system verifies COI status and rejects the claim with a compliance error if COI is missing or expired.

### Requirement: Job Claiming and Dispatch Sync
The system SHALL update the subcontract job status to `accepted` and trigger dispatch sync when a subcontractor claims an open listing.

#### Scenario: Subcontractor claims listing
- **WHEN** a qualified partner clicks "Claim Job" on an open listing
- **THEN** the job status transitions to `accepted`, payout terms are locked, and the originating owner is notified.
