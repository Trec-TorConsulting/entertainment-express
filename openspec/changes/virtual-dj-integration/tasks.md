## 1. Native VirtualDJ Export Formats

- [ ] 1.1 Implement `export_virtualdj_folder(rows)` in `entertainment_express/api/music_export.py` generating standard `.vdjfolder` XML with `<VirtualFolder>` and `<Song>` tags.
- [ ] 1.2 Update `export_playlist` in `entertainment_express/api/music_export.py` to register `virtualdj_folder` (`.vdjfolder`) and `virtualdj_m3u` formats with appropriate MIME types.
- [ ] 1.3 Add unit tests verifying VirtualDJ XML structure, XML entity escaping, and track count accuracy.

## 2. VirtualDJ Live Request Feed ("Ask The DJ")

- [ ] 2.1 Implement secure token generation and verification for event live feeds in `entertainment_express/api/virtual_dj.py`.
- [ ] 2.2 Implement `@frappe.whitelist(allow_guest=True)` endpoint `get_live_requests(token)` returning unplayed approved song requests for the event.
- [ ] 2.3 Implement `@frappe.whitelist(allow_guest=True)` endpoint `acknowledge_request(token, request_id)` to mark requests as played directly from the DJ console.
- [ ] 2.4 Add unit tests for live request endpoint security (valid token, invalid token rejection, tenant isolation).

## 3. Set History Ingestion & Auto-Reconciliation

- [ ] 3.1 Implement parser for VirtualDJ `history.txt` and XML history logs in `entertainment_express/api/virtual_dj.py` extracting timestamp, artist, and track title.
- [ ] 3.2 Implement fuzzy reconciliation algorithm matching played history against booking `Music Selection` records.
- [ ] 3.3 Implement `@frappe.whitelist()` endpoint `reconcile_history(booking, history_text)` updating matched items to `status="played"` and creating audit trail comments.
- [ ] 3.4 Add unit tests for history parsing variations, fuzzy match accuracy, and unassigned crew permission rejection.

## 4. AI Virtual DJ Set Curation Engine

- [ ] 4.1 Implement `generate_ai_set(booking, vibe, target_bpm, duration_minutes)` in `entertainment_express/api/virtual_dj.py` calling the local AI assistant.
- [ ] 4.2 Define structured prompt for timeline moment sequencing, energy curve modeling, mandatory inclusion of must-plays, and strict filtering of do-not-plays.
- [ ] 4.3 Implement graceful offline fallback to tenant `Curated List` items with `available: false` and message `"AI suggestion unavailable"`.
- [ ] 4.4 Add unit tests for AI set curation: constraint adherence (do-not-play filtering), timeline mapping, and offline fallback behavior.

## 5. Multi-Tenant Isolation & Verification

- [ ] 5.1 Implement comprehensive multi-tenant isolation tests ensuring tokens, live feeds, history logs, and AI generations are strictly site-bound.
- [ ] 5.2 Validate baseline specifications with `openspec validate --specs`.
