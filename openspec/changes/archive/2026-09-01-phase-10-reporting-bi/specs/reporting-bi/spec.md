## ADDED Requirements

### Requirement: Period canned company pack
The system SHALL compute owner report metrics for a requested date range from this site’s invoices and jobs, returning backend-formatted money strings.

#### Scenario: Owner picks a month
- **WHEN** an owner requests the company pack for a from/to date
- **THEN** billed, outstanding, tax, deposits held, payouts due, pipeline, and utilization reflect that range on this site only
