## 1. DocType & Schema Foundation

- [x] 1.1 Create `EE Brand` DocType with visual styling, domain mapping, comms numbers, and statement descriptors.
- [x] 1.2 Add `brand` Link field to `Booking`, `Quotation`, `Opportunity`, and `Sales Invoice`.
- [x] 1.3 Add Frappe hook to automatically link `brand` to `Cost Center` on sales transactions.

## 2. Server APIs & Communications Routing

- [x] 2.1 Implement `entertainment_express.multi_brand.api.get_brand_theme_by_host` with host caching.
- [x] 2.2 Implement communication hook overriding outbound email From address and sender name.
- [x] 2.3 Implement Twilio sender phone number selection based on `Booking.brand`.
- [x] 2.4 Add dynamic Stripe statement descriptor pass-through during charge intent creation.

## 3. Frontend Portals & Brand Customization

- [x] 3.1 Build `BrandThemeProvider.tsx` in Portal-Kit dynamically setting CSS color variables.
- [x] 3.2 Add `BrandSwitcher.tsx` to Owner Portal navigation header.
- [x] 3.3 Build `BrandSettingsView.tsx` at `/owner/settings/brands` for brand CRUD operations.
- [x] 3.4 Verify `/client` dynamically adopts the theme of the active booking's brand.

## 4. Verification & Testing

- [x] 4.1 Write automated tests `test_multi_brand.py` testing brand resolution by host, email header customization, and statement descriptor overrides.
