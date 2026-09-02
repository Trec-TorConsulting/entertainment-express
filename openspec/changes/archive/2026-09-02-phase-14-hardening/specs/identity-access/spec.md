## ADDED Requirements

### Requirement: Privileged Two-Step On This Site
The system SHALL require a TOTP two-step challenge for `EE Tenant Admin`, `SaaS Operator`, and `System Manager` when this site's `ee_require_2fa` is on. `Administrator` MAY be exempt for bench operations. Guests SHALL receive 403 on the toggle API.

#### Scenario: Flag off allows password-only
- **WHEN** `ee_require_2fa` is unset or `0`
- **THEN** existing password sessions continue without a two-step block

#### Scenario: Guest cannot toggle two-step
- **WHEN** a Guest or `EE Event Guest` (without `EE Customer`) calls the two-step toggle
- **THEN** the server returns 403 and site_config is unchanged

### Requirement: Login Lockout On This Site
The system SHALL count failed logins per user or IP on this site only and block further attempts for the lockout window after the threshold.

#### Scenario: Repeated failures lock
- **WHEN** a caller exceeds the failed-login threshold for this site
- **THEN** further login attempts are rejected for the lockout window and an audit entry is written without the password
