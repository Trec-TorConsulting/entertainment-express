## ADDED Requirements

### Requirement: Control-Plane Mediated B2B Exchange Architecture
The system SHALL mediate all cross-tenant overflow and sub-rental interactions strictly through the central Control Plane broker. Tenant code SHALL NEVER query or manipulate the database or file storage of another tenant directly.

#### Scenario: Tenant broadcasts overflow gig to control plane
- **GIVEN** an operator on site `tenant-alpha` with an unfulfillable $2,500 DJ booking on October 10
- **WHEN** the operator creates an `EE Exchange Listing` with $1,600 subcontractor budget
- **THEN** the tenant client dispatches a signed API request to `https://admin.{base_domain}/api/method/control_plane.exchange.publish_listing` without revealing end-client personal info

#### Scenario: Multi-tenant data isolation verified
- **WHEN** `tenant-beta` views available listings in their geographic area
- **THEN** the listings are retrieved from the Control Plane broker and contain zero direct database references or customer PII from `tenant-alpha`

### Requirement: Automated Partner COI & Compliance Gate
The system SHALL enforce that any peer operator attempting to accept an exchange gig or high-value sub-rental holds an active, verified Certificate of Insurance (COI) on file with sufficient general liability coverage.

#### Scenario: Uninsured peer blocked from accepting gig
- **GIVEN** a peer operator whose commercial liability policy expired last week
- **WHEN** the peer attempts to click "Accept Gig" on a $1,600 overflow listing
- **THEN** the request is rejected with error `compliance_coi_expired` and instructions to upload a renewed certificate

### Requirement: Automated Margin Escrow & Settlement
The system SHALL track escrow states (`pledged`, `held`, `released`, `disputed`) for accepted exchange jobs, executing release of funds upon mutual post-event sign-off.

#### Scenario: Completion releases escrow payout
- **GIVEN** an accepted overflow gig marked completed by both originating host and fulfilling partner
- **WHEN** settlement executes
- **THEN** the originating tenant records a `Purchase Invoice` for $1,600, the fulfilling partner receives payment via Stripe Connect or ACH, and the control plane records platform brokerage fees
