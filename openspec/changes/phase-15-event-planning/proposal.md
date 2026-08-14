# Change: Phase 15 — Event Planning Suite

## Why
The post-booking client experience is the product differentiator for DJs, booths, and live entertainment.
Competitors (DJ Event Planner, Check Cherry) win on planning forms, run-of-show, and music lists. EE already
takes deposits; without this suite the tenant still runs the event in spreadsheets.

## What Changes
A tenant-configurable **planning-form engine**, a collaborative **event timeline**, and **music planning**
(client lists, curated suggestions, guest requests, library check, DJ play view). Surfaces in Desk, `/client`,
run sheets, and the crew APIs. Streaming playlist import uses real provider APIs when credentials exist and
fails clearly when they do not — never fake tracks.

## Impact
- New module `Event Planning` with DocTypes, APIs, scheduler, public guest-request page, client portal pages.
- Auto-attach forms on booking confirm; reminders until complete; post-event evaluation forms.
- Run sheet / `get_run_sheet` include planning answers, timeline, and music.
- Depends on: phase-1 bookings, notifications, phase-2 run sheets.

## Non-Goals
- Full Spotify/Apple OAuth UX (server-side playlist import when keys are configured is in scope).
- Phase-13 two-way calendar or accounting sync.
- Live on-floor guest wall as a separate product (guest request page is in scope).

## Requirements delivered
- `event-planning-forms`: all requirements (templates, conditionals, auto-attach, portal save, reminders,
  crew visibility, post-event eval).
- `event-timeline`: all requirements (CRUD, templates, client suggestions + staff approval, song linkage,
  finalize/distribute).
- `music-planning`: all requirements except live provider keys (import path is real; unconfigured providers
  return an actionable error).
