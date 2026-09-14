# Capability: gig-payroll-commission-tips

## Purpose
Manage automated gig-worker compensation, multi-tiered event rate cards, sales commission accruals and clawbacks, digital tip pool splitting policies, and batch payroll generation into ERPNext salary records.

## Requirements

### Requirement: Gig Rate Card Computation
The system SHALL evaluate worker `Gig Rate Card` rules (flat fee, hourly rate, role differential, and overtime multiplier) against completed gig assignments and timesheets to determine base gross pay.

#### Scenario: Calculating flat gig fee
- **WHEN** a Lead DJ completes a 4-hour wedding reception with a $400 flat gig rate card
- **THEN** the system calculates base gross pay as $400, recording any hours beyond the contracted window as billable overtime

#### Scenario: Role differential calculation
- **WHEN** an employee works as a photo booth attendant on Friday and a Lead DJ on Saturday
- **THEN** each event's earnings reflect the specific role rate assigned for that booking

### Requirement: Automated Sales Commission Calculation
The system SHALL calculate sales representative commissions upon client invoice payment according to configured `Commission Rule` records (percentage of gross revenue or percentage of net profit).

#### Scenario: Accruing sales commission on invoice payment
- **WHEN** a customer pays a $4,000 event invoice and the booking agent has an active 8% commission rule
- **THEN** the system generates a $320 commission accrual credit linked to that agent's next payroll batch

#### Scenario: Clawback on refunded booking
- **WHEN** an event is cancelled and refunded
- **THEN** unearned commission accruals are reversed automatically with audit logging

### Requirement: Post-Event Digital Tip Splitting
The system SHALL aggregate client tips paid via online checkout or post-event tipping links and distribute the tip pool among assigned on-site crew based on the tenant's chosen allocation policy.

#### Scenario: Equal tip split among crew
- **WHEN** a client adds a $150 digital tip to an event worked by 3 crew members under an Equal Split policy
- **THEN** the system allocates $50 to each assigned worker's earnings ledger

#### Scenario: Hours-weighted tip split
- **WHEN** an event has a 6-hour Lead DJ and a 3-hour Booth Assistant under an Hours-Weighted policy with a $90 tip pool
- **THEN** the system allocates $60 to the Lead DJ and $30 to the Assistant

### Requirement: Single-Click Payroll Batch Generation
The system SHALL compile approved gig timesheets, commission credits, and tip allocations for any selected pay cycle into an ERPNext `Payroll Entry` with individual `Salary Slip` records.

#### Scenario: Compiling bi-weekly payroll batch
- **WHEN** an owner clicks "Process Payroll Batch" for a 14-day pay period
- **THEN** the system creates draft `Salary Slip` documents itemizing base gig pay, overtime, commissions, and tips for all active workers without data duplication
