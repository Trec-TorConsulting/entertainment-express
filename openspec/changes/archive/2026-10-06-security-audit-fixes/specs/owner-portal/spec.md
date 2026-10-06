## ADDED Requirements

### Requirement: Strict Owner UI Sanitization
The system SHALL strictly sanitize all user-generated or tenant-provided HTML content before rendering it in the owner portal to prevent DOM-based Cross-Site Scripting (XSS), particularly in components like the `RichContractEditor`.

#### Scenario: Rendering unsanitized contract inputs
- **WHEN** the portal retrieves and attempts to display rich text (such as contract terms)
- **THEN** it MUST use a recognized sanitization library (e.g., DOMPurify) and MUST NOT directly execute `dangerouslySetInnerHTML` with raw, unverified data
