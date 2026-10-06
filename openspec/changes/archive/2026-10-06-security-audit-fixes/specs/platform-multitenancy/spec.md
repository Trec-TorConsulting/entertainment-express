## MODIFIED Requirements

### Requirement: Site-Per-Tenant Isolation
The system SHALL run each tenant on a dedicated Frappe site with its own MariaDB database, such that no application code path can read or write another tenant's data. Furthermore, within a tenant's database, all API queries processing user data MUST enforce `if_owner` constraints or similar explicit row-level permission logic to prevent Insecure Direct Object Reference (IDOR) attacks across users.

#### Scenario: Data isolation enforced at database boundary
- **WHEN** any tenant user or tenant-scoped job accesses data
- **THEN** all queries resolve only against that tenant's own site database, and there is no code path that connects a tenant request to another tenant's database

#### Scenario: Data isolation enforced at row-level boundary (IDOR prevention)
- **WHEN** an authenticated user attempts to read, update, or delete a record (e.g., booking, invoice) belonging to the tenant site
- **THEN** the API layer MUST explicitly validate that the requesting user's identity is the designated owner or holds the required role permissions for that specific row, denying access (403) otherwise.

#### Scenario: Isolation regression test
- **WHEN** the multi-tenant isolation test suite runs
- **THEN** it provisions two test tenants, writes distinct records to each, and asserts neither tenant's API or portal can retrieve the other's records
