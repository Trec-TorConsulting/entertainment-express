## ADDED Requirements

### Requirement: Strict Client UI Sanitization
The system SHALL strictly sanitize all user-generated or tenant-provided HTML content before rendering it in the customer portal to prevent DOM-based Cross-Site Scripting (XSS).

#### Scenario: Rendering unsanitized inputs
- **WHEN** the portal retrieves and attempts to display rich text (such as contract terms or event notes)
- **THEN** it MUST use a recognized sanitization library (e.g., DOMPurify) and MUST NOT directly execute `dangerouslySetInnerHTML` with raw, unverified data
