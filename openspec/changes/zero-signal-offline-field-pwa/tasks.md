## 1. DocTypes & Server Sync Engine

- [x] 1.1 Create `EE Offline Sync Log` DocType tracking client mutation batches and replay audit history.
- [x] 1.2 Implement `entertainment_express.offline_sync.api.get_daily_offline_bundle` compiling complete booking and asset graphs.
- [x] 1.3 Implement `entertainment_express.offline_sync.api.process_mutation_batch` with strict UUID idempotency checks.

## 2. Client-Side IndexedDB & Service Worker

- [x] 2.1 Implement `offlineDatabase.ts` using IndexedDB storing daily manifests, barcodes, and mutation queue.
- [x] 2.2 Configure Service Worker background sync listener to trigger queue replay upon `online` event.
- [x] 2.3 Implement offline camera barcode scanner matching scans against local IndexedDB barcode store.
- [x] 2.4 Implement offline signature and damage photo blob storage in IndexedDB.

## 3. Worker UI & Sync Visual State

- [x] 3.1 Build `OfflineIndicator.tsx` status bar on `/employee/field` with pending queue count badge.
- [x] 3.2 Build manual "Sync Now" button and sync diagnostics modal.
- [x] 3.3 Ensure all field action buttons (`Check In`, `Scan Gear`, `Collect Signature`) remain interactive when `navigator.onLine === false`.

## 4. Verification & Testing

- [x] 4.1 Write automated tests `test_offline_mutation_sync.py` verifying idempotency, barcode reconciliation, and signature blob persistence.
- [x] 4.2 Perform offline browser simulation test in Playwright (disable network, perform scans/signature, reconnect, verify server state).
