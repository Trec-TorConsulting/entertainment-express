## Why

Mobile DJs and entertainment operators using Atomix VirtualDJ—one of the industry's premier performance platforms—need deep, seamless integration with Entertainment Express. Currently, EE supports static metadata exports for Serato and Rekordbox, but lacks native VirtualDJ crate/folder formats (`.vdjfolder`), real-time live request polling for VirtualDJ's "Ask The DJ" interface, and post-event history log reconciliation. Furthermore, solo DJs and event coordinators need an intelligent AI "Virtual DJ" curation engine to automatically draft cohesive, energy-curved playlists tailored to client preferences, must-play/do-not-play constraints, and timeline moments (e.g. cocktails, dinner, grand entrance, peak party).

## What Changes

- **Native Atomix VirtualDJ Export**: Add native VirtualDJ `.vdjfolder` XML export and VirtualDJ-tagged M3U playlists with BPM, key, and comment tags, exportable by booking, category, or timeline moment.
- **VirtualDJ Live Request Feed ("Ask The DJ" API)**: Provide a secure, tokenized endpoint for VirtualDJ software and web views to poll real-time approved guest and client requests for active events, allowing DJs to see requests directly inside VirtualDJ.
- **Set History Ingestion & Auto-Reconciliation**: Support uploading VirtualDJ session history logs (`history.txt` or VirtualDJ Database XML). Automatically reconcile played tracks against `Music Selection` records, marking matched items as `played` with timestamps for client after-action reports.
- **AI "Virtual DJ" Automated Set Curation**: Add an AI curation engine powered by EE's Ollama/AI framework that analyzes event type, client vibe, must-plays, do-not-plays, and timeline phases to auto-generate cohesive, BPM/energy-curved track suggestions.
- **Portal UI Surfaces**: Add VirtualDJ export options, live request token management, history log upload dropzone, and "Generate AI Set" wizard in `/employee` and `/owner` music planning views.

## Capabilities

### New Capabilities
<!-- None: all changes extend existing capabilities -->

### Modified Capabilities
- `music-planning`: Add requirements for VirtualDJ `.vdjfolder` export, VirtualDJ live request feed, history log reconciliation, and AI-driven automated playlist curation.
- `integrations`: Add VirtualDJ software connector specifications (file formats, tokenized polling feed, history ingestion).
- `ai-assistant`: Add requirements for AI Virtual DJ set curation, energy curve modeling, and timeline-aligned song suggestions.

## Impact

- **Backend APIs**:
  - `entertainment_express/api/music_export.py`: Extend `export_playlist` with `vdjfolder` format handler and VirtualDJ M3U formatting.
  - `entertainment_express/api/virtual_dj.py` (new): Endpoints for tokenized live request feed (`/api/method/entertainment_express.api.virtual_dj.get_live_requests`), history log parsing and reconciliation (`reconcile_history`), and AI set generation (`generate_ai_set`).
- **AI Engine**:
  - `entertainment_express/api/ai.py`: Add `generate_virtual_dj_set()` with structured JSON prompts and graceful fallback.
- **Portal UI**:
  - Music tabs in `/owner` and `/employee` portals updated with VirtualDJ export, live feed link generator, history log upload, and AI set generator.
- **Security & Multi-Tenancy**:
  - Live request feeds secured by per-booking scoped access tokens; strict tenant site isolation verified by automated unit tests.
