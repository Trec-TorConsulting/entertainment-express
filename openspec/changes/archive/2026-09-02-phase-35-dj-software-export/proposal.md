## Why

DJ Intelligence advertises sync/export toward Serato, Virtual DJ, and related tools. EE imports from Spotify/Apple/YouTube but cannot export planning lists into DJ software formats DJs use on event night.

## What Changes

- Export music lists to Serato crate CSV, Rekordbox XML (subset), Virtual DJ folder M3U.
- Crew/owner download from music planning / run sheet.
- Optional webhook/push metadata (no DRM bypass).
- Non-goals: ripping audio files; circumventing streaming licenses.

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `music-planning`: Export actions for must-play / timeline-linked songs.
- `integrations`: DJ software export formats as integration connectors.
- `mobile-field-app`: Crew can download export on phone.
- `employee-portal`: Play view includes export.
- `owner-portal`: Export from job music tab.

## Impact

- Custom Frappe DocTypes/APIs in `entertainment_express`; portal SPA updates; migrate per tenant site.
- Multi-tenant isolation tests required; no cross-site data.
- Depends on earlier competitive-gap phases where noted in ROADMAP.
