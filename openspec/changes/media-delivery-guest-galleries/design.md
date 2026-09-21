## Context

Delivering photos and videos to guests within minutes of capture creates maximum delight and social media virality. When guests scan a QR code at the photo booth, they expect instant access to their photo or MP4 boomerang clip in mobile Safari or Chrome without installing apps or filling out registration forms.

## Goals / Non-Goals

**Goals:**
- Provide tokenized public gallery at `/gallery/:token` with optional 4-digit PIN security.
- Accept multipart file uploads via authenticated booth API tokens.
- Generate web-optimized WebP previews and thumbnails automatically via PIL / Pillow background workers.
- Support 1-tap download of individual photos and background ZIP compilation for full gallery download.
- Protect tenant storage quotas: enforce maximum total MB per gallery based on tenant subscription plan.

**Non-Goals:**
- Full AI face-recognition search (focus is on fast chronological masonry gallery and client favorite curation).
- Video transcoding farm for 4K video (support direct playback of H.264 MP4 clips up to 60 seconds).

## Architecture & DocType Definitions

### 1. `EE Event Gallery`
- **Fields:**
  - `booking`: Link to `Booking` (required, unique)
  - `title`: Data (e.g. "Sarah & Alex's Wedding Booth")
  - `token`: Data (unique secure hash)
  - `privacy_mode`: Select (`Public`, `PIN Protected`, `Client Only`)
  - `access_pin`: Data (4-digit numeric string)
  - `allow_guest_downloads`: Check (default 1)
  - `watermark_guest_downloads`: Check (default 0)
  - `total_photos`: Int (default 0)
  - `total_videos`: Int (default 0)
  - `storage_used_mb`: Float (default 0.0)
  - `is_live`: Check (default 1)

### 2. `EE Gallery Asset`
- **Fields:**
  - `gallery`: Link to `EE Event Gallery`
  - `asset_name`: Data
  - `media_type`: Select (`Photo`, `GIF`, `Video`)
  - `original_url`: Data
  - `thumbnail_url`: Data
  - `web_url`: Data
  - `is_hidden`: Check (default 0, set by client)
  - `is_favorite`: Check (default 0)
  - `file_size_bytes`: Int

## Server APIs & Python Hooks

File: `entertainment_express/media_delivery/api.py`

```python
import frappe
from frappe.utils.background_jobs import enqueue

@frappe.whitelist(allow_guest=True)
def get_guest_gallery(token, pin=None):
    """Returns list of visible media assets for public gallery view."""
    pass

@frappe.whitelist()
def upload_booth_media(booking_token):
    """Accepts multipart media upload from photo booth software or mobile app."""
    pass

@frappe.whitelist()
def toggle_asset_visibility(asset_id, is_hidden):
    """Allows authenticated client to hide a photo from public guest gallery."""
    pass

@frappe.whitelist()
def request_gallery_zip(booking_id):
    """Enqueues background task to compile all high-res photos into downloadable ZIP."""
    pass
```

## Frontend Portal Architecture

- **Path:** `apps/portal-kit/src/pages/public/GuestGallery.tsx`
- **Subcomponents:**
  - `GalleryMasonry`: Responsive grid of photos/GIFs/MP4s with lazy loading.
  - `LightboxModal`: Fullscreen swipeable carousel with high-res zoom, 1-tap download, and native Web Share API button.
  - `PinEntryDialog`: Clean numeric keypad modal for PIN-protected galleries.
- **Client Path:** `apps/portal-kit/src/pages/client/media/ClientMediaDashboard.tsx`
  - `FavoriteManager`: Filter view for favorites.
  - `HidePhotoToggle`: Client moderation overlay.
  - `ZipDownloadCard`: Progress indicator for ZIP archive readiness.

## Multi-Tenant Isolation & Security

- Gallery assets are organized in object storage under bucket path `tenants/{site_name}/galleries/{booking_id}/`.
- Public gallery queries strictly verify that the requested `token` belongs to the tenant site database matching the current HTTP request.

## Risks & Mitigations

- **Risk:** High-resolution photo uploads overwhelm server disk or bandwidth.
- **Mitigation:** Directly stream file uploads to S3/MinIO compatible object storage; process downscaled WebP thumbnails asynchronously using Frappe background workers.
