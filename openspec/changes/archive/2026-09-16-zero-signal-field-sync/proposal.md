## Why

Mobile entertainment and event operations take place in hostile cellular environments: rural wedding barns, state parks, sub-grade hotel convention halls, and metal storage warehouses with zero cellular reception. When a field application relies on continuous internet connectivity, crews cannot scan gear barcodes, log arrival times, capture mandatory liability signatures, or record equipment damage photos. The entire digital operational loop breaks down, forcing workers back to messy paper clipboards.

The **Zero-Signal Offline-First Field Hardening** change upgrades the `/employee` Progressive Web App (PWA) with a robust, local-first IndexedDB architecture backed by a Service Worker and deterministic conflict-resolution sync engine. Field workers can execute complete event workflows—load-out scans, GPS timestamps, photo capture, signature sign-offs, and timesheets—100% offline, automatically flushing queued transactions the moment connectivity is restored.

## What Changes

- **Local-First IndexedDB Storage Layer**: Implements a dedicated local database in the `/employee` PWA using Dexie.js / IndexedDB, storing full day manifests, equipment checklists, client contact sheets, and run-of-show moments locally on the worker's device.
- **Offline Barcode Scan & Packing List Validation**: Allows warehouse workers and delivery crews to scan gear barcodes and verify loading lists with sub-millisecond local validation and zero network dependency.
- **Offline Signature & Media Capture**: Captures client delivery sign-offs, liability waivers, and high-resolution gear damage photos into local Blob storage, queuing them for background upload.
- **Background Sync Engine & Retry Pipeline**: Employs the browser Background Sync API and Service Worker lifecycle to monitor online/offline network transitions and flush queued mutations in chronological order.
- **Deterministic Conflict Resolution (CRDT / Last-Write-Wins with Audit)**: Resolves concurrent updates (e.g. lead supervisor and attendant checking off items simultaneously) using deterministic vector clocks and server reconciliation.
- **Offline Status Indicator & Sync Drawer in `/employee`**: Ambient connectivity pill ("Online", "Offline (7 pending changes)", "Syncing...") with a transparent mutation inspection drawer.

## Capabilities

### New Capabilities
- `zero-signal-field-sync`: Offline-first IndexedDB PWA architecture, local barcode scan verification, offline media capture, and background sync reconciliation engine.

### Modified Capabilities
- `mobile-field-app`: Enhance PWA Service Worker caching and offline mutation queue.
- `equipment-inventory-fleet`: Support batch offline scan event reconciliation on check-in and check-out.
- `employee-portal`: Add offline-ready cache management, sync status indicator, and local storage inspector.

## Impact

- **Frontend Architecture (`frontend/employee-portal`)**:
  - `src/app/offline/db.ts`: IndexedDB database schema (manifests, scans, timesheets, mediaQueue).
  - `src/app/offline/syncEngine.ts`: Mutation queue processor and network listener.
  - `src/app/offline/serviceWorker.ts`: Cache-first asset and manifest caching strategy.
- **Backend Architecture**:
  - `entertainment_express/api/offline_sync.py`: Batch mutation ingest endpoint (`sync_offline_batch`) supporting idempotency keys and client-generated timestamps.
- **Data Integrity**:
  - All offline mutations carry a cryptographically secure client UUID and client timestamp, preventing duplicate entry creation on retried sync flushes.
