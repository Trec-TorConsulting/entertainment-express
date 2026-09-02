## Why

Switching from Inflatable Office, ERS, BCN, Goodshuffle, DJ Event Planner, or DJ Intelligence is painful. EE data-migration has competitor helpers generically; operators need named column-mapping presets and playbooks for those exports.

## What Changes

- Named import presets for IO, ERS, BCN, Goodshuffle, DJEP, DJ Intelligence CSV/exports.
- Guided field maps for customers, inventory, bookings, music lists where available.
- Dry-run validation reports.
- Non-goals: live API pull from competitor accounts without customer-owned export files.

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `data-migration`: Add named competitor presets and validation reports.
- `owner-portal`: Preset picker on Move In / import wizard.
- `service-catalog`: Inventory preset maps into Service Item/Asset.
- `crm`: Customer/lead preset maps.
- `booking-availability`: Booking history preset maps where dates parse.

## Impact

- Custom Frappe DocTypes/APIs in `entertainment_express`; portal SPA updates; migrate per tenant site.
- Multi-tenant isolation tests required; no cross-site data.
- Depends on earlier competitive-gap phases where noted in ROADMAP.
