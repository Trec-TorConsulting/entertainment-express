## 1. DocTypes & S3 Storage Setup

- [x] 1.1 Create `EE Event Gallery` DocType with token index, PIN access, and quota tracking.
- [x] 1.2 Create `EE Gallery Asset` DocType for individual photos, GIFs, and videos.
- [x] 1.3 Create `EE Print Template` DocType for 2x6 and 4x6 overlay borders.

## 2. Media Ingestion & Background Processing

- [x] 2.1 Implement `upload_booth_media` endpoint supporting multipart image/video uploads.
- [x] 2.2 Add background worker task generating downscaled WebP web versions and thumbnails via Pillow.
- [x] 2.3 Implement `get_guest_gallery` with optional PIN verification.
- [x] 2.4 Implement background ZIP compilation task for client gallery downloads.

## 3. Portal UI & Guest Lightbox

- [x] 3.1 Build `GuestGallery.tsx` at `/gallery/:token` with responsive masonry layout.
- [x] 3.2 Build `LightboxModal.tsx` with mobile swipe gestures and 1-tap download/share.
- [x] 3.3 Build `ClientMediaDashboard.tsx` in `/client/gallery/:booking_id` with photo moderation and ZIP export.
- [x] 3.4 Add on-site QR Code display screen to booth iPad / field app.

## 4. Verification & Testing

- [x] 4.1 Write automated tests `test_media_delivery.py` verifying upload handling, PIN protection, visibility toggles, and tenant storage isolation.
