# Tasks: Phase 13 — Integrations Expansion

## 1. Schema
- [x] 1.1 Module `Integrations`; DocTypes Integration Config, Integration Sync Log (append-only), Integration Webhook Event (unique provider+event_id).
- [x] 1.2 Event Booking `calendar_sync_id`; custom fields on Sales Invoice / EE Contract for provider refs if needed.

## 2. Framework
- [x] 2.1 Encrypted get/set credentials; list_connections never returns secrets; guests/crew 403.
- [x] 2.2 `observe.run` + Sync Log; HTTP client never logs Authorization.
- [x] 2.3 `inbound_webhook` verify + dedupe + enqueue.

## 3. Providers
- [x] 3.1 Calendar push/pull Google + M365; iCal feed token.
- [x] 3.2 Maps geocode + travel minutes; venue/quote use when geo missing.
- [x] 3.3 DocuSign optional send; native sign remains default.
- [x] 3.4 QBO/Xero invoice sync skip-if-disconnected.
- [x] 3.5 Apple Music + YouTube playlist import.

## 4. Owner UI
- [x] 4.1 `/owner/connections` — status, enable, save keys, last error. Rebuild owner SPA.

## 5. Tests
- [x] 5.1 Guest 403; no tenant/site args; secrets absent from list payload.
- [x] 5.2 Webhook duplicate ignored; calendar/maps/accounting degrade without keys.
- [x] 5.3 Sync log append-only; Apple/YouTube URL routing.

## Definition of Done
A tenant can connect calendar/maps/signing/books/music on this site, jobs still save when the provider is down, and the operator can see last errors without secrets in logs.
