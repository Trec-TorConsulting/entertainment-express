## 1. Company Studio & Curated Settings APIs

- [x] 1.1 Implement `entertainment_express/api/company_setup.py` with get/save endpoints for Company Details, Default Currency, and Fiscal Year
- [x] 1.2 Implement Tax Template & Sales Tax Rule manager endpoints
- [x] 1.3 Implement Chart of Accounts mapping manager (COGS, Income, Tip Liability, Merchant Fee accounts)
- [x] 1.4 Build Company Studio React views in `/owner/settings` (General, Taxes, Accounts, Integrations)

## 2. Schema-Driven Master Configuration Editor

- [x] 2.1 Implement `entertainment_express/api/owner_admin.py` with `get_schema_meta` returning sanitized field definitions and allowed doc options
- [x] 2.2 Implement generic REST CRUD wrapper for permitted business DocTypes
- [x] 2.3 Build React `SchemaDocTypeList` component with search, pagination, and sorting
- [x] 2.4 Build React `SchemaDocTypeForm` component rendering portal-kit form fields based on Frappe fieldtypes

## 3. Emergency Override Center

- [x] 3.1 Implement `entertainment_express/api/owner_overrides.py` with reason validation and audit logging
- [x] 3.2 Add safety certificate dispatch bypass with required sign-off
- [x] 3.3 Build Emergency Override Center view in `/owner/operations/overrides`

## 4. Verification & Tests

- [x] 4.1 Unit tests for Company Studio configuration persistence
- [x] 4.2 Unit tests for Schema-Driven DocType metadata sanitizer and permission boundaries
- [x] 4.3 Unit tests for Emergency Override audit logging
- [x] 4.4 Verify multi-tenant isolation ensuring owners cannot view or mutate other tenant configurations
