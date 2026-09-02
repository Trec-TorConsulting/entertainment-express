## Context
DJs prepare crates in Serato/Rekordbox/VDJ. EE already stores Music Selection rows.

## Goals / Non-Goals
**Goals:** Export endpoints; format adapters; audit download.
**Non-Goals:** Providing copyrighted audio binaries.

## Decisions
### D1 — Metadata export only
Title, artist, BPM if known, notes, list type — not audio files.

### D2 — Formats
`serato_csv`, `rekordbox_xml`, `m3u`. Adapter in `integrations/dj_export.py`.

### D3 — Files
`api/music_export.py`, tests `test_phase35_dj_export.py`.

## Migration

Fixtures + patches; feature-flag rollback where applicable.
