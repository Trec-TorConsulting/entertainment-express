## Context
Texas TDI-style annual inspection and documented cleaning are table stakes. Attendee waivers are common at staffed attractions.

## Goals / Non-Goals
**Goals:** Inspection cert DocType; gate availability; sanitization log; attendee QR waiver.
**Non-Goals:** Government e-filing; biometric identity.

## Decisions
### D1 — EE Asset Inspection Certificate
Linked to Service Asset: `authority`, `certificate_no`, `expires_on`, `file`, `required_to_book`. Availability excludes assets with expired required certs.

### D2 — EE Sanitization Log
After check-in: `asset`, `booking`, `cleaned_by`, `cleaned_at`, `method`, `photos`. Optional gate before asset returns to available.

### D3 — Attendee vs payer waiver
Extend Liability Waiver with `waiver_kind` payer|attendee. Public QR `/w/{token}` allows guest/attendee sign without money rights. Payer waiver still required separately when configured.

### D4 — Files
`api/safety.py`, field app QR, tests `test_phase29_safety.py`.

## Migration

Fixtures + patches; rollback by feature flag / unused fields.
