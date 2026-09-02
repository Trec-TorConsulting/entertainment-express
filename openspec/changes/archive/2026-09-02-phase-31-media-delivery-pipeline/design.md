## Context
Booth operators need gallery delivery as a product. Phase-7 deferred external gallery OAuth; this builds native MinIO-backed galleries.

## Goals / Non-Goals
**Goals:** Gallery DocType; upload; publish; share tokens; templates metadata; print counts.
**Non-Goals:** TikTok/Instagram auto-post; AI face swap.

## Decisions
### D1 — EE Media Gallery + EE Media Item
Gallery linked to booking; items in S3/MinIO; `published`, `share_token`, `print_count`, `template_name`.

### D2 — Share links
Tokenized public URL; expire configurable; no login required for view/download of published items.

### D3 — Files
`api/media_gallery.py`, field upload hooks, tests `test_phase31_media.py`.

## Migration

Fixtures + patches; feature-flag rollback where applicable.
