# Tasks: Phase 15 — Event Planning Suite

> Do tasks in order. Check a box only when acceptance passes.

## 1. DocTypes
- [x] 1.1 Planning Form Template + Field child + Field Library Item.
- [x] 1.2 Planning Form Instance + Answer child.
- [x] 1.3 Timeline Template + items; Event Timeline + items; Timeline Change Request.
- [x] 1.4 Song, Music Selection, Curated Playlist + songs, Guest Request Link (hashed token).
- [x] 1.5 Event Booking `event_type` field.

## 2. APIs & automation
- [x] 2.1 Template CRUD, instance get/save with conditionals and completion %.
- [x] 2.2 Auto-attach on confirmed booking; daily reminders; evaluation on complete.
- [x] 2.3 Timeline CRUD, apply template, client change requests, finalize.
- [x] 2.4 Music client CRUD, library check, DJ play view, guest request + do-not-play screen.
- [x] 2.5 Playlist import (Spotify when configured; clear error otherwise).
- [x] 2.6 Enrich `get_run_sheet` with planning, timeline, music.

## 3. Portal
- [x] 3.1 `/client/planning`, `/client/timeline`, replace `/client/music` stub, public `/guest-requests`.

## 4. Tests
- [x] 4.1 Conditionals, auto-attach, reminder skip-when-complete.
- [x] 4.2 Timeline template + finalize lock.
- [x] 4.3 Guest request screened against do-not-play; isolation (customer cannot read another booking).

## Definition of Done
Staff can ship a wedding template; confirmed bookings get a form; clients save progress; DJs see answers and music on the run sheet; guests can request songs on a token link.
