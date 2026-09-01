## ADDED Requirements

### Requirement: Guided Import On Company OS
The system SHALL let the owner upload CSV (or Excel when the parser is available), map columns, dry-run, and commit into the current tenant only. Guests SHALL be denied.

#### Scenario: Import customers
- **WHEN** an owner maps email/name and commits
- **THEN** valid rows become Customers on this site and other tenants are untouched

#### Scenario: Dry-run writes nothing
- **WHEN** an owner validates before commit
- **THEN** counts and per-row errors return and no Customer/Lead/Booking is inserted

### Requirement: Competitor Presets
The system SHALL offer starter column maps for HoneyBook, DJ Event Planner, Check Cherry, and Booqable that the owner can edit.

#### Scenario: Preset mapping
- **WHEN** an owner picks HoneyBook customers
- **THEN** a starter map is pre-filled and still editable

### Requirement: Idempotent Import Jobs
The system SHALL run imports as jobs that skip existing natural keys and resume remaining rows.

#### Scenario: Re-run after partial failure
- **WHEN** the same file is committed again
- **THEN** already-imported emails/names are skipped and only new rows insert

### Requirement: Data Export
The system SHALL export the owner’s permitted entity to CSV for this tenant only.

#### Scenario: Export bookings
- **WHEN** an owner exports jobs
- **THEN** the file contains this site’s jobs and not another tenant’s

### Requirement: Onboarding Checklist
The system SHALL show setup progress (brand, catalog, payments, import, first job) on `/owner` until complete.

#### Scenario: New tenant onboarding
- **WHEN** an owner opens Today with no packages and no jobs
- **THEN** the checklist lists those remaining steps
