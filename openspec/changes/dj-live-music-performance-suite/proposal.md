## Why

Mobile DJs, wedding MCs, and live performance bands face a glaring technological divide. Generic CRMs (HoneyBook, Dubsado) treat music planning like a plain text memo, while legacy DJ tools (DJEP, DJ Intelligence) look like 2005 software and lack modern streaming integrations. DJs spend hours manually re-typing client song lists into Serato, Rekordbox, or VirtualDJ. On event day, guests constantly harass DJs at the booth shouting requests or asking for Venmo handles. DJs need a modern client music planner with Spotify search, native 1-click export to professional DJ software, and an interactive "Ask The DJ" live request feed with guest tipping.

## What Changes

- Implement a rich, mobile-first **Client Music Planning Portal** (`/client/music/:booking_id`) with Spotify API search, audio preview snippets, album artwork, and strict categorization (Must Play, Play If Possible, Dedication, Do Not Play, Special Formal Dances).
- Provide automated **DJ Software Playlist Exporters** supporting:
  1. **Serato DJ Pro** Crate CSV
  2. **Pioneer Rekordbox** XML (NML/Rekordbox collection format)
  3. **Atomix VirtualDJ** `.vdjfolder` / XML playlist
  4. Standard **M3U8** text playlist
- Introduce a real-time, tokenized **"Ask The DJ" Live Request & Tipping Feed**: guests scan a table tent or booth QR code (`/requests/:event_token`) to search songs, add notes, and optionally attach a digital cash tip via Apple Pay / Stripe.
- Provide a high-contrast, touch-optimized **Live DJ Performance Deck** (`/employee/dj/live`) with real-time request polling, 1-tap "Queue / Play / Reject" actions, and Do-Not-Play conflict warning popups.

## Capabilities

### New Capabilities
- `dj-live-music-performance-suite`: Spotify-powered client music curation, Serato/Rekordbox/VirtualDJ playlist format export, guest live request portal, and digital tipping request queue.

### Modified Capabilities
- `music-planning`: Enhanced with specialized dance timeline hooks and external streaming metadata.
- `employee-portal`: Adds live gig cockpit for performing talent.

## Impact

- **DocTypes**:
  - `EE Booking Track`: Link to `Booking`, track title, artist, Spotify ID, category (`Must Play`, `Play If Possible`, `Do Not Play`, `Formal Dance`), timing moment, notes.
  - `EE Live Song Request`: Tokenized guest request, guest name, song title, artist, tip amount, payment status, DJ status (`Pending`, `Queued`, `Played`, `Declined`).
- **Server APIs**:
  - `entertainment_express.music_planning.api.search_spotify_tracks(query)`
  - `entertainment_express.music_planning.api.export_playlist_file(booking_id, format)`
  - `entertainment_express.music_planning.api.submit_live_request(token, track_data, tip_amount)`
  - `entertainment_express.music_planning.api.update_request_status(request_id, status)`
- **Portal UI**:
  - Client Route: `/client/music/:booking_id` (Spotify search, drag-and-drop order, formal dance assignments).
  - Public Guest Route: `/requests/:token` (Mobile guest request pad & tip checkout).
  - DJ Live Route: `/employee/dj/live` (Dark-mode live request feed, high-contrast text, sound alerts).
