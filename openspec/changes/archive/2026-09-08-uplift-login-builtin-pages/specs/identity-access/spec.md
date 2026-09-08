# Capability: Identity & Access

## ADDED Requirements

### Requirement: Uplifted Authentication & Password Reset Interfaces
The system SHALL serve an uplifted, modern, and accessible user interface for the login flow (`/login#login`), password recovery (`/login#forgot`), two-factor authentication challenge (`/login#email_otp`, `/login#totp`), and password reset/update (`/update-password`), with seamless brand token adaptation for both base SaaS and tenant white-labeled sites.

#### Scenario: User toggles password visibility
- **WHEN** a user enters a password on `/login` or `/update-password` and clicks the eye icon
- **THEN** the input type switches between password and text, maintaining keyboard focus

#### Scenario: User requests password reset link
- **WHEN** a user navigates to `/login#forgot` and submits their registered email
- **THEN** a clear, accessible confirmation state is displayed using styled feedback banners without disruptive browser alerts

#### Scenario: User completes password update
- **WHEN** a user arrives at `/update-password` with a valid reset key and submits a new compliant password
- **THEN** real-time feedback indicates requirement satisfaction and redirects to the appropriate destination upon success
