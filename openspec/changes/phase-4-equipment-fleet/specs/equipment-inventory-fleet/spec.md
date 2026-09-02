## ADDED Requirements

### Requirement: Packing List Follows The Job
Packing list read/update SHALL find the list by the job (booking), not by assuming the list’s name equals the job name.

#### Scenario: Pack after generate
- **WHEN** a pull sheet was generated for a job and crew marks a line packed
- **THEN** that line is packed even when the list’s name is not the job name
