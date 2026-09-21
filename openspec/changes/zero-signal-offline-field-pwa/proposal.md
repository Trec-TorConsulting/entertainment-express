## Why

Mobile entertainment and party rental crews spend their weekends operating in cellular dead zones: rural wedding barns, hotel basements, mountain resorts, and remote county parks. When cloud-only field apps hit a zero-signal zone, the screen goes blank, run sheets become inaccessible, barcode scanners fail, and crews cannot collect client delivery signatures or log damaged equipment. Field staff are forced back to pen and paper, resulting in missing gear, disputed overtime, and hours of chaotic manual data re-entry on Monday mornings.

## What Changes

- Transform the Employee Field App (`/employee/field`) into a **True Local-First Progressive Web App (PWA)** using browser IndexedDB and Service Worker caching.
- Provide automated **Morning Offline Pre-Caching**: when a crew member opens the app on warehouse Wi-Fi, all assigned booking packets for "My Day" (venue instructions, gate codes, equipment manifest barcodes, client contacts, run-of-show timelines) are cached offline.
- Enable full **Offline Field Operations**:
  1. Offline camera barcode/QR scanning: verify equipment load-out and return check-in against the local manifest with instant audio feedback.
  2. Offline digital signature capture: collect customer sign-off on delivery terms and liability waivers with local timestamping.
  3. Offline photo capture: snap damage reports and store blobs in IndexedDB.
  4. Offline timesheet clock-in/out and milestone tracking.
- Deliver an **Append-Only Mutation Queue & Auto-Sync Engine**: all field actions are queued locally with UUID idempotency keys. When cell connectivity is restored, the Service Worker replays mutations chronologically and reconciles state deterministically.

## Capabilities

### New Capabilities
- `zero-signal-offline-field-pwa`: Local-first IndexedDB offline field PWA architecture, offline barcode equipment scanning, offline signature collection, and deterministic queued background replay.

### Modified Capabilities
- `mobile-field-app`: Upgraded from read-only service worker cache to full read-write offline mutation engine.
- `equipment-inventory-fleet`: Equipment check-in/out APIs support idempotent batch sync.

## Impact

- **DocTypes**:
  - `EE Offline Sync Log`: Tracks client-side mutation batches, worker ID, device ID, replay status, conflicts resolved.
- **Server APIs**:
  - `entertainment_express.offline_sync.api.get_offline_daily_manifest(worker_id, date)`
  - `entertainment_express.offline_sync.api.sync_mutation_batch(batch_json)`
- **Portal UI**:
  - Offline status bar on `/employee/field`: visual pill ("Online", "Offline - 4 queued actions", "Syncing...").
  - IndexedDB storage layer using `idb-keyval` or `Dexie.js`.
