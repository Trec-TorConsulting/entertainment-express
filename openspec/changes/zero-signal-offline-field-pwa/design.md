## Context

Mobile crew reliability is non-negotiable. If an app fails on site because of poor cell reception, crews abandon the software. Building a true offline-first PWA ensures that field crew never experience a loading spinner or failed network screen during an event setup or teardown.

## Goals / Non-Goals

**Goals:**
- Provide full read/write offline capability for `/employee/field` routes.
- Pre-cache daily assignments into IndexedDB automatically upon initial page load.
- Store mutations in an append-only IndexedDB table `offline_mutations` with fields `{id, action_type, payload, created_at, status}`.
- Replay mutations automatically via `window.addEventListener('online')` and Service Worker `sync` event.
- Support offline barcode scanning using HTML5 `BarcodeDetector` API or bundled `zxing-js` library.
- Guarantee idempotency on the server using unique transaction UUIDs to prevent double-submitting scans or timesheets.

**Non-Goals:**
- Real-time multiplayer collaborative document editing offline (field workers operate on their assigned booking slice).
- Large offline video transcoding or editing.

## Architecture & DocType Definitions

### 1. `EE Offline Sync Log`
- **Fields:**
  - `sync_batch_id`: Data (UUID, unique index)
  - `worker`: Link to `Worker`
  - `device_fingerprint`: Data
  - `synced_at`: Datetime
  - `mutations_count`: Int
  - `success_count`: Int
  - `conflict_count`: Int
  - `details_json`: Long Text

### 2. Client-Side IndexedDB Schema (Dexie.js / Native IDB)
- **Stores:**
  - `daily_manifest`: Key `booking_id`, value `{booking_data, items, venue, customer, contacts}`.
  - `equipment_barcodes`: Key `barcode`, value `{item_code, serial_no, description, required_status}`.
  - `mutations_queue`: Auto-increment key, value `{id: uuid, endpoint: string, payload: object, timestamp: int, attempts: int}`.
  - `offline_media`: Key `id`, value `{booking_id, blob, mime_type, category}`.

## Server APIs & Python Hooks

File: `entertainment_express/offline_sync/api.py`

```python
import frappe
from frappe.utils import now_datetime

@frappe.whitelist()
def get_daily_offline_bundle(date=None):
    """
    Returns complete data graph for the authenticated worker's day:
    bookings, pull sheets, venue details, barcodes, and emergency contacts.
    """
    pass

@frappe.whitelist()
def process_mutation_batch(mutations_json):
    """
    Processes a list of queued mutations with idempotency checking.
    Actions supported:
      - 'scan_barcode': updates equipment check-in/out status
      - 'save_signature': records client delivery signature blob
      - 'update_milestone': marks en_route / arrived / teardown
      - 'record_damage': logs damage report and saves photo
      - 'log_timesheet': records clock-in/out timestamp
    """
    pass
```

## Frontend Portal Architecture

- **Path:** `apps/portal-kit/src/services/offlineSync.ts`
- **Subcomponents:**
  - `OfflineIndicator`: Sticky status bar on `/employee/field` showing connection state:
    - Green: "Connected"
    - Amber: "Offline Mode (3 pending changes saved locally)"
    - Blue Pulse: "Reconnected — Syncing changes to cloud..."
  - `OfflineBarcodeScanner`: Camera scanner component evaluating barcodes locally against `daily_manifest.barcodes` without hitting network APIs.
  - `OfflineSignatureCapture`: Canvas signature component saving dataURL directly to IndexedDB.

## Multi-Tenant Isolation & Security

- Daily bundles are generated strictly from the worker's assigned bookings in the active tenant database.
- Mutation batch processing verifies that all mutated records belong strictly to the tenant site.

## Risks & Mitigations

- **Risk:** Clock-skew: worker device clock is set incorrectly, distorting timestamps.
- **Mitigation:** Server logs both `client_timestamp` and `server_received_timestamp`, flagging any deviation > 15 minutes for supervisor review.
