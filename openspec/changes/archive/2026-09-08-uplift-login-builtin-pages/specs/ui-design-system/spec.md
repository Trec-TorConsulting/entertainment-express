# Capability: UI Design System

## ADDED Requirements

### Requirement: Built-In and System Pages Visual Standard
The design system SHALL provide dedicated tokenized visual styling and layout templates for built-in platform pages (authentication at `/login`, password management at `/update-password`, and HTTP error pages 404, 500, 403) matching the high-fidelity visual aesthetic of `www.entx.app` (Outfit and Inter typography, glassmorphic surface elevation, subtle borders, focus rings, dark and light mode adaptation, and mobile responsiveness).

#### Scenario: User views login page on mobile
- **WHEN** a user opens `/login` on a mobile device
- **THEN** the authentication card scales appropriately with touch-friendly input sizes (minimum 44px hit targets), legible typography, and centered layout

#### Scenario: Dark mode preference detected
- **WHEN** a user with dark mode preference visits `/login` or `/update-password`
- **THEN** the auth shell renders with dark slate background, translucent glass card surface, high-contrast text, and crisp border highlights
