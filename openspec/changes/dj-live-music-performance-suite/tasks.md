## 1. DocTypes & Music Schema

- [x] 1.1 Create `EE Booking Track` DocType with category selection, formal moment, and Spotify metadata.
- [x] 1.2 Create `EE Live Song Request` DocType with tip processing and DJ workflow status.

## 2. Server APIs & DJ File Exporters

- [x] 2.1 Implement Spotify Web API track search proxy with Redis caching.
- [x] 2.2 Implement Serato CSV, Rekordbox XML, and VirtualDJ playlist format generators.
- [x] 2.3 Implement public `submit_guest_song_request` endpoint with optional Stripe payment intent.
- [x] 2.4 Implement `poll_live_dj_requests` endpoint with Do-Not-Play conflict cross-checking.

## 3. Portal UI & Live Booth Cockpit

- [x] 3.1 Build `MusicPlanner.tsx` in `/client/music/:booking_id` with Spotify search and audio previews.
- [x] 3.2 Build `GuestSongRequest.tsx` at `/requests/:token` with mobile tip checkout.
- [x] 3.3 Build `LiveDjScreen.tsx` in `/employee/dj/live` with dark-mode request feed and Do-Not-Play alerts.

## 4. Verification & Testing

- [x] 4.1 Write automated tests `test_music_planning.py` verifying playlist XML/CSV syntax, Do-Not-Play conflict triggers, and tip payment handling.
