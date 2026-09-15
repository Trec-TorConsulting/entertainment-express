## Why

In Entertainment Express, the SaaS operator Desk (`/app`) is strictly reserved for platform administrators. Business owners run their entire company through the dedicated `/owner` portal. However, if a business owner cannot update underlying ERPNext settings—such as their Chart of Accounts, Tax Templates, Payment Gateways, Terms & Conditions, Email Accounts, Company Profile, or custom fields—they are locked out of critical administrative controls.

To guarantee that owners never need access to `/app`, this change designs a comprehensive **Enterprise Company Studio** directly inside `/owner`. It provides a dual-interface architecture:
1. **Curated, Guided Management Interfaces**: Beautiful, consumer-grade forms for standard setup (Company Profile, Branding, Tax Rates, Pricing Rules, Notification Templates, Staff Roles).
2. **Schema-Driven Master Configuration Editor**: A dynamic in-portal schema renderer that generates reactive create/read/update forms for any permitted ERPNext or custom DocType without exposing the raw Desk UI.

## What Changes

1. **Company Studio in `/owner/settings`**:
   - Company profile, fiscal year, default currency, and address management.
   - Tax Templates & Sales Tax Rule builder (state/local tax rate rules).
   - Chart of Accounts high-level mapping (Revenue, COGS, Tip Liability, Payment Processor Expense accounts).
   - Payment Gateway keys & webhook secret configurations (Stripe, Square, PayPal).
   - Communication & Notification templates editor (Email, SMS, WhatsApp triggers).
2. **Schema-Driven Master DocType Explorer (`/owner/admin/data`)**:
   - Dynamically inspects Frappe DocType metadata (`frappe.get_meta`).
   - Renders search, list, filter, and edit views for master records using portal-kit design primitives.
   - Preserves all server-side validation, child tables, and link lookups.
3. **Emergency Override Center (`/owner/operations/overrides`)**:
   - Safety compliance lock bypass (with required reason & audit log).
   - Manual event margin adjustments and project cost re-allocations.
   - Dispatch conflict hard override.

## Capabilities

### New Capabilities
- `owner-portal-complete-parity`: Full administrative parity for business owners inside `/owner` without requiring Frappe Desk (`/app`), featuring a curated Company Studio, schema-driven DocType editor, and auditable emergency override center.

### Modified Capabilities
- `owner-portal`: Add Company Studio, Master DocType Explorer, and Emergency Override Center.
- `identity-access`: Enforce owner-tier administrative permissions for deep ERP settings.

## Impact

- **Backend**:
  - `entertainment_express/api/owner_admin.py`: Dynamic schema metadata provider and master record CRUD gateway.
  - `entertainment_express/api/company_setup.py`: Curated company settings manager.
- **Frontend**:
  - React SPA in `/owner`: Adds `/owner/settings/studio`, `/owner/admin/data/:doctype`, and `/owner/operations/overrides`.
