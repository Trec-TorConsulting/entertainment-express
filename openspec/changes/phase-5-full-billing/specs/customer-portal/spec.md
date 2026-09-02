## ADDED Requirements

### Requirement: Client Picks A Connected Processor
`/client/pay` SHALL start hosted checkout on a tenant-enabled processor (Stripe, Square, PayPal, ACH, Authorize.Net) with an optional tip. Guests SHALL NOT start checkout.

#### Scenario: Unconfigured processor
- **WHEN** a customer picks a processor that is not connected
- **THEN** checkout is refused and no charge is created
