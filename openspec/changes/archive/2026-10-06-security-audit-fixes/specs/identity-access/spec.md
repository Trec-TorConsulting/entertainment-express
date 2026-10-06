## MODIFIED Requirements

### Requirement: API Tokens & Mobile Auth
The system SHALL issue HttpOnly, SameSite cookies for web portal sessions and JWT tokens for the mobile app, both revocable per user/device. The mobile app MUST securely store its token in a platform-backed Secure Store. Web portals MUST NOT store tokens in `localStorage` or `sessionStorage`.

#### Scenario: Web portal token issuance
- **WHEN** a user logs into the customer or dispatch portal
- **THEN** the backend issues the session token as a secure, HttpOnly, SameSite=Strict cookie instead of a raw token string in the JSON payload

#### Scenario: Mobile token issuance
- **WHEN** a crew member logs into the mobile app
- **THEN** a scoped, revocable token is issued and securely stored in `expo-secure-store` for subsequent API calls

#### Scenario: Token revocation
- **WHEN** an admin revokes a device token or forces logout
- **THEN** subsequent API calls with that token or cookie are rejected (401)
