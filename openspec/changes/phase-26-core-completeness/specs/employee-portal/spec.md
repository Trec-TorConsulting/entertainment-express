## ADDED Requirements

### Requirement: Warehouse-Only Pull Sheet
The system SHALL show field/dispatch pull sheets with warehouse or stock/rental lines only — service-only catalog rows SHALL NOT appear as pack items.

#### Scenario: Crew opens a pull sheet
- **WHEN** a dispatcher or crew opens the pull sheet for a job
- **THEN** only items that must be pulled from inventory/warehouse are listed
