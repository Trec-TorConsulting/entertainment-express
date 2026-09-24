## ADDED Requirements

### Requirement: WYSIWYG Visual Contract & Template Editor
The system SHALL provide a visual WYSIWYG rich text editor with formatting controls (headings, bold, italic, underline, lists, alignment, dividers, and tables) for managing contract templates and agreement instances.

#### Scenario: Visual formatting of contract clauses
- **WHEN** the owner uses the WYSIWYG formatting toolbar to style headings or lists
- **THEN** the editor applies clean, compliant inline HTML formatting and updates the contract body.

### Requirement: Interactive Variable Placeholder Chips
The system SHALL display organized, clickable variable chips for client, event, company, and financial placeholders.

#### Scenario: Inserting placeholder chips
- **WHEN** the owner clicks a variable chip like `+ {{ customer_name }}`
- **THEN** the tag is appended directly into the active contract body.

### Requirement: AI Legal & Clause Generation
The system SHALL provide an AI drafting assistant endpoint to generate, polish, and structure legal clauses for event contracts.

#### Scenario: AI clause generation
- **WHEN** the owner requests AI assistance to draft a cancellation policy or legal clause
- **THEN** the system generates formatted HTML clause content ready for insertion into the contract.
