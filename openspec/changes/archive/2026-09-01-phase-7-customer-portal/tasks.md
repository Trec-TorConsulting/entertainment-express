# Tasks: Phase 7 — Customer Portal

> Photos + change requests on `/client`. Owner publishes and decides. Guests 403 on changes. Money via `flt`.

## 1. Schema

- [x] 1.1 DocType `EE Deliverable` (booking, title, kind, file_name, mime, content_b64, published).
      **Accept:** migrate; list APIs never return `content_b64`.
- [x] 1.2 DocType `EE Booking Change` (booking, request_type, requested times, item_code, notes, status).
      **Accept:** migrate; statuses `pending|approved|declined|applied`.

## 2. APIs

- [x] 2.1 `api/deliverables.py`: staff save/publish; members list published; download by membership; 5 MB cap.
      **Accept:** guest cannot upload; unpublished hidden from payer/guest; no `tenant`/`site` args.
- [x] 2.2 `api/booking_changes.py`: payer request; owner list/decide; apply via `reschedule_booking` / `cancel_booking` / `flt` line add.
      **Accept:** guest 403; add-on rate uses `flt`; SPA never multiplies.

## 3. Portal

- [x] 3.1 `/client/photos` lists published files with download; not EmptyState when files exist.
      **Accept:** no `/app`; no DocType names in copy.
- [x] 3.2 `/client` Events: payer requests reschedule, add-on, or cancel.
      **Accept:** guest UI does not offer change requests.
- [x] 3.3 Owner job: upload/publish deliverables; Today approvals include pending changes.
      **Accept:** approve applies; decline stores status.

## 4. Ship

- [x] 4.1 `tests/test_phase7_customer_portal.py`: isolation, guest 403, unpublished hidden, `flt` on add-on.
      **Accept:** pytest on tenant site.
- [x] 4.2 Rebuild `public/{owner,client}/`; bump bench image `0.0.63-ee` → `0.0.64-ee`; migrate tenant sites.
      **Accept:** Photos loads published files for the host.
