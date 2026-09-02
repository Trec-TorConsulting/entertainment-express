## ADDED Requirements

### Requirement: Client Message Preferences
The paying customer SHALL set channel opt-in and quiet hours from `/client/account`. Guests SHALL NOT change preferences.

#### Scenario: Client opts out of SMS
- **WHEN** a customer turns off SMS
- **THEN** later promotional and optional SMS to that customer are not sent
