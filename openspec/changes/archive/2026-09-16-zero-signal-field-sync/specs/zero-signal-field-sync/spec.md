## ADDED Requirements

### Requirement: Local-First Offline Operation in Employee PWA
The `/employee` PWA SHALL support offline execution of core field operations—including equipment barcode scanning, checklist items, timesheet clock-in/out, customer signature capture, and incident photo logging—without active network connectivity.

#### Scenario: Barcode scanned in basement with zero signal
- **GIVEN** a worker in an underground venue with airplane mode enabled
- **WHEN** the worker scans a serialized gear barcode
- **THEN** the system validates the asset against the locally cached manifest, plays an audible success chime, records the item as loaded in local IndexedDB, and increments the pending offline mutation counter

#### Scenario: Client signature captured offline
- **GIVEN** a delivery driver completing an unattended bounce house drop-off in a rural park
- **WHEN** the client signs the liability waiver on the mobile screen offline
- **THEN** the SVG/PNG signature data is saved locally with a client timestamp and queued for sync

### Requirement: Background Mutation Synchronization & Idempotency
The system SHALL provide an automated background sync engine that monitors device network transitions. Upon connectivity restoration, the engine SHALL flush all queued offline mutations to the backend in chronological order using client-generated idempotency keys.

#### Scenario: Truck reconnects to cellular tower on highway
- **GIVEN** 14 queued offline mutations (scans, signatures, damage photo)
- **WHEN** the device reconnects to LTE/Wi-Fi
- **THEN** the PWA triggers background sync, transmits the batch payload to `/api/method/entertainment_express.api.offline_sync.sync_offline_batch`, receives confirmation, and clears the local mutation queue without duplicate ledger entries

### Requirement: Deterministic Conflict Resolution
The system SHALL resolve concurrent or overlapping updates from multiple crew members on the same booking using field-level timestamping and idempotent operation merges.

#### Scenario: Two workers simultaneously check off packing items
- **GIVEN** Worker A and Worker B both checking items offline for Booking `EB-2026-009`
- **WHEN** both devices sync upon reconnecting
- **THEN** the server merges all verified items without discarding either worker's logged scans and records the audit attribution for each item
