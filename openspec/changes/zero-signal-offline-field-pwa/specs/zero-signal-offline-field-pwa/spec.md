## ADDED Requirements

### Requirement: Local-First IndexedDB Offline Pre-Caching
The system SHALL pre-cache the authenticated crew member's entire daily booking assignments, equipment barcode manifests, venue instructions, and contacts into browser IndexedDB upon initial load.

#### Scenario: Crew opens field app before leaving warehouse
- **WHEN** a crew member logs into `/employee/field` on warehouse Wi-Fi
- **THEN** the Service Worker downloads and caches all booking data and asset barcode hashes for the day into local IndexedDB.

### Requirement: Full Offline Field Actions & Barcode Scanning
The system SHALL allow field workers to scan equipment barcodes, mark setup milestones, and collect client signatures when `navigator.onLine` is false.

#### Scenario: Scanning bounce house return in remote park with zero cellular bars
- **WHEN** a driver scans equipment barcode `BC-8891` while disconnected from cellular data
- **THEN** the app matches the barcode against local IndexedDB, plays a positive audio chime, marks the item returned locally, and queues an upload mutation.

### Requirement: Idempotent Queued Replay & Background Sync
The system SHALL store offline mutations in an append-only queue and automatically replay them with unique idempotency keys upon network reconnection.

#### Scenario: Device regains 5G signal on highway drive back
- **WHEN** the device reconnects to the internet
- **THEN** the queued mutations (barcodes, signatures, timestamps) replay to `process_mutation_batch` in chronological order without duplication.
