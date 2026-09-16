# Tasks: Zero-Signal Offline-First Field Hardening

- [x] 1. Backend Sync & Idempotency Infrastructure
  - [x] 1.1 Create `EE Offline Sync Log` DocType schema in `entertainment_express/doctype/ee_offline_sync_log/`
  - [x] 1.2 Implement `get_day_offline_manifest` API in `entertainment_express/api/offline_sync.py`
  - [x] 1.3 Implement `sync_offline_batch` API with idempotency verification and transactional execution
  - [x] 1.4 Add unit tests for batch deduplication and timestamp ordering in `entertainment_express/tests/test_offline_sync.py`

- [x] 2. IndexedDB & Local Storage Layer
  - [x] 2.1 Set up local database client using Dexie in `frontend/employee-portal/src/app/offline/db.ts`
  - [x] 2.2 Implement local caching for manifests, packing lists, and serialized inventory items
  - [x] 2.3 Implement mutation queue manager with persistent retry state in `frontend/employee-portal/src/app/offline/queue.ts`

- [x] 3. Offline Operation Handlers
  - [x] 3.1 Update barcode scanner component to validate against local IndexedDB items when offline
  - [x] 3.2 Update client signature pad to serialize signatures into local IndexedDB Blob storage
  - [x] 3.3 Update checklist and timesheet actions to push directly to the local mutation queue

- [x] 4. Background Sync & Network Lifecycle
  - [x] 4.1 Implement `SyncEngine.ts` listening to `navigator.onLine` and `online` window events
  - [x] 4.2 Register Service Worker background sync event handler where supported
  - [x] 4.3 Add automatic batch flushing with exponential backoff on server errors

- [x] 5. Employee Portal UI Integration
  - [x] 5.1 Implement `SyncStatusPill.tsx` in `frontend/employee-portal/src/app/layouts/`
  - [x] 5.2 Implement `OfflineInspectorDrawer.tsx` allowing workers to inspect and force-sync pending operations
  - [x] 5.3 Test end-to-end offline mode with network simulation in browser devtools
  - [x] 5.4 Verify frontend portal build with `npm run build`
