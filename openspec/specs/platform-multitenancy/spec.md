# Capability: Platform Multi-Tenancy

## Purpose
Provide isolated, per-company tenancy using Frappe's **site-per-tenant** model. Each tenant company runs on
its own Frappe site + MariaDB database, addressed by a wildcard subdomain. This capability owns tenant
**provisioning, lifecycle, addressing, and isolation guarantees**. It does NOT own plans/billing (see
`saas-control-plane`) — it only executes the technical creation/teardown of sites.

### Data Model (lives on the CONTROL-PLANE site)
- **Tenant**: `tenant_slug` (unique, DNS-safe), company_name, status (`pending|provisioning|active|suspended|deprovisioning|deleted`), site_name (`{slug}.app.{base_domain}`), plan (link), created_on, activated_on, region, primary_contact, notes.
- **Provisioning Job**: tenant (link), action (`create|suspend|resume|deprovision|reprovision`), state (`queued|running|succeeded|failed`), log, attempts, provider_ref, timestamps.
- **Tenant Domain**: tenant (link), hostname, type (`default|custom`), tls_status, verified (bool).

> Tenant business data (bookings, invoices, etc.) lives INSIDE each tenant site, never on the control plane.

## Requirements

### Requirement: Site-Per-Tenant Isolation
The system SHALL run each tenant on a dedicated Frappe site with its own MariaDB database, such that no
application code path can read or write another tenant's data.

#### Scenario: Data isolation enforced at database boundary
- **WHEN** any tenant user or tenant-scoped job accesses data
- **THEN** all queries resolve only against that tenant's own site database, and there is no code path that
  connects a tenant request to another tenant's database

#### Scenario: Isolation regression test
- **WHEN** the multi-tenant isolation test suite runs
- **THEN** it provisions two test tenants, writes distinct records to each, and asserts neither tenant's API
  or portal can retrieve the other's records

### Requirement: Automated Tenant Provisioning
The system SHALL provision a new tenant automatically and idempotently: create the site, install `erpnext`
and `entertainment_express`, run tenant bootstrap, register the hostname, and mark the tenant active.

#### Scenario: New tenant provisioned end to end
- **WHEN** the control plane requests provisioning for `tenant_slug = acmedjs`
- **THEN** a Frappe site `acmedjs.app.{base_domain}` is created with `erpnext` and `entertainment_express`
  installed, default roles/service catalog seeded, hostname routed via ingress, and Tenant status set to
  `active`

#### Scenario: Provisioning is idempotent
- **WHEN** a provisioning job is retried after a partial failure
- **THEN** already-completed steps are detected and skipped, and the job converges to `active` without
  creating duplicate sites or duplicate seed data

#### Scenario: Slug validation
- **WHEN** a tenant slug is submitted that is not DNS-safe, is reserved (`admin`, `www`, `api`), or already
  exists
- **THEN** provisioning is rejected with a clear validation error before any site is created

### Requirement: Tenant Lifecycle Management
The system SHALL support suspend, resume, and deprovision (with backup) of a tenant.

#### Scenario: Suspend tenant
- **WHEN** the control plane suspends a tenant (e.g., non-payment)
- **THEN** the tenant site returns a suspension notice for all users, background automations pause, and data
  is retained

#### Scenario: Resume tenant
- **WHEN** a suspended tenant is resumed
- **THEN** access and automations restore to their prior state with no data loss

#### Scenario: Deprovision with backup
- **WHEN** a tenant is deprovisioned
- **THEN** a full site backup is written to object storage before the site is archived/removed, and the
  Tenant record retains the backup reference

### Requirement: Wildcard Subdomain Addressing
The system SHALL address each tenant at `{tenant_slug}.app.{base_domain}` via wildcard DNS and wildcard TLS,
and route the control plane at `admin.{base_domain}`.

#### Scenario: Tenant reachable at its subdomain
- **WHEN** an active tenant `acmedjs` is provisioned
- **THEN** requests to `https://acmedjs.app.{base_domain}` resolve to that tenant's site over valid TLS

#### Scenario: Custom domain mapping (optional)
- **WHEN** a tenant configures a verified custom domain via CNAME
- **THEN** requests to the custom domain resolve to the tenant site with issued TLS, in addition to the
  default subdomain

### Requirement: Custom Domain Stored On This Site
The system SHALL let an `EE Tenant Admin` request a custom hostname for this site, verify it resolves to the same addresses as this site's default host, and then add it to this site's domain list. APIs SHALL NOT accept a tenant or site argument that switches databases.

#### Scenario: Unverified hostname is not live
- **WHEN** an owner saves a hostname that does not yet resolve to this site
- **THEN** it is stored as unverified and is not added to the live domain list

#### Scenario: Guest cannot add a domain
- **WHEN** a Guest or `EE Event Guest` requests a custom hostname
- **THEN** the server returns 403
