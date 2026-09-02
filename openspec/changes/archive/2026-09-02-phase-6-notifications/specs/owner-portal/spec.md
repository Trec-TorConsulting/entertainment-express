## ADDED Requirements

### Requirement: Message Copy Without Desk
The owner portal SHALL list and edit notification templates and recent deliveries on `/owner/automations` without Desk. Copy SHALL use message language, never DocType names.

#### Scenario: Owner turns off SMS on a template
- **WHEN** an `EE Tenant Admin` removes sms from a template’s channels
- **THEN** later sends of that template do not use SMS

#### Scenario: Guest denied
- **WHEN** a guest calls a message-template API
- **THEN** access is denied
