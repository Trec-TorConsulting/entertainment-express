## 1. Data Model & Backend Terminal APIs

- [x] 1.1 Create `EE Terminal Reader` DocType in `entertainment_express/billing/doctype/ee_terminal_reader/` with fields for name, device type, serial number, connection type, assigned crew/vehicle, and status
- [x] 1.2 Implement `entertainment_express/api/terminal.py` with `get_connection_token` calling Stripe Terminal API for ephemeral tokens
- [x] 1.3 Implement `create_payment_intent` in `terminal.py` with `payment_method_types: ['card_present']`, capture method manual, and booking metadata
- [x] 1.4 Implement `capture_payment` in `terminal.py` to confirm the authorized payment and invoke ERPNext accounting sync
- [x] 1.5 Implement `record_terminal_payment` to generate an ERPNext `Payment Entry` against the booking's `Sales Invoice` and route tips to `Digital Tip Pool`

## 2. PWA Frontend Terminal Integration

- [x] 2.1 Add Stripe Terminal Web SDK (`@stripe/terminal-js`) wrapper and client service in `entertainment_express/public/employee/terminal_service.js`
- [x] 2.2 Build Bluetooth reader discovery & connection interface with Web Bluetooth permissions handling
- [x] 2.3 Build Cloud/WiFi reader selector interface for WisePOS E devices
- [x] 2.4 Build the On-Site POS Checkout Drawer component on the Event Wrap-Up view in `/employee`
- [x] 2.5 Build the Tip Selection Screen with standard prompts (15%, 20%, 25%, Custom, No Tip)
- [x] 2.6 Add digital receipt modal allowing client SMS phone number or email entry

## 3. Automated Tests & Verification

- [x] 3.1 Create unit test suite `tests/test_terminal_pos.py` testing connection token generation, mock payment intent creation, and capture
- [x] 3.2 Add test for ERPNext `Payment Entry` creation and invoice balance decrement
- [x] 3.3 Add test for Tip Pool allocation from Terminal in-person transactions
- [x] 3.4 Verify multi-tenant isolation ensuring terminal connection tokens only access the tenant's own Stripe account
- [x] 3.5 Run `python3 smoke_test.py` and `openspec validate --specs`
