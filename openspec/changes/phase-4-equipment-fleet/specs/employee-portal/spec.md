## ADDED Requirements

### Requirement: Pull Sheet Pack And Scan
`EE Crew` / `EE Dispatcher` SHALL generate a pull sheet, mark or scan items packed, scan gear out and back, and report damage from `/employee` without Desk. Crew SHALL NOT transfer warehouse stock or create sub-rentals.

#### Scenario: Crew cannot move warehouse stock
- **WHEN** an `EE Crew` user requests a stock transfer
- **THEN** access is denied
