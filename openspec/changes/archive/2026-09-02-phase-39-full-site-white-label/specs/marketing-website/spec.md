## ADDED Requirements

### Requirement: Product Marketing Excluded From Tenant Kit
The system SHALL NOT apply a tenant white-label kit to the SaaS marketing website at `www.{base_domain}` / apex; those pages remain Entertainment Express product branding.

#### Scenario: www stays EE
- **WHEN** a prospect opens `www.{base_domain}/pricing`
- **THEN** EE product branding is shown regardless of any tenant kit
