## Why

Photo booth operators, 360-video vendors, and event photographers suffer from fragmented workflows. They capture media using local booth software (dslrBooth, Touchpix, Simple Booth), but delivering those deliverables to clients and guests requires messy third-party tools like Google Drive, Dropbox, or costly gallery hosting subscriptions (SmugMug, Pixieset). Guests hate downloading dedicated apps or registering accounts just to grab a single party photo. Furthermore, disconnected delivery undermines post-event referral marketing and review generation.

## What Changes

- Introduce a native **Event Media Gallery Pipeline** in Frappe with S3/MinIO cloud object storage integration.
- Provide a responsive, app-free **Guest Gallery View** at `/gallery/:token` accessible via dynamic QR code generated at the event booth or printed on photo strips.
- Support **Instant Live Cloud Ingestion**: watch folders and field API endpoints that automatically ingest photos/GIFs/MP4s from photo booth rigs during the event.
- Deliver **Client Deliverables Control** in `/client/gallery`: clients can review full-resolution originals, mark favorites, hide embarrassing photos, and download complete high-res ZIP archives.
- Add an integrated **Print & Digital Template Overlay Customizer** allowing operators to design branded 2x6 strips and 4x6 frames with event names, custom graphics, and sponsor logos.

## Capabilities

### New Capabilities
- `media-delivery-guest-galleries`: Automated event photo/video cloud ingestion, zero-friction guest QR galleries, client curation, ZIP archiving, and print overlay customization.

### Modified Capabilities
- `customer-portal`: Enriched with media gallery management tab and download engine.
- `mobile-field-app`: Added live QR display and watch-folder sync status for booth operators.

## Impact

- **DocTypes**:
  - `EE Event Gallery`: Linked to `Booking`, stores gallery token, privacy mode (`Public`, `PIN Protected`, `Private`), download permissions, watermark toggle.
  - `EE Gallery Asset`: Stores original S3 URL, thumbnail URL, web-optimized URL, media type (`Photo`, `GIF`, `Video`), capture timestamp, favorite count.
  - `EE Print Template`: Template dimensions (`2x6`, `4x6`), background graphic, overlay PNG, text zones.
- **Server APIs**:
  - `entertainment_express.media_delivery.api.ingest_media_asset(gallery_token, file_bytes, metadata)`
  - `entertainment_express.media_delivery.api.get_guest_gallery(gallery_token, pin=None)`
  - `entertainment_express.media_delivery.api.generate_gallery_zip(gallery_id)`
- **Portal UI**:
  - Client Route: `/client/gallery/:booking_id` (Favorites, privacy, bulk ZIP download).
  - Public Guest Route: `/gallery/:token` (Masonry layout, 1-tap download, social share).
  - Booth Field View: `/employee/booth/live` (Live upload count, QR code display on iPad).
