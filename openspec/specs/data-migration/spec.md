# Capability: Data Migration & Onboarding

## Purpose
Fast, safe **onboarding of new tenants from spreadsheets and competing tools** (HoneyBook, DJ Event Planner,
Check Cherry, Booqable, etc.) plus ongoing **import/export**. Nearly every competitor advertises CSV/Excel
import and "move with confidence" onboarding; without it, tenant switching cost is too high. Currently
missing from our spec.

### Data Model
- **Import Job**: tenant-scoped; source_type (`csv|excel|competitor_export`), target (`customers|leads|
  bookings|items|assets|venues|vendors|songs`), mapping (field map), status (`pending|validating|running|
  completed|failed`), rows_total, rows_ok, rows_failed, error_report (attach).
- **Export Job**: target, format (`csv|excel`), filters, file (attach), status.

## Requirements

### Requirement: Guided CSV/Excel Import
The system SHALL import core entities (customers, leads, bookings, service items, assets, venues, vendors,
songs) from CSV/Excel with column mapping and validation, into the current tenant only.

#### Scenario: Import customers
- **WHEN** a tenant admin uploads a customers CSV and maps columns
- **THEN** valid rows are imported into that tenant, invalid rows are reported with reasons, and nothing is
  written to any other tenant

#### Scenario: Dry-run validation
- **WHEN** an import is validated before commit
- **THEN** a preview of how many rows will succeed/fail is shown, with per-row errors, before any data is
  written

### Requirement: Competitor Migration Helpers
The system SHALL provide mapping presets for common competitor exports to reduce manual field mapping.

#### Scenario: Preset mapping
- **WHEN** a tenant selects a known competitor export format
- **THEN** a starter field mapping is pre-filled and editable before import

### Requirement: Idempotent, Resumable Imports
The system SHALL run imports as background jobs that are idempotent (dedupe by natural key) and resumable on
failure.

#### Scenario: Re-run after partial failure
- **WHEN** an import job is re-run after failing partway
- **THEN** already-imported rows are skipped (deduped) and only remaining rows are processed

### Requirement: Data Export
The system SHALL export tenant data (per entity) to CSV/Excel for backup or portability, scoped to
permissions.

#### Scenario: Export bookings
- **WHEN** a permitted user exports bookings for a date range
- **THEN** a CSV/Excel is generated containing only data they may access

#### Scenario: Export is this site only
- **WHEN** an owner exports jobs
- **THEN** the file contains this site’s jobs and not another tenant’s

### Requirement: Onboarding Checklist
The system SHALL provide a guided onboarding checklist for new tenants (branding, catalog, payment connect,
import, first booking).

#### Scenario: New tenant onboarding
- **WHEN** a tenant is first provisioned
- **THEN** an onboarding checklist guides them through setup steps with progress tracking

#### Scenario: Today shows remaining setup
- **WHEN** an owner opens Today with no packages and no jobs
- **THEN** the checklist lists those remaining steps

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
