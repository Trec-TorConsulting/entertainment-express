## ADDED Requirements

### Requirement: DOM HTML Sanitization Strategy
The system SHALL mandate that all raw HTML rendered in frontend portals (customer, owner, dispatch) is sanitized using DOMPurify before injection to prevent XSS.

#### Scenario: Rendering unsanitized inputs
- **WHEN** a user or the system attempts to render a string containing raw HTML tags like `<script>` or `onerror` handlers
- **THEN** the system MUST strip out the malicious payloads, rendering only safe HTML formatting.

### Requirement: Secure API Cookie Auth
The system SHALL provide endpoints or middleware to issue and validate HttpOnly, SameSite=Strict cookies containing the JWT auth tokens for web clients.

#### Scenario: User logs in via web portal
- **WHEN** a user successfully authenticates on a web portal
- **THEN** the backend MUST return the session JWT in a `Set-Cookie` header with the `HttpOnly` and `SameSite=Strict` flags.
