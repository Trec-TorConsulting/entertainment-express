## Context

For wedding DJs and mobile entertainers, the music and timeline curation is the artistic core of their business. Couples spend months agonizing over the First Dance and strict Do-Not-Play lists. If a guest asks the DJ to play the "Macarena" and it's on the bride's sacred Do-Not-Play list, playing it is catastrophic. By integrating the client planning database directly with the DJ booth screen and live guest requests, we automate Do-Not-Play cross-checks and give performers an effortless digital tip stream.

## Goals / Non-Goals

**Goals:**
- Provide Spotify Web API search with 30-second audio previews in the client planning portal.
- Enforce Do-Not-Play conflict alerts: if a guest requests a track on the Do-Not-Play list, automatically alert the DJ and prevent accidental playback.
- Export clean, valid Serato CSV, Rekordbox XML, and VirtualDJ XML files that import into DJ software in seconds.
- Accept guest tips ($5, $10, $20, custom) alongside requests with instant credit card / Apple Pay processing.
- Provide high-contrast, dark-mode iPad/laptop view for DJs running in dark club or reception venue lighting.

**Non-Goals:**
- Streaming audio directly inside Frappe (the DJ uses their own offline local music library and DJ software for actual playback).
- Pitch/tempo matching or audio mixing engine (DJ handles performance in Serato/Rekordbox).

## Architecture & DocType Definitions

### 1. `EE Booking Track`
- **Fields:**
  - `booking`: Link to `Booking`
  - `song_title`: Data (required)
  - `artist_name`: Data (required)
  - `spotify_id`: Data
  - `album_art_url`: Data
  - `preview_url`: Data
  - `category`: Select (`Must Play`, `Play If Possible`, `Guest Request`, `Do Not Play`, `Ceremony / Formal`)
  - `formal_moment`: Select (`None`, `Processional`, `Recessional`, `Grand Entrance`, `First Dance`, `Father-Daughter`, `Mother-Son`, `Cake Cutting`, `Bouquet Toss`, `Last Dance`)
  - `client_notes`: Small Text

### 2. `EE Live Song Request`
- **Fields:**
  - `booking`: Link to `Booking`
  - `guest_name`: Data
  - `song_title`: Data
  - `artist_name`: Data
  - `spotify_id`: Data
  - `tip_amount`: Currency (default 0.0)
  - `tip_status`: Select (`None`, `Paid`, `Failed`)
  - `dj_status`: Select (`Pending`, `Queued`, `Played`, `Declined`)
  - `decline_reason`: Select (`Do Not Play List`, `Not Appropriate for Event`, `Time Constraint`, `Track Unavailable`)

## Server APIs & Python Hooks

File: `entertainment_express/music_planning/api.py`

```python
import frappe

@frappe.whitelist()
def search_spotify_catalog(query):
    """Proxies search to Spotify Web API, caching track metadata."""
    pass

@frappe.whitelist()
def export_dj_playlist(booking_id, format="serato"):
    """
    Generates downloadable playlist file:
    format='serato' -> text/csv
    format='rekordbox' -> application/xml
    format='virtualdj' -> application/xml
    format='m3u8' -> audio/x-mpegurl
    """
    pass

@frappe.whitelist(allow_guest=True)
def submit_guest_song_request(event_token, title, artist, guest_name, tip_amount=0):
    """Logs guest request and creates Stripe payment intent if tip > 0."""
    pass

@frappe.whitelist()
def poll_live_dj_requests(booking_id, last_timestamp=None):
    """High-frequency polling endpoint for live DJ screen."""
    pass
```

## Frontend Portal Architecture

- **Path:** `apps/portal-kit/src/pages/client/music/MusicPlanner.tsx`
  - `SpotifySearchInput`: Instant autocomplete with audio preview player.
  - `FormalMomentsTimeline`: Cards for First Dance, Entrance, etc. with dedicated track slots.
  - `TrackCategoryList`: Must-Play (counter badge e.g. "12 / 15"), Play If Possible, Do-Not-Play.
- **Path:** `apps/portal-kit/src/pages/public/GuestSongRequest.tsx` (`/requests/:token`)
  - Mobile-first dark theme, quick song search, tip selection buttons ($5, $10, $20), Apple Pay checkout.
- **Path:** `apps/portal-kit/src/pages/employee/dj/LiveDjScreen.tsx` (`/employee/dj/live`)
  - Fullscreen dark UI with audio ding on new request, red "DO NOT PLAY CONFLICT" warning banner, and 1-tap queue buttons.

## Multi-Tenant Isolation & Security

- Event tokens for guest requests map strictly to the tenant site matching the domain.
- Tips are routed directly to the tenant's connected Stripe account.

## Risks & Mitigations

- **Risk:** Internet outage at venue blocks DJ from checking live requests.
- **Mitigation:** The live DJ screen uses LocalStorage caching; exported Serato/Rekordbox playlists are downloaded prior to event day.
