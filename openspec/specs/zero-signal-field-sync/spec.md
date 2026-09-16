# Capability: Zero-Signal Offline-First Field Hardening

## Purpose
Provides a robust offline-first PWA architecture for field crew and warehouse operations. Enables local barcode validation, client signature capture, photo attachments, and timesheets without network connectivity, backed by deterministic background sync and idempotency key verification.

## Requirements

### Requirement: Local-First IndexedDB Storage
The `/employee` PWA SHALL store operational day manifests, booking details, equipment item catalogs, and pending mutations locally using IndexedDB.

#### Scenario: Working offline in dead-zone
- **WHEN** a worker loses network connectivity
- **THEN** manifests and item catalogs remain queryable locally from IndexedDB

### Requirement: Offline Barcode Scan Validation
The barcode scanner component SHALL validate scanned asset barcodes against local IndexedDB cached inventory when offline and queue scan events for server sync.

#### Scenario: Barcode scan offline
- **WHEN** a crew member scans an asset barcode while offline
- **THEN** local validation passes and a scan mutation is enqueued

### Requirement: Idempotent Batch Sync Engine
The backend API (`sync_offline_batch`) SHALL verify client mutation UUIDs against `EE Offline Sync Log` to prevent duplicate transaction execution on retried network requests.

#### Scenario: Network retry flush
- **WHEN** a batch of mutations is retried after a network drop
- **THEN** previously processed UUIDs are skipped idempotently

### Requirement: Ambient Connectivity UI & Inspector
The `/employee` UI SHALL display an ambient connection pill (`SyncStatusPill`) and provide an inspection drawer (`OfflineInspectorDrawer`) allowing workers to view and force-sync pending offline transactions.

#### Scenario: Inspecting pending queue
- **WHEN** a worker opens the sync inspector
- **THEN** queued offline mutations and connection status are displayed
