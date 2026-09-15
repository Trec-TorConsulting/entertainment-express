## ADDED Requirements

### Requirement: Autonomous Emergency Call-Out & Dispatch Resolver
The system SHALL detect crew call-outs, identify qualified off-duty replacements based on role, skills, distance, and overtime limits, and execute automated emergency SMS broadcasts with configurable incentive bonuses.

#### Scenario: Lead worker sick call
- **WHEN** a lead DJ marks an emergency call-out 3 hours prior to an event
- **THEN** the system generates a tiered SMS broadcast to 5 closest qualified off-duty DJs with a $150 emergency bonus, auto-assigns the first to reply YES, updates the run sheet, and alerts the owner

### Requirement: Computer Vision Load-Out and Damage Quarantine
The system SHALL analyze mobile camera photos of loaded vans and teardown equipment to verify Production BOM fulfillment and detect physical gear damage before damage deposit holds expire.

#### Scenario: Missing gear alert before van departs
- **WHEN** crew captures a photo of the loaded van inventory
- **THEN** the vision model compares visible equipment against the pull sheet and alerts if required items (e.g. wireless mic kit) are missing

#### Scenario: On-site damage quarantine
- **WHEN** a torn inflatable seam or cracked speaker cabinet is photographed at teardown
- **THEN** the asset is placed in Maintenance Quarantine and a claim hold is flagged on the customer's credit card deposit

### Requirement: AI Voice Receptionist and Phone Lead Capture
The system SHALL answer inbound phone calls via Twilio Voice, conduct natural conversational intake, check live service availability in MariaDB, and dispatch an instant proposal link to the caller's mobile device.

#### Scenario: After-hours inquiry call
- **WHEN** a prospective customer calls at 9 PM asking about photo booth availability for Saturday
- **THEN** the voice agent confirms availability, captures the caller's event location and email, and texts an interactive booking link before the call concludes

### Requirement: Dynamic Surge & Yield Pricing Engine
The system SHALL monitor booking density and inquiry velocity per calendar date, applying automated price escalators or minimum rental durations to peak demand dates.

#### Scenario: Peak October Saturday pricing
- **WHEN** a tenant reaches 80% asset utilization for an October Saturday with 3 weeks remaining
- **THEN** the dynamic pricing engine applies a 20% surge rate to new quotations for that date

### Requirement: AI Review Interceptor & Reputation Catalyst
The system SHALL analyze post-event client sentiment and route 5-star experiences directly to public review platforms while intercepting sub-par experiences for immediate owner resolution.

#### Scenario: Intercept negative experience
- **WHEN** a post-event survey or message contains negative sentiment regarding music volume or late arrival
- **THEN** the system suppresses the public Google review link, flags a critical alert on `/owner`, and drafts a resolution email with a credit voucher
