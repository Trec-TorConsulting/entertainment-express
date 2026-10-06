## ADDED Requirements

### Requirement: Secure Storage for Authentication Tokens
The mobile app SHALL utilize platform-specific secure enclaves (e.g., iOS Keychain, Android Keystore) via `expo-secure-store` to store sensitive identity tokens (JWT). It MUST NOT store sensitive authentication tokens in plain text in `AsyncStorage`.

#### Scenario: Storing JWT tokens
- **WHEN** a crew member logs into the app and receives a JWT
- **THEN** the application persists the token using `expo-secure-store` ensuring hardware-backed encryption where available
