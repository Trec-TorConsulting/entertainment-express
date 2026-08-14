# Change: Phase 4 — Equipment, Inventory & Fleet

## Why
Mobile-entertainment operators live and die by gear: bounce houses, booths, DJ rigs, trucks. Phase 1 has a
bookable `Service Asset` with availability, but no condition, checkout, packing lists, fleet, maintenance,
multi-warehouse stock, or sub-rentals. Without this, dispatch still guesses what is on the truck.

## What Changes
Extend `Service Asset` with condition, location, barcode/QR. Add vehicles, maintenance, damage reports,
check-out/in logs, packing lists, stock balances + transfers, sub-rentals. Availability excludes
maintenance / out-of-service / checked-out gear. Crew can scan QR to check out/in.

## Impact
- New module `Equipment Fleet`. APIs in `api/fleet_ops.py`. Daily expiry/reorder alerts.
- Depends on: phase-1 Service Asset + bookings, phase-2 run sheets.

## Non-Goals
- Full vendor CRM (phase-17). Sub-rental stores supplier name + cost only.
- Native hardware barcode printers (codes are generated and printable).

## Requirements delivered
All of `equipment-inventory-fleet`.
